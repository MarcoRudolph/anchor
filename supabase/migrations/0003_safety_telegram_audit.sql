-- 0003_safety_telegram_audit.sql
-- FROZEN SCHEMA (Phase 0 freeze, plan 00-03) — part 3 of 4: safety / Google / Telegram / audit.
--
-- trusted_contact: recovery-only (DEC-0006 Trusted Person flow). LEAST PRIVILEGE — a trusted
--   contact can ONLY assist recovery; there are deliberately NO diary/calendar/delete grant columns.
-- google_connection: encrypted refresh token via pgcrypto envelope (DEC-0008). NO access-token /
--   plaintext column — access tokens are never persisted. connection_state includes disconnected_external.
-- telegram_session: links the shared-bot telegram_user_id to an anchor account (DEC-0007).
-- audit_event / agent_cost_log: anchor_user_id NULLABLE so a 12-month job can anonymize to NULL
--   while keeping the row for aggregate analytics (DEC-0013).
--
-- Wrapped in a single transaction so the whole file is atomic on a fresh DB.

begin;

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------
-- Trusted contact verification lifecycle (recovery-only).
create type trusted_contact_state as enum (
  'pending',          -- invited, not yet verified
  'verified',         -- contact confirmed, eligible to assist recovery
  'revoked'           -- removed by the user
);

-- Google connection lifecycle (DEC-0008). disconnected_external = user/Google revoked the grant.
create type google_connection_state as enum (
  'connected',
  'disconnected_external',  -- invalid_grant / 401 / external revoke detected (lazy or weekly ping)
  'revoked'                 -- user disconnected from within Anchor
);

-- ---------------------------------------------------------------------------
-- 1. trusted_contact — recovery-only Trusted Person (DEC-0006), least privilege
-- ---------------------------------------------------------------------------
-- NO diary/calendar/delete grant columns by design: a trusted contact assists ACCOUNT RECOVERY
-- (birthdate + zipcode tiebreak -> recovery link -> assisted email rebind) and nothing else.
create table trusted_contact (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  display_name text not null,
  contact_email text not null,                             -- where the recovery link is sent
  verification_state trusted_contact_state not null default 'pending',
  verification_token_hash text,                            -- hashed invite/verify token (never plaintext)
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index trusted_contact_anchor_user_id_idx on trusted_contact (anchor_user_id);

-- ---------------------------------------------------------------------------
-- 2. google_connection — encrypted refresh token, NO access-token column (DEC-0008)
-- ---------------------------------------------------------------------------
-- refresh_token_encrypted holds the pgcrypto envelope-encrypted refresh token (bytea).
-- The column key is wrapped by a master key in the Hermes env (manual half-yearly rotation).
-- There is intentionally NO access-token / cleartext column: access tokens are obtained on
-- demand from the refresh token and held only in memory for the request.
create table google_connection (
  anchor_user_id uuid primary key references anchor_user (id) on delete cascade,
  refresh_token_encrypted bytea,                           -- pgcrypto envelope-encrypted refresh token
  connection_state google_connection_state not null default 'connected',
  scope text not null default 'https://www.googleapis.com/auth/calendar.events',
  google_account_email text,                               -- the connected Google account (display only)
  last_synced_at timestamptz,                              -- last successful calendar sync / ping
  disconnected_at timestamptz,                             -- when state left 'connected'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. telegram_session — shared-bot session metadata per user (DEC-0007)
-- ---------------------------------------------------------------------------
-- Links the Telegram user (telegram_user_id) to the Anchor account once pairing burns a code.
-- anchor_user.telegram_user_id is the authoritative pairing link; this table holds per-session
-- metadata (chat id, last seen, locale snapshot) for the conversation loop.
create table telegram_session (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  telegram_user_id bigint not null,                        -- Telegram's numeric user id (shared bot)
  telegram_chat_id bigint,
  metadata jsonb not null default '{}'::jsonb,             -- last_seen, locale snapshot, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anchor_user_id, telegram_user_id)
);

create index telegram_session_anchor_user_id_idx on telegram_session (anchor_user_id);
create index telegram_session_telegram_user_id_idx on telegram_session (telegram_user_id);

-- ---------------------------------------------------------------------------
-- 4. audit_event — account/recovery/pairing/deletion audit trail (T-00-10)
-- ---------------------------------------------------------------------------
-- anchor_user_id NULLABLE: a 12-month retention job anonymizes it to NULL while keeping the row
-- for aggregate analytics (DEC-0013). on delete set null so a hard account delete keeps the audit
-- row but unlinks the user.
create table audit_event (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid references anchor_user (id) on delete set null,  -- nullable (12-month anonymization)
  event_type text not null,                                -- e.g. 'pairing.redeemed', 'recovery.requested'
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_event_anchor_user_id_idx on audit_event (anchor_user_id);
create index audit_event_event_type_idx on audit_event (event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. agent_cost_log — per-turn cost/usage tracking (financial-gain monitoring)
-- ---------------------------------------------------------------------------
-- anchor_user_id NULLABLE for the same 12-month anonymization policy.
create table agent_cost_log (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid references anchor_user (id) on delete set null,  -- nullable (12-month anonymization)
  model text,                                              -- model/provider used for the turn
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  cost_usd numeric(12, 6),                                 -- computed cost for the turn
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index agent_cost_log_anchor_user_id_idx on agent_cost_log (anchor_user_id, occurred_at desc);

commit;
