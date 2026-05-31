/**
 * turn-start — Hermes-tier edge function (ADR-0010)
 *
 * Called by Hermes at the start of each conversation turn.
 * Checks plan state and daily minute budget.
 * turnId is an idempotency key — a retry with the same turnId is a no-op.
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns a contract-shaped fixture. Wave 1 replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { TurnStartResponse } from "../_shared/contract.ts";

const schema = z.object({
  anchorUserId: z.string().uuid(),
  turnId: z.string().uuid(),
  channel: z.enum(["telegram", "voice"]),
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

  const response: TurnStartResponse = {
    ok: true,
    plan: "free",
    dailyMinutesRemaining: 15,
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
