---
description: "Synthesized technical constraints (SPEC docs + SPEC-like content of locked ADRs) for Anchor from /gsd-ingest-docs"
paths:
  - "../INGEST-CONFLICTS.md"
  - "./SYNTHESIS.md"
---

# Constraints Intel

Two documents were classified `type: SPEC` (`infrastructure-requirements.md`,
`non-functional-requirements.md`). Their constraints are captured first, then SPEC-like contracts
lifted from locked ADRs (api-contract / schema / protocol / nfr). Each entry names its
authoritative `source:`. Precedence: where a SPEC and an ADR cover the same scope, the ADR (higher
precedence) is authoritative on concrete bindings; the SPEC supplies the broader requirement.

---

## SPEC-001 — Infrastructure layers and MVP deployment baseline (api-contract / schema)
- source: docs/requirements/infrastructure-requirements.md (SPEC)
- type: schema / api-contract
- content: Defines 8 infrastructure layers (INF-001..INF-008): webapp, Hermes agent runtime,
  Supabase/Postgres data layer, memory index + retrieval, scheduling, integration (Telegram,
  Google Calendar, LLM, STT, email), security + per-user isolation, observability. Includes a
  data-layer schema contract enforced by a CHECK constraint and named foreign-key/source_kind
  contracts, plus retrieval-capability requirements. Evaluates agent-runtime isolation options
  A/B/C and recommends the MVP baseline (single Hostinger VPS, Docker) but explicitly does NOT
  commit a final stack — binding choices are deferred to ADRs 0001–0004 (and effectively realized
  by the later locked ADRs 0010/0013/0019).
- precedence note: This SPEC is lower precedence than the ADRs. Where it overlaps DEC-0003
  (deployment), DEC-0010 (API surface), DEC-0013 (DB foundation), DEC-0019 (scheduling), the ADRs
  bind. No contradiction — the SPEC defers to the ADRs by its own statement. See INGEST-CONFLICTS.md.

## SPEC-002 — Non-functional requirements and quality targets (nfr)
- source: docs/requirements/non-functional-requirements.md (SPEC)
- type: nfr
- content: 12 numbered NFRs with acceptance criteria: reliability, privacy, security,
  accessibility, latency (incl. NFR-005 turn-latency budget), cost control, observability, data
  retention/deletion, scalability, portability, safety communication, testability — plus
  scheduler, calendar-integration, LLM/transcription, and agent-job targets. NFR-009 fixes the
  pilot scale (tens to low hundreds of users) that many ADRs build against.
- precedence note: DEC-0020 (concrete performance budgets/test stack) and DEC-0018 (observability
  vendors/alerting) bind the concrete numbers and tooling; this SPEC states the targets they
  satisfy. Auto-resolved by precedence, no factual contradiction. See INGEST-CONFLICTS.md.

---

## CON-api-anchor-hermes (api-contract)
- source: docs/adr/0010-supabase-edge-functions-as-anchor-hermes-api.md (DEC-0010, LOCKED)
- type: api-contract
- content: Single Supabase Edge Functions (Deno/TypeScript) API surface under `/functions/v1/<name>`;
  identical consumption by webapp and Hermes (Hermes over VPS loopback). Hand-maintained
  `docs/api/openapi.yaml` is the contract. Auth: stacked service-role JWT plus `x-hermes-secret`
  header for Hermes-only functions; webapp uses session JWT. Endpoint inventory: auth-resolve-telegram,
  pairing-issue, pairing-redeem, turn-start, turn-deliver, turn-fail, plan-state, calendar-list,
  calendar-add, memory-recall, memory-store, diary-append, hermes-cache-invalidate. Plan-state
  cache 30s TTL, invalidated on Stripe subscription webhooks. turn-deliver idempotent on turn_id.

## CON-stripe-webhook-protocol (protocol)
- source: docs/adr/0016-stripe-operations-customer-lifecycle-webhooks-vat.md (DEC-0016, LOCKED)
- type: protocol
- content: Stripe Customer created at magic-link email verification. Price/Product IDs in single-row
  `app_config` (60s TTL); `STRIPE_MODE` selects test/live. Webhooks idempotent on Stripe event-id via
  `INSERT ... ON CONFLICT (id) DO NOTHING` on `stripe_event_log`, side effects in same transaction;
  signature verified via `stripe.webhooks.constructEvent`. Reconciliation job hourly. Outbound
  idempotency key `<anchor_user_id>:<intent>:<utc_minute>`. VAT net-fixed (EUR 8,40 net / EUR 10,00
  incl. 19% DE) with Stripe Tax country-specific Checkout totals (updates BPR-005 wording).

## CON-pairing-code-protocol (protocol)
- source: docs/adr/0007-single-shared-telegram-bot-with-pairing-code.md (DEC-0007, LOCKED)
- type: protocol
- content: One shared Telegram bot for all users (no per-user bots). Pairing Code = 8-char Crockford
  Base32 (`0-9A-HJKMNP-TV-Z`, omits I/L/O/U), single-use, 15-min TTL, bound to issuing Account;
  deep link `https://t.me/<bot>?start=<code>`. Issuance rate-limited 5/hour/account. Re-pairing burns
  prior binding, sends farewell + 24h email undo. Telegram pairing is a hard onboarding gate before
  Checkout. Unpaired accounts deleted after 90 days.

## CON-google-oauth-scope (protocol)
- source: docs/adr/0008-google-calendar-oauth-scope-and-token-lifecycle.md (DEC-0008, LOCKED)
- type: protocol
- content: Single OAuth scope `https://www.googleapis.com/auth/calendar.events`. Refresh tokens
  encrypted at rest (pgcrypto envelope; master key in Hermes env, half-yearly rotation); access tokens
  never persisted. External-revocation detection: lazy (invalid_grant/401 → `disconnected_external`)
  + weekly proactive `calendarList.list` ping. During disconnect: omit calendar block, buffer Pending
  Calendar Additions ≤7 days then drop+audit. Re-Consent Flow uses `access_type=offline&prompt=consent`.

## CON-db-foundation (schema)
- source: docs/adr/0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md (DEC-0013, LOCKED)
- type: schema
- content: Self-hosted Supabase Postgres on the VPS. Plain SQL migrations under
  `supabase/migrations/<ts>_<name>.sql` applied via `psql -f` are the schema source of truth; Drizzle
  is the query layer only (introspect → `src/db/schema.ts`). UUIDv7 PKs via `pg_uuidv7`. `anchor_user.id
  = auth.users.id` (FK ON DELETE CASCADE); RLS uses `auth.uid() = anchor_user_id`. Hard-delete cascade
  for GDPR Art.17; soft-delete (`deleted_at`) on `memory_fact`/`diary_entry` for Recall Exclusion;
  audit tables retained 12 months then anonymized.

## CON-memory-index-schema (schema)
- source: docs/adr/0004-anchor-specific-memory-index-instead-of-ob1-thoughts.md (DEC-0004, not locked)
- type: schema
- content: Domain-specific Postgres memory index with real FKs (`conversation_transcript_id`,
  `diary_entry_id`, `memory_fact_id`, `calendar_event_id`), `anchor_user_id`, `source_kind`,
  `occurred_at`, `recall_excluded_at`. CHECK constraint: exactly one canonical source FK populated and
  `source_kind` matches it. Reuses OpenBrain Supabase/pgvector/Edge-Function patterns but NOT the OB1
  generic `thoughts` table; no free-form source_table/source_id strings.

## CON-minute-accounting-schema (schema)
- source: docs/adr/0009-conversation-minute-accounting-and-limit-ux.md (DEC-0009, LOCKED)
- type: schema
- content: Charge = wall-clock `turn_started_at`→`delivered_at` (Telegram 200 OK); voice charged
  transcription-start→sendVoice 200 OK. Failed turns recorded `status=failed` 30 days, not charged.
  Idempotent `increment_minutes(anchor_user_id, turn_id, delta_seconds)` RPC keyed on turn_id. Daily
  Minute Usage Row created lazily; reset at `(now() AT TIME ZONE users.timezone)::date`; IANA zone
  autodetected at signup. Pro→Free downgrade applies at next turn with single in-flight Downgrade Grace.

## CON-plan-mirror-schema (schema)
- source: docs/adr/0005-stripe-subscription-for-pro-conversation-minutes.md (DEC-0005, LOCKED)
- type: schema
- content: Single EUR 10/month Pro plan selling Daily Conversation Minutes via Stripe Checkout +
  Customer Portal. Plan state mirrored into `anchor_user_plan` (keyed by `anchor_user_id`; explicit FK,
  no free-form jsonb, integers/timestamps). Stripe = billing source of truth; Anchor DB = runtime
  enforcement source of truth. Hermes reads plan from Anchor backend, never calls Stripe in hot path.
  Anchor stores only `stripe_customer_id`/`stripe_subscription_id` (no PAN/CVC/BIN).

## CON-realtime-protocol (protocol)
- source: docs/adr/0015-supabase-realtime-for-webapp-state-sync.md (DEC-0015, LOCKED)
- type: protocol
- content: Webapp subscribes to Supabase Realtime on the user's own RLS-scoped rows (`anchor_user
  WHERE id = auth.uid()`, `google_connection`, `stripe_subscription`); UI updates ~0.5s after server
  write. 30-second polling fallback re-fetches same queries when channel closed/throttled. Never renders
  "Pro aktiv" before the DB row reflects it (avoids BPR-009 surprise). No cross-user channels.

## CON-scheduling-protocol (protocol)
- source: docs/adr/0019-scheduling-via-pg-cron-in-supabase.md (DEC-0019, LOCKED)
- type: protocol
- content: All scheduled jobs are `cron.job` pg_cron entries; jobs needing external action call Edge
  Functions via `net.http_post`. Hermes runs no cron. Jobs: daily-morning-checkins (every min),
  stripe-reconcile-hourly, google-connection-weekly-ping, email-bounce-decay, pairing-code-expire (5
  min), pending-calendar-flush (15 min), audit-anonymize-monthly, operator-digest-daily. Missed runs
  skipped (no catch-up replay); user-facing jobs delayed <1h fire with `delayed_recovery=true`, >1h
  dropped+audited. Idempotency via guard query + `pg_try_advisory_lock(<job_id>)`.

## CON-i18n-protocol (protocol)
- source: docs/adr/0012-i18n-next-intl-de-authoritative.md (DEC-0012, LOCKED)
- type: protocol
- content: next-intl; German authoritative legal locale, English secondary; subpath routing /de /en,
  bare `/`→`/de`, `NEXT_LOCALE` cookie. Catalogs `messages/<locale>/<namespace>.json`, per-route
  namespace loading; ICU syntax only. CI key-parity via `scripts/i18n-check.ts` (fails build on
  missing/extra keys); i18n-unused = PR comment. Hermes carries ~2 dozen static strings
  `locales/{de,en}.json` synced via `pnpm sync-locales`. `users.locale` from Accept-Language at signup.

## CON-email-deliverability (protocol)
- source: docs/adr/0017-email-delivery-via-resend.md (DEC-0017, LOCKED)
- type: protocol
- content: All transactional email via Resend from verified `anchor.com`; React Email templates
  (HTML+text). DKIM/SPF/DMARC at DNS (`p=quarantine`→`p=reject` after 2 clean weeks). From:
  `noreply@anchor.com` / `vertrauen@anchor.com`; Reply-To `kontakt@anchor.com`. Bounce webhook → Edge
  Function `email-bounce` sets `anchor_user.email_bounced_at`; Magic Link send skipped if bounced <24h.
  Rate caps: Magic Link 3/hour/account, Trusted Person invites 10/day/account, re-pairing alerts
  coalesced within 5 min. `email_log(message_id, anchor_user_id, type, status, sent_at)`; no payload bodies.

## CON-voice-transcriber-interface (api-contract)
- source: docs/adr/0014-voice-transcription-modular-deepgram-with-whisper-fallback.md (DEC-0014, LOCKED)
- type: api-contract
- content: `Transcriber.transcribe(audio: Buffer, lang: 'de'|'en'): Promise<{text; durationMs;
  provider; cost_cents}>`. Deepgram Nova-3 primary (de, batch), OpenAI whisper-1 fallback; per-call
  `pickTranscriber()` factory with circuit breaker. Audio downloaded to Hermes memory, sent with
  training-opt-out, discarded after transcript; never persisted. Transcript → `conversation_turn.transcript`.
  Voice opt-in-by-default with explicit consent (`anchor_user.voice_consent_at`); EU SCCs. Cost in
  `agent_cost_log`; default EUR 5/month/user voice cost cap → throttle.

## CON-performance-budgets (nfr)
- source: docs/adr/0020-testing-strategy-and-performance-budgets.md (DEC-0020, LOCKED)
- type: nfr
- content: Mobile-first (older Android, Slow-4G): LCP <2.0s, INP <200ms (p75), CLS <0.1, first-load JS
  <90 KB gz landing / <150 KB account, Lighthouse >=90 mobile / >=95 desktop all categories. Lighthouse
  CI gates each PR; `@next/bundle-analyzer` on demand (>5% JS growth needs written justification). Test
  stack: Vitest (70% critical-path coverage), Playwright E2E (gate to main), custom LLM-judge Agent Eval
  Harness (>5pp regression blocks), manual UAT via `docs/uat/<feature>.md`.

## CON-observability-alerting (nfr)
- source: docs/adr/0018-operator-surface-via-supabase-studio-and-three-observability-vendors.md (DEC-0018, LOCKED)
- type: nfr
- content: Operator surface = Supabase Studio behind IP allowlist; all user-data mutations go through
  `SECURITY DEFINER` `op_<verb>_<noun>` procs writing `operator_action_log` in same txn. Observability:
  Sentry (errors/perf), Axiom (structured JSON logs, fixed schema), Better Stack Uptime (60s checks vs
  `/api/health`). Health JSON `{supabase, last_stripe_webhook_age_s, last_hermes_heartbeat_age_s, version}`;
  heartbeat >90s fails. Alerts P1/P2/digest. Retention Sentry/Axiom 30d, audit 12mo then anonymize.

## CON-compliance-posture (nfr)
- source: docs/adr/0021-legal-and-compliance-layer.md (DEC-0021, LOCKED)
- type: nfr
- content: Four German legal docs (Impressum §5 DDG, Datenschutz GDPR 13/14, AGB, Widerruf) at
  `/impressum /datenschutz /agb /widerruf`, German authoritative, persistent footer, server-rendered.
  14-day Widerrufsrecht: required unchecked immediate-performance acknowledgment before subscribe,
  logged w/ timestamp. Cookie-consent-free (only the strictly-necessary HttpOnly session cookie under
  §25 TDDDG; no analytics/trackers — load-bearing). Versioned sub-processor register (AVV/DPA per
  processor). GDPR Art.17 erasure `/account/delete` (magic-link confirm → 7-day grace → purge job +
  tombstone) and Art.20 export `/account/export` (async JSON bundle emailed); both have operator fallback.
