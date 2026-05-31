---
phase: 00-spine-interface-freeze
plan: 03
subsystem: db-schema-freeze
tags: [postgres, drizzle, rls, realtime, schema-freeze, supabase, uuidv7]
requires: ["00-01 (uuidv7 strategy)"]
provides:
  - "Frozen cross-context schema: 18 tables applied to VPS (source of truth = supabase/migrations/0001..0004)"
  - "Drizzle query layer src/db/schema.ts + relations.ts (GENERATED via drizzle-kit pull)"
  - "src/db/client.ts (browser-safe anon/user) + client.server.ts (service-role, server-only)"
  - "RLS on all 18 tables (auth.uid()); supabase_realtime publishes anchor_user/anchor_user_plan/google_connection"
affects: ["00-05 (edge fns import schema types)", "Phase 1-4 (all waves build behind this frozen schema)"]
tech-stack:
  added: ["drizzle-orm", "drizzle-kit", "postgres (postgres.js)", "uuidv7", "server-only"]
  patterns: ["SQL-source-of-truth + drizzle-kit pull (reversed workflow)", "app-side uuidv7 (no pg_uuidv7)", "RLS auth.uid() scoping", "service-role client server-only"]
key-files:
  created:
    - supabase/migrations/0001_extensions_and_core.sql
    - supabase/migrations/0002_memory_diary_calendar.sql
    - supabase/migrations/0003_safety_telegram_audit.sql
    - supabase/migrations/0004_rls_and_realtime.sql
    - drizzle.config.ts
    - src/db/schema.ts
    - src/db/relations.ts
    - src/db/client.ts
    - src/db/client.server.ts
  modified:
    - docs/handoff.md
    - tsconfig.json
    - .gitignore
    - package.json
decisions:
  - "UUIDv7 generated app-side (uuidv7 npm); PK default gen_random_uuid() safety-net — pg_uuidv7 not on VPS"
  - "drizzle-kit pull gaps repaired post-pull: tsvector/bytea customType, auth.users pgSchema stub; drizzle/ out-dir excluded from tsc + gitignored"
metrics:
  duration: "Tasks 1-2 by gsd-executor (opus); Task 3 apply + pull + repair by orchestrator"
  completed: 2026-05-31
---

# Phase 0 Plan 03: Frozen Cross-Context Schema Summary

**One-liner:** The complete 18-table Anchor schema is frozen as plain-SQL migrations (source of truth), applied cleanly to the live VPS Postgres with RLS on every table and the DEC-0004 single-source CHECK, and introspected by `drizzle-kit pull` into a typed query layer — the stable data contract all four feature waves build behind.

## What was built

- **4 SQL migrations** (`0001`–`0004`), each atomic (`begin;…commit;`), lexically ordered, applied via `scripts/db-migrate.sh` semantics.
- **18 tables** across core/identity/billing, memory/diary/calendar, and safety/telegram/audit; 3 enums; FTS (`tsvector` + GIN) on `memory_fact` and `diary_entry`; `vector(1536)` on `memory_index_item`.
- **RLS** enabled on all 18 tables with `auth.uid()` policies; reference/log tables locked (RLS on, no public policy).
- **Realtime**: `anchor_user`, `anchor_user_plan`, `google_connection` published with `REPLICA IDENTITY FULL`.
- **Drizzle**: `drizzle.config.ts` (pull config), generated `src/db/schema.ts`/`relations.ts`, and `src/db/client.ts` (anon/user, browser-safe) + `client.server.ts` (service-role, `server-only`).

## How it was applied (Task 3, done by orchestrator with live DB access)

VPS DB ports are localhost-bound, so the apply ran through `ssh root@76.13.157.62` → `docker exec -i supabase-anchor-db psql`:
1. **Dry-run**: all 4 migrations concatenated into one transaction, `ROLLBACK` — 0 errors, no residue (validates DDL before touching the real DB).
2. **Real apply**: 18 CREATE TABLE, 3 CREATE TYPE, 56 CREATE POLICY, 21 ALTER, 0 errors.
3. **`drizzle-kit pull`** over an SSH `-L 5436` tunnel to the session pooler → generated schema into `drizzle/`, relocated to `src/db/`.
4. **Verified** table set, RLS coverage (18/18), realtime publication, single-source CHECK, FK cascade, `google_connection` shape — all ✅.

## Decisions Made

- **UUIDv7 = app-side (`uuidv7` npm).** `pg_uuidv7` is not available on `supabase/postgres:15.8.1` (from 00-01). PKs default to `gen_random_uuid()` as a safety net; the app supplies the time-ordered v7 id on insert.

## Deviations from Plan

- **[Rule 1 — bug] drizzle.config `extensionsFilters`**: plan said `['postgres']`; drizzle-kit 0.31 types it as `'postgis'[]`. Corrected to `['postgis']` (no PostGIS in use; functionally inert). *(Fixed by executor.)*
- **[Rule 1 — post-pull repair] drizzle-kit pull gaps**: `tsvector`/`bytea` columns came back as `unknown(...)` and the `auth.users` FK referenced an undefined `users`. Fixed with `customType` declarations and an `auth.users` `pgSchema` stub; `drizzle/` (regenerable output) excluded from tsc + gitignored. The SQL migrations remain the unmodified source of truth. *(Done by orchestrator during Task 3.)*

## Self-Check: PASSED
- 4 migrations + drizzle.config.ts + src/db/{schema,relations,client,client.server}.ts — FOUND
- Applied to live VPS: 18 tables, RLS 18/18, realtime publication confirmed, single-source CHECK present
- `pnpm typecheck` green; no `uuid_generate_v7()`/`pg_uuidv7` anywhere
- Commits: 105b278 (DDL), 3fb20fc (drizzle config/client), + this finalize commit
