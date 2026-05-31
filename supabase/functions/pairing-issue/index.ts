/**
 * pairing-issue — user-tier edge function (ADR-0010 / DEC-0007)
 *
 * Issues an 8-char Crockford Base32 pairing code bound to the authenticated user.
 * Rate-limited to 5/hr per account (enforced here; wave owner wires to DB count).
 *
 * Tier: requireUser (user session JWT, RLS-scoped)
 * STUB: returns a contract-shaped fixture. Wave 1 replaces internals.
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import type { PairingIssueResponse } from "../_shared/contract.ts";

// Guard: only execute Deno.serve in the Deno runtime (not when imported in Node tests)
export async function handler(req: Request): Promise<Response> {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Auth: user-tier only
  let userCtx: { anchorUserId: string };
  try {
    userCtx = await requireUser(req);
  } catch (e) {
    return e as Response;
  }

  // Stub fixture — wave owner replaces with real pairing_code insert + rate-limit check
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const code = "A3K7MT2P"; // fixture — real impl generates Crockford Base32

  const body: PairingIssueResponse = {
    code,
    expiresAt,
    deepLink: `https://t.me/anchor_bot?start=${code}`,
  };

  void userCtx; // used for auth only in stub

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

// Only start the server when running in Deno (not when imported in Node/Vitest)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((globalThis as any).Deno?.serve) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Deno.serve(handler);
}
