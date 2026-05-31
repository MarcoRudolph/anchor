-- 0000_extensions_smoke.sql
-- Smoke migration: proves extension availability + supabase_realtime publication
-- on the real self-hosted Supabase (Hostinger VPS) BEFORE schema is frozen in 00-03.
--
-- IDEMPOTENT: safe to re-run. Creates NO kept tables; all probes clean up after themselves.
-- Fail-fast: ON_ERROR_STOP=1 in the runner aborts on first error. The uuid_generate_v7()
-- probe additionally RAISES explicitly so a missing pg_uuidv7 is a loud, actionable failure.
--
-- Required by: plan 00-01 (VPS/Supabase environment smoke)
-- Consumed by:  plan 00-03 (schema freeze — needs to know which UUIDv7 strategy to use)

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------

-- pgcrypto: refresh-token envelope encryption (DEC-0008)
create extension if not exists pgcrypto;

-- pg_uuidv7: uuid_generate_v7() as column default on all PK columns (DEC-0013)
-- If this fails the VPS image does not have pg_uuidv7 installed at the OS level.
-- Fallback: uuidv7 1.2.1 npm package generating IDs app-side (see docs/handoff.md).
create extension if not exists pg_uuidv7;

-- pg_cron: scheduled jobs calling edge functions via net.http_post (DEC-0019)
create extension if not exists pg_cron;

-- pg_net: net.http_post for cron -> edge function calls (DEC-0019)
create extension if not exists pg_net;

-- vector: memory embeddings — column type frozen now, logic in Phase 2 (DEC-0004)
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- 2. UUIDv7 probe — fails loudly if pg_uuidv7 is unavailable
-- ---------------------------------------------------------------------------
-- If pg_uuidv7 was silently skipped above (extension already present but function
-- missing, or some partial install), this probe surfaces it immediately.
-- The calling runner (ON_ERROR_STOP=1) will abort; operator must choose the
-- uuidv7 1.2.1 npm fallback and record the decision in docs/handoff.md.

do $$
begin
  perform uuid_generate_v7();
exception
  when undefined_function then
    raise exception
      'pg_uuidv7 unavailable — uuid_generate_v7() not found. '
      'Use the uuidv7 1.2.1 npm fallback (app-side ID generation). '
      'Record the chosen strategy in docs/handoff.md before running plan 00-03.';
end
$$;

-- ---------------------------------------------------------------------------
-- 3. supabase_realtime publication probe — ADD / REPLICA IDENTITY / DROP
-- ---------------------------------------------------------------------------
-- Creates a throwaway table, adds it to the supabase_realtime publication with
-- REPLICA IDENTITY FULL, then drops everything. No residue on success.
-- Fails if: (a) the supabase_realtime publication does not exist, or (b) the
-- Realtime container cannot observe REPLICA IDENTITY FULL tables.

create table if not exists _rt_smoke (
  id uuid primary key default gen_random_uuid()
);

alter table _rt_smoke replica identity full;

alter publication supabase_realtime add table _rt_smoke;

alter publication supabase_realtime drop table _rt_smoke;

drop table _rt_smoke;
