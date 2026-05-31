/**
 * turn-deliver — Hermes-tier edge function (ADR-0010)
 *
 * Called by Hermes after a turn completes. Records duration for billing.
 * Idempotent on turnId — retries with the same id do not double-count minutes.
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns a contract-shaped fixture. Wave 1 replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { TurnDeliverResponse } from "../_shared/contract.ts";

const schema = z.object({
  anchorUserId: z.string().uuid(),
  turnId: z.string().uuid(),
  durationSeconds: z.number().nonnegative(),
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

  const response: TurnDeliverResponse = { ok: true };

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
