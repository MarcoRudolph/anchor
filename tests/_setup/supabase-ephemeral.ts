/**
 * Ephemeral local Supabase test harness (A9 — Validation Architecture).
 *
 * IMPORTANT CAVEAT (A9): The Supabase CLI local stack uses the same Postgres
 * extension set and RLS engine as self-hosted Supabase (same Docker images),
 * so it is a valid proxy for the VPS prod environment. It is NOT the same as
 * Supabase Cloud — some Cloud-only features (e.g. pg_graphql, Realtime channel
 * routing differences) may diverge. For Phase 0, all schema-RLS and edge-fn
 * integration tests run against this ephemeral stack.
 *
 * RUNTIME PREREQUISITE:
 *   The Supabase CLI must be installed and Docker must be running.
 *   Start the local stack before running integration tests:
 *     supabase start
 *   Stop after tests:
 *     supabase stop
 *   Or use the globalSetup/globalTeardown hooks below with Vitest.
 *
 * USAGE IN TESTS:
 *   import { getEphemeralSupabase } from '@/tests/_setup/supabase-ephemeral'
 *   const { client, url, anonKey } = getEphemeralSupabase()
 *
 * The connection details are read from environment variables set by
 * `supabase start` output (or from the .env.test file for CI):
 *   SUPABASE_URL          — http://localhost:54321
 *   SUPABASE_ANON_KEY     — local anon JWT
 *   SUPABASE_SERVICE_ROLE_KEY — local service-role JWT
 *
 * In CI the ephemeral stack is booted via:
 *   supabase start --workdir .
 * and the output variables are exported into the job environment.
 *
 * See: https://supabase.com/docs/guides/local-development
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface EphemeralSupabaseContext {
  /** Supabase client authenticated as the anon role */
  client: SupabaseClient;
  /** Supabase client authenticated as the service-role (bypasses RLS) */
  adminClient: SupabaseClient;
  /** Local Supabase API URL (http://localhost:54321 by default) */
  url: string;
  /** Anon key for the local stack */
  anonKey: string;
  /** Service-role key for the local stack (never use in browser code) */
  serviceRoleKey: string;
}

const DEFAULT_URL = 'http://localhost:54321';

/**
 * Returns a pair of Supabase clients (anon + service-role) pointed at the
 * ephemeral local stack. Reads connection strings from environment variables.
 *
 * Throws if required env vars are missing — fail fast in CI.
 */
export function getEphemeralSupabase(): EphemeralSupabaseContext {
  const url = process.env.SUPABASE_URL ?? DEFAULT_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anonKey) {
    throw new Error(
      '[supabase-ephemeral] SUPABASE_ANON_KEY is not set.\n' +
        'Run `supabase start` and export the output keys, or populate .env.test.',
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      '[supabase-ephemeral] SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
        'Run `supabase start` and export the output keys, or populate .env.test.',
    );
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { client, adminClient, url, anonKey, serviceRoleKey };
}

// ---------------------------------------------------------------------------
// Vitest global setup / teardown hooks (optional — use if you want the CLI
// to boot/stop Supabase automatically around the test suite)
// ---------------------------------------------------------------------------

import { execSync } from 'child_process';

/**
 * Boots the ephemeral Supabase stack.
 * Wire to vitest.config.ts → test.globalSetup for full automation.
 *
 * DEFERRED: The actual global setup wiring is done in plan 00-03 (schema-RLS
 * tests) when the first integration tests are authored against this harness.
 */
export async function setupEphemeralSupabase(): Promise<void> {
  console.log('[supabase-ephemeral] Starting local Supabase stack…');
  try {
    execSync('supabase start', { stdio: 'inherit', timeout: 120_000 });
    console.log('[supabase-ephemeral] Local Supabase stack is up.');
  } catch (err) {
    throw new Error(
      '[supabase-ephemeral] `supabase start` failed. ' +
        'Ensure the Supabase CLI is installed and Docker is running.\n' +
        String(err),
    );
  }
}

/**
 * Stops the ephemeral Supabase stack.
 * Wire to vitest.config.ts → test.globalTeardown.
 */
export async function teardownEphemeralSupabase(): Promise<void> {
  console.log('[supabase-ephemeral] Stopping local Supabase stack…');
  try {
    execSync('supabase stop', { stdio: 'inherit', timeout: 60_000 });
    console.log('[supabase-ephemeral] Local Supabase stack stopped.');
  } catch {
    // Non-fatal — stack may already be stopped or CLI may not be installed
    console.warn('[supabase-ephemeral] `supabase stop` failed (non-fatal).');
  }
}
