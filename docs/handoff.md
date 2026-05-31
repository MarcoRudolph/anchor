---
description: "Operator handoff record: VPS extension availability, chosen UUIDv7 strategy, and supabase_realtime probe result — required input for plan 00-03 (schema freeze)."
paths:
  - "../supabase/migrations/0000_extensions_smoke.sql"
  - "../scripts/db-migrate.sh"
  - "./adr/0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md"
---

# Anchor — Operator Handoff: VPS Environment Smoke Results

**Purpose:** This document records the outcome of running `0000_extensions_smoke.sql`
against the real Hostinger VPS self-hosted Supabase Postgres. Plan 00-03 (schema freeze)
MUST NOT start until all fields below are filled in — the frozen DDL depends on knowing
which extensions are available and which UUIDv7 strategy to use.

**Run date:** <!-- fill in: YYYY-MM-DD -->
**Run by:** <!-- fill in: operator name or "automated via scripts/db-migrate.sh" -->
**VPS:** Hostinger VPS — self-hosted Supabase docker-compose stack

---

## How to Run the Smoke

```bash
# 1. Set DATABASE_URL to the real VPS Supabase Postgres connection string
#    (postgres://postgres:<password>@<vps-ip>:5432/postgres — superuser rights required)
export DATABASE_URL="postgres://..."

# 2. Run the migration runner (applies all migrations in supabase/migrations/ in order)
bash scripts/db-migrate.sh

# Alternatively, apply the smoke file directly:
# psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0000_extensions_smoke.sql
```

If `pg_uuidv7` is not installed at the OS/image level, the runner will abort with:
> `pg_uuidv7 unavailable — uuid_generate_v7() not found. Use the uuidv7 1.2.1 npm fallback.`

---

## Extension Availability

Fill in after running the smoke migration. Status: `installed` | `failed` | `not-tried`.

| Extension | Status | Notes |
|-----------|--------|-------|
| `pgcrypto` | <!-- installed / failed --> | Required for refresh-token envelope encryption (DEC-0008) |
| `pg_uuidv7` | <!-- installed / failed --> | Required for `uuid_generate_v7()` PK default (DEC-0013); fallback: uuidv7 npm |
| `pg_cron` | <!-- installed / failed --> | Required for scheduled jobs → edge functions (DEC-0019) |
| `pg_net` | <!-- installed / failed --> | Required for `net.http_post` from cron jobs (DEC-0019) |
| `vector` | <!-- installed / failed --> | Required for memory embeddings column type (DEC-0004, Phase 2) |

---

## UUIDv7 Strategy Decision

Plan 00-03 freezes the schema with UUIDv7 primary keys. The column default depends
on the outcome of the smoke above.

**Chosen strategy (circle one and delete the other):**

- [ ] **`pg_uuidv7` extension** — `uuid_generate_v7()` is available server-side.
  Column defaults will use `DEFAULT uuid_generate_v7()`.

- [ ] **`uuidv7` npm fallback (1.2.1)** — `pg_uuidv7` could not be installed on this VPS image.
  IDs are generated app-side (Edge Functions + webapp) before insert. Column defaults
  will use `DEFAULT gen_random_uuid()` as a safety net only; app always supplies the ID.

**Rationale / notes:** <!-- e.g., "pg_uuidv7 requires OS-level install; tried apt-get install
postgresql-16-pg-uuidv7 but package not available in the VPS image" -->

---

## Supabase Realtime Publication Probe

The smoke migration creates a throwaway `_rt_smoke` table, sets `REPLICA IDENTITY FULL`,
adds it to `supabase_realtime`, then drops it. If the probe ran without error, the
`supabase_realtime` publication exists and the Realtime container is configured correctly.

**Probe result:** <!-- PASSED / FAILED -->

**Notes:** <!-- any errors, container log lines, or follow-up actions -->

If the probe failed, check:
1. The `supabase_realtime` publication exists: `SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';`
2. The Realtime container is running: `docker ps | grep realtime`
3. The `supabase_realtime` publication was created by the docker-compose stack on first boot.

---

## Required Extensions with No Documented Fallback

If any of these extensions fail AND no fallback is documented, plan 00-03 is BLOCKED.
Escalate rather than proceeding with an unknown extension state.

| Extension | Fallback Available? | Fallback |
|-----------|--------------------|----|
| `pgcrypto` | No — `gen_random_uuid()` requires it; no JS equivalent for server-side crypto primitives in SQL | Must be installed |
| `pg_cron` | Partial — pg_cron jobs can be replaced by an external cron + HTTP call to edge functions | Document if substituting |
| `pg_net` | Partial — if pg_cron is available, net.http_post can be replaced by an external HTTP trigger | Document if substituting |
| `vector` | Partial — the column type can be omitted until Phase 2 if vector extension is unavailable now | Document deferral |

---

## Resume Signal for Plan 00-01 Continuation

After filling in this document, provide the resume signal to the continuation agent:

> **"extensions verified"** — then state the resolved uuidv7 strategy:
> - `"extensions verified — pg_uuidv7 installed, use server-side default"`, OR
> - `"extensions verified — pg_uuidv7 unavailable, use uuidv7 npm fallback"`,
> AND confirm realtime probe result (PASSED/FAILED).

The continuation agent will update this document and create `00-01-SUMMARY.md`.
