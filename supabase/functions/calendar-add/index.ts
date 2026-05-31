/**
 * calendar-add — Hermes-tier edge function (ADR-0010 / ADR-0008)
 *
 * Called by Hermes to write a Calendar Addition on behalf of the user.
 * Buffers as Pending Calendar Addition if connection is disconnected_external.
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns a contract-shaped fixture. Wave 2 (calendar) replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { CalendarAddResponse } from "../_shared/contract.ts";

const schema = z.object({
  anchorUserId: z.string().uuid(),
  summary: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().optional(),
  description: z.string().optional(),
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

  const response: CalendarAddResponse = {
    ok: true,
    eventId: "stub-google-event-id-001",
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
