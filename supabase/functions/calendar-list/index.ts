/**
 * calendar-list — user-tier edge function (ADR-0010 / ADR-0008)
 *
 * Returns upcoming calendar events for the authenticated user.
 * Requires google_connection.connection_state = connected.
 *
 * Tier: requireUser (user session JWT, RLS-scoped)
 * STUB: returns a contract-shaped fixture. Wave 2 (calendar) replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import type { CalendarListResponse } from "../_shared/contract.ts";

const schema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await requireUser(req);
  } catch (e) {
    return e as Response;
  }

  let body: z.infer<typeof schema> = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      const raw = await req.json();
      body = schema.parse(raw);
    }
  } catch {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  void body;

  const response: CalendarListResponse = {
    events: [
      {
        id: "stub-event-001",
        summary: "Stub Calendar Event",
        startsAt: new Date(Date.now() + 86400_000).toISOString(),
        endsAt: new Date(Date.now() + 90000_000).toISOString(),
        location: null,
      },
    ],
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
