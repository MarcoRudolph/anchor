/**
 * Two-tier edge-function auth guard (Pattern 2 / ADR-0010).
 *
 * - requireHermes: verifies BOTH the service-role bearer JWT AND the
 *   x-hermes-secret header. Throws a Response(403) if either is wrong.
 *   Used by: pairing-redeem, turn-start, turn-deliver, turn-fail,
 *            memory-store, diary-append, calendar-add,
 *            hermes-cache-invalidate, auth-resolve-telegram.
 *
 * - requireUser: verifies the user session JWT via the Supabase client.
 *   Returns the anchor_user_id on success. Throws a Response(401) on failure.
 *   Used by: pairing-issue, plan-state, calendar-list, memory-recall.
 *
 * CROSS-RUNTIME NOTE (Pitfall A):
 *   Uses env() helper instead of Deno.env.get() at top-level so this module
 *   is safe to import in Node (Vitest tests) as well as Deno (prod).
 */

import { env } from "./env.ts";

// ---------------------------------------------------------------------------
// Hermes-tier guard (service-role JWT + x-hermes-secret)
// ---------------------------------------------------------------------------

/**
 * Validates that the request carries valid Hermes credentials.
 *
 * Checks:
 *  1. x-hermes-secret header matches HERMES_SHARED_SECRET env var.
 *  2. Authorization bearer matches SUPABASE_SERVICE_ROLE_KEY env var.
 *
 * Throws a Response(403) if either check fails so the caller can
 * `return await requireHermes(req)` in a try/catch or use it as:
 *   const guard = requireHermes(req); if (guard instanceof Response) return guard;
 */
export function requireHermes(req: Request): void {
  const secret = req.headers.get("x-hermes-secret");
  const expectedSecret = env("HERMES_SHARED_SECRET");

  if (!expectedSecret || secret !== expectedSecret) {
    throw new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Also verify the bearer is the service-role JWT
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey || bearer !== serviceRoleKey) {
    throw new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ---------------------------------------------------------------------------
// User-tier guard (user session JWT → anchor_user_id)
// ---------------------------------------------------------------------------

export interface UserContext {
  anchorUserId: string;
}

/**
 * Validates the user session JWT by calling the Supabase Auth getUser endpoint.
 *
 * Returns { anchorUserId } on success.
 * Throws a Response(401) if the JWT is missing or invalid.
 *
 * NOTE: anchor_user.id = auth.users.id (DEC-0013 / Pitfall 4).
 * The auth.users.id IS the anchor_user_id — no extra lookup needed here.
 */
export async function requireUser(req: Request): Promise<UserContext> {
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  if (!jwt) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify JWT via Supabase Auth REST (works in both Deno and Node fetch environments)
  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: anonKey,
    },
  });

  if (!res.ok) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await res.json();
  const userId: string | undefined = user?.id;

  if (!userId) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { anchorUserId: userId };
}
