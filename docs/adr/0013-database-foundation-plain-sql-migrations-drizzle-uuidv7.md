---
description: "ADR-0013 — Anchor's database is self-hosted Supabase (Postgres); schema is plain SQL migrations applied via psql, Drizzle ORM is the query layer (not the schema source), IDs are UUIDv7, and `anchor_user.id` is identical to `auth.users.id`."
paths:
  - "../requirements/infrastructure-requirements.md"
  - "./0003-hostinger-vps-with-hermes-and-supabase-containers.md"
  - "./0010-supabase-edge-functions-as-anchor-hermes-api.md"
---

# Database foundation: plain SQL migrations, Drizzle as query layer, UUIDv7

Status: Accepted

Anchor runs against a self-hosted Supabase instance on the Hostinger VPS (per ADR-0003). The database schema lives as plain SQL files under `supabase/migrations/<timestamp>_<name>.sql`, applied with `psql -f` in lexical order. The Supabase CLI may be used for convenience (`supabase migration new`, `supabase db push --db-url ...`) but is not on the critical path: deployment scripts apply migrations through `psql` so the project does not depend on the CLI's compatibility with the self-hosted runtime. A simple `pnpm db:migrate` script in the repo wraps the `psql` invocation against a `DATABASE_URL` env var.

Drizzle is the query layer for both the webapp and the Edge Functions, but it is **not** the schema source of truth. Schema is defined in the SQL migration files; `drizzle-kit introspect` reads the live schema and emits TypeScript types under `src/db/schema.ts`. Application code uses Drizzle's typed query builder against those generated types. This deliberately reverses the typical Drizzle workflow (TypeScript schema → SQL) because RLS policies, Postgres functions, triggers, and extension bootstrapping are clearer and more reviewable in raw SQL than in any ORM DSL. Prisma is rejected: its handling of Supabase RLS is hostile (it tends to run as service-role and bypass policies), and its schema format does not round-trip with hand-written DDL. Kysely and Knex are viable as alternatives but bring no advantage Drizzle does not already supply.

Primary keys are UUIDv7 generated server-side by the `pg_uuidv7` extension (`SELECT uuid_generate_v7()` as column default), not UUIDv4 and not bigserial. UUIDv7 retains the privacy properties of UUIDs (no insertion-order leak across accounts, no guessable IDs) while remaining chronologically sortable, which gives B-tree indexes good locality on append-heavy tables such as `conversation_turn`, `memory_fact`, and `diary_entry`. UUIDv4 is rejected for these tables because its random distribution causes index-page fragmentation at scale; bigserial is rejected because the row number leaks customer-base size.

`anchor_user.id` is the same UUID as `auth.users.id`. The `anchor_user` table holds Anchor-specific profile fields (timezone, locale, plan, stripe_customer_id, birthdate_hash, etc.) and references `auth.users(id)` as a foreign key with `ON DELETE CASCADE`. There is no separate "anchor_user_id mapped to auth.uid()" indirection because Anchor is single-tenant per Supabase Auth user; the indirection would only pay off if Anchor ever supported one auth identity owning multiple Anchor accounts, which is explicitly out of scope. RLS policies use `auth.uid() = anchor_user_id` directly, which is the canonical Supabase pattern.

Deletion semantics: a User-initiated account deletion is a hard delete with `ON DELETE CASCADE` propagating across all User-owned tables, satisfying GDPR Article 17. `memory_fact` and `diary_entry` additionally support soft-delete via a `deleted_at TIMESTAMPTZ` column so the User can hide content from agent recall without losing the record (Recall Exclusion); these soft-deleted rows are still hard-deleted on account deletion. Audit tables (`audit_event`, `agent_cost_log`) retain entries for 12 months, after which a scheduled job anonymizes the `anchor_user_id` column to `NULL` while keeping the row for aggregate analytics.

A separate `docs/handoff.md` will accompany the first complete schema cut. That document is the operator playbook for standing up the Supabase instance on the VPS and includes: complete DDL, RLS policy listing, Edge Function source inventory with deploy commands, environment variable matrix (Supabase service-role key, Stripe keys, Telegram bot token, Hermes shared secret, OAuth secrets, master encryption key, OpenAI/Anthropic keys), `psql` apply order, smoke-test queries per table, and the backup/restore procedure (pg_dump + pg_restore against the same self-hosted instance).

Out of scope for MVP: read replicas, multi-region failover, logical replication for analytics, online schema migrations beyond what `psql` can do in a single transaction, automatic RLS coverage tests in CI (manual review at PR time is the gate for now).
