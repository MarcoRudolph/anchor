/**
 * plan-state — user-tier edge function (ADR-0010)
 *
 * Returns the authenticated user's current plan (free/pro),
 * remaining daily minutes, and subscription end date.
 * Hermes caches this with a 30s TTL.
 *
 * Tier: requireUser (user session JWT, RLS-scoped)
 * STUB: returns a contract-shaped fixture. Wave 1 replaces internals.
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import type { PlanStateResponse } from "../_shared/contract.ts";

export async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await requireUser(req);
  } catch (e) {
    return e as Response;
  }

  const response: PlanStateResponse = {
    plan: "free",
    dailyMinutesRemaining: 15,
    currentPeriodEnd: null,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((globalThis as any).Deno?.serve) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Deno.serve(handler);
}
