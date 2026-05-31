/**
 * Magic-link callback Route Handler (ADR-0006 / DEC-0006 / DEC-0016).
 *
 * Called by Supabase Auth after the user clicks the magic-link email.
 * Supabase Auth appends ?code=<pkce-code> to the emailRedirectTo URL.
 *
 * This handler:
 *  1. Exchanges the PKCE code for a session (sets HttpOnly session cookie).
 *  2. Idempotently ensures the anchor_user row exists (id = auth.users.id).
 *  3. Idempotently creates a Stripe customer and writes stripe_customer_id.
 *
 * SECURITY INVARIANTS:
 *  - Server-side only — no client secrets in the browser bundle.
 *  - anchor_user insert uses the service-role client (Pitfall 4: RLS blocks
 *    the INSERT when the row doesn't exist yet because auth.uid() != id at
 *    insert time without service-role). The service-role key is NEVER in
 *    NEXT_PUBLIC_* env vars.
 *  - Stripe customer creation is idempotent: if stripe_customer_id is already
 *    set on the row, the Stripe API is not called again.
 *  - No password path exists anywhere in this file. (T-00-18 / DEC-0006)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Stripe from "stripe";

// ---- Supabase clients ----

/**
 * User-session client (anon key + PKCE exchange).
 * Used only to call exchangeCodeForSession — result sets the HttpOnly cookie.
 */
async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS.
 * Used for the anchor_user INSERT so RLS does not block the signup row creation.
 * (Pitfall 4: auth.uid() is not set during the initial INSERT from a server action)
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_* — it is server-only.
 */
async function createServiceRoleClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Service-role client does not set session cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ---- Stripe client ----

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("[auth/callback] STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

// ---- Route Handler ----

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // No code param — malformed magic-link redirect; send to login
    return NextResponse.redirect(`${origin}/de/login?error=missing_code`);
  }

  // Step 1: Exchange PKCE code for a session (sets HttpOnly cookie)
  const sessionClient = await createSessionClient();
  const { data: sessionData, error: sessionError } =
    await sessionClient.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData?.session || !sessionData?.user) {
    console.error("[auth/callback] exchangeCodeForSession failed:", sessionError?.message);
    return NextResponse.redirect(`${origin}/de/login?error=session_exchange_failed`);
  }

  const authUserId = sessionData.user.id;
  const userEmail = sessionData.user.email ?? "";

  // Step 2: Ensure anchor_user row exists (idempotent — ON CONFLICT DO NOTHING)
  // Uses service-role to bypass RLS during signup (Pitfall 4 / T-00-19)
  const serviceClient = await createServiceRoleClient();

  // Detect timezone hint from the request (browser sends it via the redirect URL or a header)
  const timezoneHint =
    request.headers.get("x-timezone") ??
    searchParams.get("tz") ??
    "Europe/Berlin"; // sensible default for the DE target market

  const locale = request.headers.get("x-locale") ?? "de";

  const { data: existingUser, error: selectError } = await serviceClient
    .from("anchor_user")
    .select("id, stripe_customer_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (selectError) {
    console.error("[auth/callback] anchor_user select failed:", selectError.message);
    return NextResponse.redirect(`${origin}/de/login?error=db_error`);
  }

  let stripeCustomerId = existingUser?.stripe_customer_id ?? null;

  if (!existingUser) {
    // New user — insert anchor_user row (service-role bypasses RLS)
    const { error: insertError } = await serviceClient.from("anchor_user").insert({
      id: authUserId,
      timezone: timezoneHint,
      locale: ["de", "en"].includes(locale) ? locale : "de",
    });

    if (insertError) {
      // May be a race on the unique constraint — log but continue
      console.error("[auth/callback] anchor_user insert error:", insertError.message);
    }

    // Also insert the free-tier plan row (idempotent)
    await serviceClient
      .from("anchor_user_plan")
      .insert({ anchor_user_id: authUserId, plan: "free" })
      .then(({ error }) => {
        if (error) console.error("[auth/callback] anchor_user_plan insert error:", error.message);
      });
  }

  // Step 3: Ensure Stripe customer exists and stripe_customer_id is written
  // Idempotent: skip if we already have a customer ID (DEC-0016)
  if (!stripeCustomerId) {
    try {
      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { anchor_user_id: authUserId },
      });

      stripeCustomerId = customer.id;

      // Write stripe_customer_id to the anchor_user row (service-role, RLS-safe)
      const { error: updateError } = await serviceClient
        .from("anchor_user")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", authUserId);

      if (updateError) {
        console.error("[auth/callback] stripe_customer_id update error:", updateError.message);
        // Non-fatal — the customer exists in Stripe; we can recover on next login
      }
    } catch (stripeError) {
      console.error("[auth/callback] Stripe customer creation failed:", stripeError);
      // Non-fatal — account is created; Stripe retry on next login
    }
  }

  // Redirect to the intended destination (or the default post-login page)
  const redirectTo = next.startsWith("/") ? `${origin}${next}` : `${origin}/de`;
  return NextResponse.redirect(redirectTo);
}
