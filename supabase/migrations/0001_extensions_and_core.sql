-- 0001_extensions_and_core.sql
-- FROZEN SCHEMA (Phase 0 freeze, plan 00-03) — part 1 of 4: extensions + identity/billing core.
--
-- Source of truth per DEC-0013: this SQL is authored by hand; src/db/schema.ts is GENERATED
-- by `drizzle-kit pull` against the applied schema. Never run drizzle-kit generate/push.
--
-- UUIDv7 strategy (resolved in 00-01 / docs/handoff.md): pg_uuidv7 is NOT available on the
-- supabase/postgres:15.8.1 VPS image. Therefore:
--   * NO `create extension pg_uuidv7` and NO `uuid_generate_v7()` anywhere.
--   * PK columns default to gen_random_uuid() (pgcrypto, available) as a safety net only.
--   * The app supplies a time-ordered v7 id on insert via the `uuidv7` npm package
--     (Drizzle: .$defaultFn(() => uuidv7())).
--
-- Applied via scripts/db-migrate.sh (psql -f, ON_ERROR_STOP=1, lexical order).
-- Wrapped in a single transaction so the whole file is atomic on a fresh DB.

begin;

-- ---------------------------------------------------------------------------
-- 1. Extensions (the four AVAILABLE on the VPS image — pg_uuidv7 deliberately absent)
-- ---------------------------------------------------------------------------

-- pgcrypto: gen_random_uuid() PK safety-net default + envelope encryption for Google tokens (DEC-0008)
create extension if not exists pgcrypto;

-- pg_cron: scheduled jobs (e.g. pairing-code-expire) calling edge functions (DEC-0019)
create extension if not exists pg_cron;

-- pg_net: net.http_post for cron -> edge function calls (DEC-0019)
create extension if not exists pg_net;

-- vector: memory embeddings — column type frozen now, recall logic in Phase 2 (DEC-0004)
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- 2. anchor_user — Anchor profile keyed 1:1 to auth.users (DEC-0013, Pitfall 4)
-- ---------------------------------------------------------------------------
-- id IS auth.users.id (no indirection); ON DELETE CASCADE so a Supabase auth delete
-- hard-deletes the whole Anchor account (GDPR Art.17 cascade origin).
-- The row is created server-side at magic-link verification (SECURITY DEFINER / service-role,
-- 00-05), so RLS does not block signup.

create table anchor_user (
  id uuid primary key default gen_random_uuid() references auth.users(id) on delete cascade,
  timezone text not null,                                  -- IANA tz, browser-autodetected at signup
  locale text not null default 'de' check (locale in ('de', 'en')),
  telegram_user_id bigint unique,                          -- null until Telegram pairing burns a code
  stripe_customer_id text,                                 -- created at magic-link verify (DEC-0016)
  birthdate_hash text,                                     -- set when first Trusted Person added (recovery)
  email_bounced_at timestamptz,                            -- bounce-gating (DEC-0017)
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. pairing_code — single shared Telegram bot pairing (DEC-0007, Pitfall 5)
-- ---------------------------------------------------------------------------
-- code = 8-char Crockford Base32 (0-9A-HJKMNP-TV-Z, no I/L/O/U) minted by pairing-issue.
-- Shape supports the atomic single-burn redeem:
--   update pairing_code set consumed_at = now()
--    where code = $1 and consumed_at is null and expires_at > now() returning anchor_user_id;

create table pairing_code (
  code text primary key,                                   -- 8-char Crockford Base32, single-use
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  expires_at timestamptz not null,                         -- now() + 15min at issuance
  consumed_at timestamptz,                                 -- null until burned by /start <code>
  created_at timestamptz not null default now()
);

create index pairing_code_anchor_user_id_idx on pairing_code (anchor_user_id);

-- ---------------------------------------------------------------------------
-- 4. anchor_user_plan — one row per user, plan mirror (DEC-0016 / DEC-0005)
-- ---------------------------------------------------------------------------
-- Free at signup; Stripe webhook handlers (later waves) keep this in sync. PK == anchor_user_id.

create table anchor_user_plan (
  anchor_user_id uuid primary key references anchor_user (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_failed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. app_config — placeholder caps + Stripe price IDs (DEC-0016)
-- ---------------------------------------------------------------------------
-- Seeded so later phases write VALUES, not migrations. Service-role only (no user RLS policy).

create table app_config (
  key text primary key,
  value text,
  env text
);

insert into app_config (key, value, env) values
  ('free_daily_minutes', '15', 'all'),
  ('pro_daily_minutes', '120', 'all'),
  ('stripe_price_pro_monthly_de', '', 'test')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 6. stripe_event_log — webhook idempotency (DEC-0016)
-- ---------------------------------------------------------------------------
-- id = Stripe event id; ON CONFLICT DO NOTHING dedups replayed webhooks. Service-role only.

create table stripe_event_log (
  id text primary key,
  payload jsonb,
  processed_at timestamptz default now()
);

commit;
