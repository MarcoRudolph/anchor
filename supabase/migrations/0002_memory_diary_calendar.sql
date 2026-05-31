-- 0002_memory_diary_calendar.sql
-- FROZEN SCHEMA (Phase 0 freeze, plan 00-03) — part 2 of 4: memory / diary / calendar.
--
-- Anchor-specific memory index (DEC-0004): canonical source records + a single memory_index_item
-- per recallable unit, with REAL foreign keys to each source kind and a single-source CHECK
-- enforcing EXACTLY ONE source FK is set AND source_kind matches it. No free-form
-- source_table/source_id strings. Memory recall/extraction LOGIC is Phase 2 — only the DDL freezes now.
--
-- Every user-owned table: id uuid pk default gen_random_uuid() (app supplies v7 via uuidv7 npm),
-- anchor_user_id uuid not null references anchor_user(id) on delete cascade (GDPR Art.17 cascade).
-- Soft-delete (deleted_at) on memory_fact + diary_entry for Recall Exclusion (DEC-0013).
--
-- Wrapped in a single transaction so the whole file is atomic on a fresh DB.

begin;

-- ---------------------------------------------------------------------------
-- enum: memory_index_item.source_kind (matches the populated source FK)
-- ---------------------------------------------------------------------------
create type memory_source_kind as enum (
  'conversation_transcript',
  'diary_entry',
  'memory_fact',
  'calendar_event'
);

-- ---------------------------------------------------------------------------
-- 1. conversation_transcript — canonical Telegram/voice conversation record
-- ---------------------------------------------------------------------------
create table conversation_transcript (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  occurred_at timestamptz not null default now(),          -- when the conversation happened
  channel text not null default 'telegram',                -- telegram | voice | web (frozen, Phase 2 logic)
  content text,                                            -- transcript body (Phase 2 fills)
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index conversation_transcript_anchor_user_id_idx
  on conversation_transcript (anchor_user_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 2. source_evidence — verbatim spans grounding a memory_fact (anti-hallucination)
-- ---------------------------------------------------------------------------
create table source_evidence (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  conversation_transcript_id uuid references conversation_transcript (id) on delete cascade,
  excerpt text not null,                                   -- the verbatim span the fact was drawn from
  span jsonb,                                              -- optional char offsets / locator
  created_at timestamptz not null default now()
);

create index source_evidence_anchor_user_id_idx on source_evidence (anchor_user_id);
create index source_evidence_transcript_idx on source_evidence (conversation_transcript_id);

-- ---------------------------------------------------------------------------
-- 3. memory_fact — a single durable fact about the user (+ soft-delete + correction chain)
-- ---------------------------------------------------------------------------
-- superseded_by: self-FK so a corrected fact points at its replacement (DEC-0004 correction).
-- deleted_at: Recall Exclusion soft-delete (hard-deleted on account deletion via cascade).
create table memory_fact (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  content text not null,                                   -- the fact text
  fact_type text,                                          -- preference | relationship | event | ... (Phase 2)
  confidence real,                                         -- extraction confidence (Phase 2)
  source_evidence_id uuid references source_evidence (id) on delete set null,
  superseded_by uuid references memory_fact (id) on delete set null,  -- correction chain
  occurred_at timestamptz,                                 -- when the fact is "about"
  deleted_at timestamptz,                                  -- Recall Exclusion soft-delete
  content_tsv tsvector,                                    -- FTS column (populated Phase 2 / trigger)
  created_at timestamptz not null default now()
);

create index memory_fact_anchor_user_id_idx on memory_fact (anchor_user_id);
create index memory_fact_superseded_by_idx on memory_fact (superseded_by);
create index memory_fact_content_tsv_idx on memory_fact using gin (content_tsv);

-- ---------------------------------------------------------------------------
-- 4. memory_entity — canonical people/places/things referenced across facts
-- ---------------------------------------------------------------------------
create table memory_entity (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  entity_type text not null,                               -- person | place | thing | org (Phase 2)
  display_name text not null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index memory_entity_anchor_user_id_idx on memory_entity (anchor_user_id);

-- ---------------------------------------------------------------------------
-- 5. memory_relationship — directed edge between two entities (entity <-> entity)
-- ---------------------------------------------------------------------------
create table memory_relationship (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  from_entity_id uuid not null references memory_entity (id) on delete cascade,
  to_entity_id uuid not null references memory_entity (id) on delete cascade,
  relationship_type text not null,                         -- e.g. 'daughter_of', 'lives_in' (Phase 2)
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index memory_relationship_anchor_user_id_idx on memory_relationship (anchor_user_id);
create index memory_relationship_from_entity_idx on memory_relationship (from_entity_id);
create index memory_relationship_to_entity_idx on memory_relationship (to_entity_id);

-- ---------------------------------------------------------------------------
-- 6. diary_entry — user-authored diary (+ soft-delete + FTS)
-- ---------------------------------------------------------------------------
create table diary_entry (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  title text,
  body text not null,
  entry_date date,                                         -- the day the entry is about
  deleted_at timestamptz,                                  -- Recall Exclusion soft-delete
  body_tsv tsvector,                                       -- FTS column (populated Phase 2 / trigger)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index diary_entry_anchor_user_id_idx on diary_entry (anchor_user_id, entry_date desc);
create index diary_entry_body_tsv_idx on diary_entry using gin (body_tsv);

-- ---------------------------------------------------------------------------
-- 7. calendar_event — mirror of a Google Calendar event (calendar-as-memory-source)
-- ---------------------------------------------------------------------------
-- Local mirror of the user's primary-calendar events (scope calendar.events, DEC-0008).
-- google_event_id unique-per-user so re-syncs upsert rather than duplicate.
create table calendar_event (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  google_event_id text,                                    -- Google's event id (null for Pending Additions)
  summary text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  status text not null default 'confirmed',                -- confirmed | tentative | cancelled | pending (mirror)
  raw jsonb not null default '{}'::jsonb,                  -- raw Google event payload
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anchor_user_id, google_event_id)
);

create index calendar_event_anchor_user_id_idx on calendar_event (anchor_user_id, starts_at);

-- ---------------------------------------------------------------------------
-- 8. memory_index_item — the recall index (DEC-0004 single-source CHECK)
-- ---------------------------------------------------------------------------
-- One row per recallable unit. EXACTLY ONE of the four source FKs is non-null AND
-- source_kind names which one. embedding vector(1536) for pgvector recall (Phase 2).
-- recall_excluded_at hides a unit from agent recall without deleting the source.
create table memory_index_item (
  id uuid primary key default gen_random_uuid(),
  anchor_user_id uuid not null references anchor_user (id) on delete cascade,
  source_kind memory_source_kind not null,
  occurred_at timestamptz not null default now(),
  recall_excluded_at timestamptz,                          -- Recall Exclusion (Phase 2 logic)
  -- the four canonical source FKs — EXACTLY ONE is non-null (see CHECK below):
  conversation_transcript_id uuid references conversation_transcript (id) on delete cascade,
  diary_entry_id uuid references diary_entry (id) on delete cascade,
  memory_fact_id uuid references memory_fact (id) on delete cascade,
  calendar_event_id uuid references calendar_event (id) on delete cascade,
  embedding vector(1536),                                  -- recall embedding (frozen now, Phase 2)
  content_excerpt text,                                    -- denormalised snippet for fast recall display
  created_at timestamptz not null default now(),
  -- DEC-0004 single-source CHECK: exactly one source FK set AND source_kind matches it.
  constraint memory_index_item_single_source check (
    (
      (conversation_transcript_id is not null)::int
      + (diary_entry_id is not null)::int
      + (memory_fact_id is not null)::int
      + (calendar_event_id is not null)::int
    ) = 1
    and (
      (source_kind = 'conversation_transcript' and conversation_transcript_id is not null)
      or (source_kind = 'diary_entry' and diary_entry_id is not null)
      or (source_kind = 'memory_fact' and memory_fact_id is not null)
      or (source_kind = 'calendar_event' and calendar_event_id is not null)
    )
  )
);

create index memory_index_item_anchor_user_id_idx
  on memory_index_item (anchor_user_id, occurred_at desc);

commit;
