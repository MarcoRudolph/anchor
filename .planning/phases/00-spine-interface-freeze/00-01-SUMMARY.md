---
phase: 00-spine-interface-freeze
plan: 01
subsystem: db-foundation
tags: [supabase, postgres, extensions, realtime, uuidv7, vps, smoke]
requires: []
provides:
  - "scripts/db-migrate.sh (psql migration runner, ON_ERROR_STOP=1, lexical order)"
  - "supabase/migrations/0000_extensions_smoke.sql (disposable extension+realtime probe)"
  - "docs/handoff.md (resolved extension matrix + UUIDv7 strategy + realtime result)"
  - "DECISION: UUIDv7 = uuidv7 npm fallback (pg_uuidv7 unavailable on VPS)"
affects: ["00-03 (schema freeze must use gen_random_uuid() default + app-side uuidv7)"]
tech-stack:
  added: []
  patterns: ["plain-SQL migrations via psql", "fail-fast extension smoke before schema freeze"]
key-files:
  created:
    - scripts/db-migrate.sh
    - supabase/migrations/0000_extensions_smoke.sql
    - docs/handoff.md
  modified: []
decisions:
  - "pg_uuidv7 is NOT available on supabase/postgres:15.8.1 (VPS) → UUIDv7 generated app-side via uuidv7 npm; gen_random_uuid() is the DB safety-net default only"
metrics:
  duration: "checkpoint-gated (Task 1 autonomous; Task 2 ran against live VPS via SSH+docker exec)"
  completed: 2026-05-31
---

# Phase 0 Plan 01: VPS/Supabase Environment Smoke Summary

**One-liner:** Proved the real Hostinger VPS self-hosted Supabase (Postgres 15.8.1) supports the locked architecture — `pgcrypto`, `pg_cron`, `pg_net`, `vector` and the `supabase_realtime` publication all work; `pg_uuidv7` does **not**, so UUIDv7 falls back to the `uuidv7` npm package app-side.

## What was built

- **`scripts/db-migrate.sh`** — POSIX psql runner applying `supabase/migrations/*.sql` in lexical order with `ON_ERROR_STOP=1` (the `pnpm db:migrate` target per DEC-0013; no Supabase CLI on the critical path).
- **`supabase/migrations/0000_extensions_smoke.sql`** — idempotent, non-destructive probe: 5 `create extension if not exists`, a `uuid_generate_v7()` RAISE probe, and a `supabase_realtime` ADD/DROP + `REPLICA IDENTITY FULL` probe that cleans up its throwaway table.
- **`docs/handoff.md`** — operator record of the resolved environment state (input contract for plan 00-03).

## Checkpoint outcome (Task 2 — ran against the real VPS)

DB ports (5436 session / 6547 pooler) are localhost-bound on the VPS and firewalled from the internet, so the smoke ran via `ssh root@76.13.157.62` → `docker exec -i supabase-anchor-db psql -U postgres`.

| Item | Result |
|------|--------|
| `pgcrypto` | ✅ installed (`gen_random_uuid()` available) |
| `pg_uuidv7` | ❌ **not available** (no control file in image) |
| `pg_cron` | ✅ installed |
| `pg_net` | ✅ installed |
| `vector` | ✅ installed (pgvector) |
| `uuid_generate_v7()` | ❌ undefined → app-side uuidv7 |
| `supabase_realtime` ADD/DROP + REPLICA IDENTITY FULL | ✅ PASSED |

## Decision frozen for 00-03

**UUIDv7 strategy = `uuidv7` npm fallback.** No column may use `DEFAULT uuid_generate_v7()`. Use `DEFAULT gen_random_uuid()` as a safety net and have the app (edge functions + webapp) supply the time-ordered v7 ID on insert (`.$defaultFn(() => uuidv7())` in Drizzle). All other extensions the frozen schema needs are present.

## Deviations from Plan

- **[Execution-environment] Smoke applied via SSH + `docker exec`, not a direct `psql`/`DATABASE_URL` from the executor host.** Reason: the VPS Postgres is localhost-bound (operator's security choice); ports 5436/6547 are not internet-reachable and the executor host has no `psql`. The verification goal (prove extensions + realtime on the *real* VPS, not a local stand-in) was fully met. `scripts/db-migrate.sh` remains the canonical runner for when `DATABASE_URL` is reachable (e.g., via the documented SSH tunnel `ssh -L 5436:localhost:5436 root@76.13.157.62`).

## Self-Check: PASSED
- scripts/db-migrate.sh — FOUND (committed fff9f75)
- supabase/migrations/0000_extensions_smoke.sql — FOUND (committed fff9f75)
- docs/handoff.md — FOUND, all fields filled
- Live VPS smoke executed; extension matrix + realtime result recorded
