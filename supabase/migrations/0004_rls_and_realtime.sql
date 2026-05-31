-- 0004_rls_and_realtime.sql
-- FROZEN SCHEMA (Phase 0 freeze, plan 00-03) — part 4 of 4: RLS + Realtime.
--
-- Row Level Security is ENABLED on EVERY table from the first schema (T-00-06: no user-owned
-- table is ever queryable without a policy). Two classes:
--   * user-owned tables: select/insert/update/delete policies scoped to auth.uid().
--       - anchor_user keys on auth.uid() = id (id IS auth.users.id, DEC-0013).
--       - all others key on auth.uid() = anchor_user_id.
--   * reference / service-role tables (app_config, stripe_event_log): RLS ENABLED with NO public
--       policy -> locked by default; only the service-role key (which bypasses RLS) can touch them.
--   * audit_event / agent_cost_log: RLS enabled, NO public policy (service-role only writes/reads;
--       anchor_user_id is nullable and these are not user-facing).
--
-- Realtime: anchor_user + the per-user rows the onboarding/pairing UI subscribes to
-- (anchor_user_plan, google_connection) are added to the supabase_realtime publication with
-- REPLICA IDENTITY FULL so the "connected" / "Pro aktiv" flips bind to the real DB row (DEC-0015).
--
-- Pattern 4: the row-creating signup path (00-05) runs SECURITY DEFINER / service-role so the
-- insert policy below does not block account creation.
--
-- Wrapped in a single transaction so the whole file is atomic on a fresh DB.

begin;

-- ===========================================================================
-- A. anchor_user — RLS keyed on auth.uid() = id
-- ===========================================================================
alter table anchor_user enable row level security;

create policy anchor_user_sel on anchor_user for select using (auth.uid() = id);
create policy anchor_user_ins on anchor_user for insert with check (auth.uid() = id);
create policy anchor_user_upd on anchor_user for update using (auth.uid() = id) with check (auth.uid() = id);
create policy anchor_user_del on anchor_user for delete using (auth.uid() = id);

-- ===========================================================================
-- B. user-owned tables — RLS keyed on auth.uid() = anchor_user_id
--    (full CRUD policy set on each; service-role bypasses these by design)
-- ===========================================================================

-- pairing_code
alter table pairing_code enable row level security;
create policy pairing_code_sel on pairing_code for select using (auth.uid() = anchor_user_id);
create policy pairing_code_ins on pairing_code for insert with check (auth.uid() = anchor_user_id);
create policy pairing_code_upd on pairing_code for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy pairing_code_del on pairing_code for delete using (auth.uid() = anchor_user_id);

-- anchor_user_plan
alter table anchor_user_plan enable row level security;
create policy anchor_user_plan_sel on anchor_user_plan for select using (auth.uid() = anchor_user_id);
create policy anchor_user_plan_ins on anchor_user_plan for insert with check (auth.uid() = anchor_user_id);
create policy anchor_user_plan_upd on anchor_user_plan for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy anchor_user_plan_del on anchor_user_plan for delete using (auth.uid() = anchor_user_id);

-- conversation_transcript
alter table conversation_transcript enable row level security;
create policy conversation_transcript_sel on conversation_transcript for select using (auth.uid() = anchor_user_id);
create policy conversation_transcript_ins on conversation_transcript for insert with check (auth.uid() = anchor_user_id);
create policy conversation_transcript_upd on conversation_transcript for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy conversation_transcript_del on conversation_transcript for delete using (auth.uid() = anchor_user_id);

-- source_evidence
alter table source_evidence enable row level security;
create policy source_evidence_sel on source_evidence for select using (auth.uid() = anchor_user_id);
create policy source_evidence_ins on source_evidence for insert with check (auth.uid() = anchor_user_id);
create policy source_evidence_upd on source_evidence for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy source_evidence_del on source_evidence for delete using (auth.uid() = anchor_user_id);

-- memory_fact
alter table memory_fact enable row level security;
create policy memory_fact_sel on memory_fact for select using (auth.uid() = anchor_user_id);
create policy memory_fact_ins on memory_fact for insert with check (auth.uid() = anchor_user_id);
create policy memory_fact_upd on memory_fact for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy memory_fact_del on memory_fact for delete using (auth.uid() = anchor_user_id);

-- memory_entity
alter table memory_entity enable row level security;
create policy memory_entity_sel on memory_entity for select using (auth.uid() = anchor_user_id);
create policy memory_entity_ins on memory_entity for insert with check (auth.uid() = anchor_user_id);
create policy memory_entity_upd on memory_entity for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy memory_entity_del on memory_entity for delete using (auth.uid() = anchor_user_id);

-- memory_relationship
alter table memory_relationship enable row level security;
create policy memory_relationship_sel on memory_relationship for select using (auth.uid() = anchor_user_id);
create policy memory_relationship_ins on memory_relationship for insert with check (auth.uid() = anchor_user_id);
create policy memory_relationship_upd on memory_relationship for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy memory_relationship_del on memory_relationship for delete using (auth.uid() = anchor_user_id);

-- diary_entry
alter table diary_entry enable row level security;
create policy diary_entry_sel on diary_entry for select using (auth.uid() = anchor_user_id);
create policy diary_entry_ins on diary_entry for insert with check (auth.uid() = anchor_user_id);
create policy diary_entry_upd on diary_entry for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy diary_entry_del on diary_entry for delete using (auth.uid() = anchor_user_id);

-- calendar_event
alter table calendar_event enable row level security;
create policy calendar_event_sel on calendar_event for select using (auth.uid() = anchor_user_id);
create policy calendar_event_ins on calendar_event for insert with check (auth.uid() = anchor_user_id);
create policy calendar_event_upd on calendar_event for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy calendar_event_del on calendar_event for delete using (auth.uid() = anchor_user_id);

-- memory_index_item
alter table memory_index_item enable row level security;
create policy memory_index_item_sel on memory_index_item for select using (auth.uid() = anchor_user_id);
create policy memory_index_item_ins on memory_index_item for insert with check (auth.uid() = anchor_user_id);
create policy memory_index_item_upd on memory_index_item for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy memory_index_item_del on memory_index_item for delete using (auth.uid() = anchor_user_id);

-- trusted_contact
alter table trusted_contact enable row level security;
create policy trusted_contact_sel on trusted_contact for select using (auth.uid() = anchor_user_id);
create policy trusted_contact_ins on trusted_contact for insert with check (auth.uid() = anchor_user_id);
create policy trusted_contact_upd on trusted_contact for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy trusted_contact_del on trusted_contact for delete using (auth.uid() = anchor_user_id);

-- google_connection
alter table google_connection enable row level security;
create policy google_connection_sel on google_connection for select using (auth.uid() = anchor_user_id);
create policy google_connection_ins on google_connection for insert with check (auth.uid() = anchor_user_id);
create policy google_connection_upd on google_connection for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy google_connection_del on google_connection for delete using (auth.uid() = anchor_user_id);

-- telegram_session
alter table telegram_session enable row level security;
create policy telegram_session_sel on telegram_session for select using (auth.uid() = anchor_user_id);
create policy telegram_session_ins on telegram_session for insert with check (auth.uid() = anchor_user_id);
create policy telegram_session_upd on telegram_session for update using (auth.uid() = anchor_user_id) with check (auth.uid() = anchor_user_id);
create policy telegram_session_del on telegram_session for delete using (auth.uid() = anchor_user_id);

-- ===========================================================================
-- C. service-role-only tables — RLS ENABLED, NO public policy (locked by default)
--    app_config / stripe_event_log are reference/system tables; audit_event /
--    agent_cost_log are written only by trusted server contexts (service-role bypasses RLS).
-- ===========================================================================
alter table app_config enable row level security;
alter table stripe_event_log enable row level security;
alter table audit_event enable row level security;
alter table agent_cost_log enable row level security;

-- ===========================================================================
-- D. Realtime — publish the rows the onboarding/pairing UI subscribes to (DEC-0015)
--    REPLICA IDENTITY FULL so updates carry the full row to the Realtime stream.
-- ===========================================================================
alter table anchor_user replica identity full;
alter table anchor_user_plan replica identity full;
alter table google_connection replica identity full;

alter publication supabase_realtime add table anchor_user;
alter publication supabase_realtime add table anchor_user_plan;
alter publication supabase_realtime add table google_connection;

commit;
