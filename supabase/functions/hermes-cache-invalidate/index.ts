/**
 * hermes-cache-invalidate — Hermes-tier edge function (ADR-0010)
 *
 * Called by the Stripe webhook handler when a subscription changes.
 * Forwards the invalidation signal to Hermes so it flushes its 30s
 * plan-state TTL cache (per ADR-0010 plan-state cache invalidation design).
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns a contract-shaped fixture. Wave 1 (billing) replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { HermesCacheInvalidateResponse } from "../_shared/contract.ts";

const schema = z.object({
  anchorUserId: z.string().uuid(),
  reason: z.enum(["plan_changed", "subscription_deleted"]),
});

export async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    requireHermes(req);
  } catch (e) {
    return e as Response;
  }

  let body: z.infer<typeof schema>;
  try {
    const raw = await req.json();
    body = schema.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  void body;

  const response: HermesCacheInvalidateResponse = { ok: true };

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
