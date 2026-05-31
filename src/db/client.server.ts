import 'server-only';

// src/db/client.server.ts — SERVER-ONLY service-role Drizzle client (threat T-00-09).
//
// The `import 'server-only'` above makes this module a HARD BUILD ERROR if it is ever pulled into
// browser/client-component code. The service-role connection BYPASSES RLS, so it must only be
// reachable from trusted server contexts: Supabase Edge Functions, Next.js Route Handlers, and the
// Hermes container. Handlers using this client are responsible for their own per-anchor_user_id
// authorization (DEC-0010, Pattern 2) because RLS is not enforcing it here.
//
// Never import this from `./client.ts` (which is browser-safe) or the guard is defeated.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import type { AnchorDb } from './client';

/**
 * Service-role Drizzle client (RLS BYPASSED). Server contexts only.
 *
 * @param connectionString postgres:// URL for the service-role / superuser connection. Defaults to
 *   `process.env.DATABASE_URL` (the service-role connection in server env). Never expose this URL or
 *   the resulting client to the browser.
 */
export function createServiceRoleDb(connectionString = process.env.DATABASE_URL!): AnchorDb {
  const sql = postgres(connectionString, { prepare: false });
  return drizzle(sql, { schema });
}
