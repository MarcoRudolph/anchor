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

**Run date:** 2026-05-31
**Run by:** automated — Claude orchestrator via `ssh root@76.13.157.62` → `docker exec -i supabase-anchor-db psql -U postgres` (DB ports 5436/6547 are localhost-bound on the VPS, not internet-reachable; tunnel/SSH required)
**VPS:** Hostinger VPS `srv1677122` — self-hosted Supabase docker-compose stack; DB container `supabase-anchor-db`, image `supabase/postgres:15.8.1.085` (Postgres 15)

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
| `pgcrypto` | **installed** | Already present. `gen_random_uuid()` available → used as safety-net PK default (DEC-0008) |
| `pg_uuidv7` | **failed** | `extension "pg_uuidv7" is not available` — NOT in the supabase/postgres:15.8.1 image; no control file. `uuid_generate_v7()` confirmed undefined. → **uuidv7 npm fallback** (DEC-0013) |
| `pg_cron` | **installed** | Available for scheduled jobs → edge functions (DEC-0019) |
| `pg_net` | **installed** | Already present. `net.http_post` available for cron→edge calls (DEC-0019) |
| `vector` | **installed** | pgvector available → memory embeddings column type can be frozen now (DEC-0004, Phase 2) |

---

## UUIDv7 Strategy Decision

Plan 00-03 freezes the schema with UUIDv7 primary keys. The column default depends
on the outcome of the smoke above.

**Chosen strategy:** ✅ **`uuidv7` npm fallback (1.2.1)**

- [ ] ~~**`pg_uuidv7` extension** — `uuid_generate_v7()` available server-side.~~ NOT AVAILABLE on this VPS.

- [x] **`uuidv7` npm fallback (1.2.1)** — `pg_uuidv7` is not available on the `supabase/postgres:15.8.1` image.
  IDs are generated app-side (Edge Functions + webapp) before insert via the `uuidv7` npm package.
  Column defaults use `DEFAULT gen_random_uuid()` (pgcrypto, installed) as a safety net only;
  the application always supplies the time-ordered v7 ID on insert. Drizzle: `.$defaultFn(() => uuidv7())`.

**Rationale / notes:** Smoke run 2026-05-31 against `supabase-anchor-db` returned
`extension "pg_uuidv7" is not available` (no control file in the image) and the
`uuid_generate_v7()` probe confirmed the function is undefined. The Supabase self-hosted
Postgres image does not bundle pg_uuidv7. Per DEC-0013 / Assumption A5 the documented
fallback is the `uuidv7` 1.2.1 npm package generating IDs app-side. **Plan 00-03 MUST NOT
emit `DEFAULT uuid_generate_v7()` on any column** — use `DEFAULT gen_random_uuid()` and
app-supplied v7 IDs.

---

## Supabase Realtime Publication Probe

The smoke migration creates a throwaway `_rt_smoke` table, sets `REPLICA IDENTITY FULL`,
adds it to `supabase_realtime`, then drops it. If the probe ran without error, the
`supabase_realtime` publication exists and the Realtime container is configured correctly.

**Probe result:** PASSED

**Notes:** The `supabase_realtime` publication exists; a throwaway table with `REPLICA IDENTITY FULL`
was added to and dropped from it without error, then dropped. Realtime is usable for the UJ-002
pairing "connected" confirmation (plan 00-06). No residue left.

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

---

# Schema Freeze Record (Plan 00-03) — applied 2026-05-31

**Applied to:** VPS `supabase-anchor-db` (Postgres 15.8.1) via `ssh root@76.13.157.62` →
`docker exec -i supabase-anchor-db psql`. Validated first with a full dry-run inside a
single rolled-back transaction (0 errors), then applied for real (each migration self-commits).

**Apply result:** 18 tables, 3 enum types, 56 RLS policies, 21 ALTER, **0 errors**.

**Frozen tables (public schema, all 18 RLS-enabled):**
`anchor_user, pairing_code, anchor_user_plan, app_config, stripe_event_log` (0001);
`conversation_transcript, source_evidence, memory_fact, memory_entity, memory_relationship, memory_index_item, diary_entry, calendar_event` (0002);
`trusted_contact, google_connection, telegram_session, audit_event, agent_cost_log` (0003).

**Enums:** `google_connection_state` (connected/disconnected_external/revoked), `memory_source_kind`, `trusted_contact_state`.

**Verified invariants:**
- `anchor_user.id` → `auth.users(id)` `ON DELETE CASCADE` (confdeltype `c`). ✅
- RLS enabled on **all 18** tables; `auth.uid()` CRUD policies (anchor_user `= id`, others `= anchor_user_id`); reference/log tables locked (RLS on, no public policy). ✅
- `memory_index_item_single_source` CHECK enforces exactly-one-source-FK + matching `source_kind` (DEC-0004). ✅
- `google_connection` = `refresh_token_encrypted bytea` (pgcrypto envelope), **no** access-token column (DEC-0008). ✅
- `supabase_realtime` publication: `anchor_user, anchor_user_plan, google_connection` (REPLICA IDENTITY FULL). ✅

**Drizzle query layer:** generated by `drizzle-kit pull` (over SSH tunnel → pooler `localhost:5436`)
into `drizzle/` then relocated to `src/db/schema.ts` + `src/db/relations.ts` (canonical, GENERATED header).
Post-pull manual repairs (drizzle-kit gaps; SQL remains source of truth): `tsvector`/`bytea` columns
declared as `customType`; an `auth.users` `pgSchema` stub added so the cross-schema FK resolves;
`drizzle/` output dir excluded from tsc + gitignored. `pnpm typecheck` is green.

**DB access for later waves:** ports 5436 (session) / 6547 (txn pooler) are localhost-bound on the VPS.
Tunnel: `ssh -L 5436:localhost:5436 -L 6547:localhost:6547 root@76.13.157.62` (key `~/.ssh/id_ed25519_hostinger`),
then `DATABASE_URL=…@localhost:5436/postgres`. Vercel/edge use the HTTPS API URL (`ANCHOR_SUPABASE_URL`), not SSH.
