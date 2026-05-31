/**
 * Edge-function client for Hermes (ADR-0010 / DEC-0010).
 *
 * Calls Supabase Edge Functions over the VPS loopback (warm, sub-ms).
 * Auth: service-role JWT bearer + x-hermes-secret header (two-tier guard).
 *
 * Secrets are read from environment variables ONLY — never hardcoded.
 * Required env vars:
 *   EDGE_BASE             — e.g. http://localhost:54321 (loopback Supabase URL)
 *   SUPABASE_SERVICE_ROLE_KEY — service-role JWT
 *   HERMES_SHARED_SECRET  — shared secret verified by requireHermes()
 */

const EDGE_BASE = process.env.EDGE_BASE ?? '';
const SERVICE_ROLE_JWT = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const HERMES_SHARED_SECRET = process.env.HERMES_SHARED_SECRET ?? '';

if (!EDGE_BASE) {
  console.error('[hermes/edge-client] EDGE_BASE env var is not set');
}
if (!SERVICE_ROLE_JWT) {
  console.error('[hermes/edge-client] SUPABASE_SERVICE_ROLE_KEY env var is not set');
}
if (!HERMES_SHARED_SECRET) {
  console.error('[hermes/edge-client] HERMES_SHARED_SECRET env var is not set');
}

/**
 * Calls a Supabase Edge Function by name with the Hermes two-tier auth.
 * Returns the raw Response — callers are responsible for checking .ok and parsing JSON.
 */
export async function callEdge(name: string, body: unknown): Promise<Response> {
  const url = `${EDGE_BASE}/functions/v1/${name}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${SERVICE_ROLE_JWT}`,
      'x-hermes-secret': HERMES_SHARED_SECRET,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
