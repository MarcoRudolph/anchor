/**
 * auth-resolve-telegram — Hermes-tier edge function (ADR-0010)
 *
 * Resolves a Telegram user_id to the corresponding anchor_user_id.
 * Called by Hermes at the start of each inbound Telegram message to
 * identify which account the message belongs to.
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns a contract-shaped fixture. Wave 1 replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { AuthResolveTelegramResponse } from "../_shared/contract.ts";

const schema = z.object({
  telegramUserId: z.number().int(),
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

  const response: AuthResolveTelegramResponse = {
    anchorUserId: "00000000-0000-7000-a000-000000000001",
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
