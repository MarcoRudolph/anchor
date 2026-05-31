/**
 * Magic-link request helper (ADR-0006 / DEC-0006).
 *
 * Sends a Supabase Auth magic-link email to the given address.
 * Uses @supabase/ssr createServerClient in a server-only context.
 *
 * INVARIANTS (T-00-18 / DEC-0006):
 *  - No credential-based auth path exists. signInWithOtp is the only sign-in method.
 *  - Rate-limited to 3 sends per email per hour (DEC-0017).
 *  - Single-use, short-TTL link — Supabase Auth enforces this server-side.
 *  - HttpOnly session cookie is set by the callback Route Handler, not here.
 *
 * Usage:
 *   const result = await signInWithMagicLink(email, callbackUrl, cookies);
 *   if (!result.ok) handleError(result.error);
 */

import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ---- Zod schema for email validation (ASVS V5) ----

export const EmailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email address too long");

// ---- In-memory rate-limiter (3/hr per email) ----
// A lightweight per-process store. In production this will be moved to Redis
// or a DB table once Hermes/Wave 1 adds the send-log table. For Phase 0 this
// prevents abuse in a single process (e.g. during local dev or Vercel serverless).

interface RateEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SENDS_PER_HOUR = 3;

/** Returns true if the email has exceeded the 3/hr send rate-limit. */
export function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(email);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    // First send or window expired — reset
    rateLimitStore.set(email, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_SENDS_PER_HOUR) {
    return true;
  }

  entry.count += 1;
  return false;
}

// ---- Supabase client factory ----

/**
 * Creates a server-side Supabase client using the @supabase/ssr cookie adapter.
 * Called inside Route Handlers / Server Actions where the cookies() API is available.
 */
export async function createSupabaseServerClient() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // mutated — ignore and let the Route Handler set them.
          }
        },
      },
    }
  );
}

// ---- Magic-link request ----

export interface MagicLinkResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends a magic-link email to the given address.
 *
 * @param email       - The user's email address (validated with zod).
 * @param callbackUrl - The URL Supabase Auth will redirect to after link click.
 *                      Must be the /api/auth/callback Route Handler URL.
 */
export async function signInWithMagicLink(
  email: string,
  callbackUrl: string
): Promise<MagicLinkResult> {
  // Validate email (ASVS V5 / T-00-20)
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: "invalid_email" };
  }

  const normalizedEmail = parsed.data.toLowerCase().trim();

  // Rate-limit: 3 sends per email per hour (DEC-0017)
  if (isRateLimited(normalizedEmail)) {
    return { ok: false, error: "rate_limited" };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: callbackUrl,
      // shouldCreateUser: true is the default — new emails create accounts
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
