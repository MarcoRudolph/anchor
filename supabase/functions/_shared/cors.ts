/**
 * CORS headers for Anchor edge functions.
 *
 * Returned on every OPTIONS preflight and included in all non-error responses.
 * The webapp origin is restricted to the configured ANCHOR_WEBAPP_URL or
 * falls back to * in local dev (Supabase local stack does not set origins).
 */
import { env } from "./env.ts";

export function corsHeaders(): HeadersInit {
  const origin = env("ANCHOR_WEBAPP_URL") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-hermes-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * Returns a 204 No Content preflight response with CORS headers.
 * Call at the top of every handler before any auth checks.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  return null;
}
