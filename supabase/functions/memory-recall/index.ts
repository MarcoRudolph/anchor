/**
 * memory-recall — user-tier edge function (ADR-0010 / DEC-0004)
 *
 * Executes a semantic search over the user's memory index.
 * Returns ranked excerpts with relevance scores.
 *
 * Tier: requireUser (user session JWT, RLS-scoped)
 * STUB: returns a contract-shaped fixture. Wave 2 (memory) replaces internals.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import type { MemoryRecallResponse } from "../_shared/contract.ts";

const schema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
});

export async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await requireUser(req);
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

  const response: MemoryRecallResponse = {
    results: [
      {
        id: "00000000-0000-7000-a000-000000000099",
        excerpt: "Stub memory fact for testing",
        score: 0.92,
        occurredAt: new Date().toISOString(),
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
