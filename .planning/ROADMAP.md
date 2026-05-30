# Roadmap: Anchor

## Overview

Anchor is built as two deployables together — (A) the Anchor repo (Next.js on Vercel + Supabase edge functions + self-hosted Postgres) and (H) Hermes (a Docker orchestrator on the same VPS) — seamed only by the 13-endpoint Supabase Edge Function contract. The build shape is **Spine-then-Ribs**: a single sequential foundation pass (Phase 0) freezes the shared interfaces — the cross-context DB schema, the 13-endpoint contract, and one Google-token-lifecycle module — and proves the full Anchor↔Hermes seam end-to-end via Telegram pairing. Then four dependency-ordered waves build the bounded contexts behind those frozen seams: Wave 1 (identity, billing, safety, diary), Wave 2 (memory, calendar, usage-limits, webapp-UI), Wave 3 (Hermes turn orchestration, voice, proactive check-ins), and Ship-readiness (landing/AEO, compliance, operator surface, full quality-gate hardening). Execution is supervised per-phase: plan → execute → verify, with a review gate between phases.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2): Planned milestone work
- Decimal phases (e.g. 2.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 0: Spine & Interface Freeze** - Sequential foundation: scaffold, frozen DB schema, 13-endpoint contract, magic-link auth, CI gates, Hermes skeleton; proves the seam via Telegram pairing end-to-end
- [ ] **Phase 1: Wave 1 — Identity, Billing, Safety, Diary** - Parallel bounded contexts behind frozen interfaces: user-identity, Stripe billing, trusted-contact recovery/emergency boundary, dated diary
- [ ] **Phase 2: Wave 2 — Memory, Calendar, Usage-Limits, Webapp-UI** - Parallel: memory context map + recall/correction/deletion, Google read/write + check-in data, minute counter + gentle limit, setup wizard + account pages
- [ ] **Phase 3: Wave 3 — Hermes Orchestration, Voice, Proactive Check-ins** - Hermes-heavy integration: turn routing + Good Friend Voice + limit enforcement, Deepgram/Whisper voice, pg_cron morning/evening check-ins
- [ ] **Phase 4: Ship-readiness** - Landing + AEO + trust signals, compliance pages + legal review, operator surface + observability, full Playwright suite + perf budgets + agent eval harness

## Phase Details

### Phase 0: Spine & Interface Freeze
**Goal**: Freeze every shared interface between Anchor and Hermes and prove the full seam end-to-end, so the four parallel waves can build behind stable contracts without re-negotiating boundaries.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-mvp-scope, REQ-user-journeys, REQ-functional (account/identity/edge-fn/i18n/CI backbone)
**Build shape**: SEQUENTIAL spine, dependency-ordered into 4 waves (no two same-wave plans share files)
**Work items**:
  - [A] Next.js 16 / Vercel scaffold (proxy.ts middleware, next-intl v4, Tailwind v4 CSS-first) + shadcn/magic-ui + next-intl DE/EN + app shell & Rudolpho-AI branding (DEC-0011 amended 2026-05-30, DEC-0012)
  - [A] DB migration foundation: plain SQL + Drizzle query layer + UUIDv7 + RLS; `anchor_user.id = auth.users.id` (DEC-0013)
  - [A] Magic-link auth + device-bound session (DEC-0006)
  - [A] The 13-endpoint edge-fn contract stub + `x-hermes-secret` + `docs/api/openapi.yaml` (DEC-0010)
  - [A] CI gates wired: Vitest, Playwright, Lighthouse, i18n key-parity (DEC-0020, DEC-0012)
  - [A] VPS/Supabase environment smoke (CREATE EXTENSION + Realtime publication) — first task, fails fast on the self-hosted beta risk
  - [H] Docker skeleton, Telegram webhook receive, pairing-code redeem via edge fn, echo turn (DEC-0002, DEC-0003, DEC-0007)
**FREEZE artifacts (gate to exit phase)**:
  - Cross-context DB schema: `anchor_user`, transcripts/source-evidence, memory entity+relationship DDL, plan/subscription, `trusted_contact`, `google_connection`, `telegram_session`
  - The 13-endpoint Anchor↔Hermes contract
  - One Google-token-lifecycle module (DEC-0008)
**Success Criteria** (what must be TRUE):
  1. A logged-in User can pair Telegram end-to-end (UJ-002) — webapp issues a pairing code, the user redeems it via the Telegram deep link, Hermes echoes a turn, and the webapp confirms "connected" via Supabase Realtime — proving both repos, the edge-fn seam, and realtime together.
  2. The frozen DB schema migrations apply cleanly via psql, Drizzle introspects them, RLS scopes every table to `auth.uid()`, and the schema is committed as the source of truth.
  3. The 13-endpoint contract is callable by both webapp (session JWT) and Hermes (service-role + `x-hermes-secret`); `docs/api/openapi.yaml` matches the deployed stubs.
  4. CI is green: Vitest, Playwright (pairing journey), Lighthouse, and i18n key-parity all run and pass on every PR.
**Plans**: 6 plans (4 waves)
  - [ ] 00-01-PLAN.md — [A] VPS/Supabase environment smoke: CREATE EXTENSION + Realtime publication probe (Wave 1, BLOCKING)
  - [ ] 00-02-PLAN.md — [A] Next 16 scaffold + Tailwind v4 + shadcn + next-intl v4 (proxy.ts) + Rudolpho-AI brand shell (Wave 1)
  - [ ] 00-03-PLAN.md — [A] Frozen cross-context DB schema (full DDL) + RLS + realtime + drizzle-kit pull (Wave 2)
  - [ ] 00-04-PLAN.md — [A] CI gates: Vitest + Playwright (UJ-002 scaffold) + Lighthouse budgets + i18n key-parity (Wave 2)
  - [ ] 00-05-PLAN.md — [A] 13-endpoint edge-fn stubs + OpenAPI + two-tier auth + Google-token module + magic-link auth (Wave 3)
  - [ ] 00-06-PLAN.md — [A+H] Hermes skeleton + pairing UI + Realtime hook + UJ-002 E2E exit gate (Wave 4)
**UI hint**: yes

### Phase 1: Wave 1 — Identity, Billing, Safety, Diary
**Goal**: Stand up four independent bounded contexts behind the frozen interfaces so a User has a real account with a plan, recovery safety net, and a working dated diary.
**Depends on**: Phase 0
**Requirements**: REQ-product-vision, REQ-privacy-safety, REQ-diary (+ identity/billing/safety FRs from REQ-functional)
**Build shape**: PARALLEL (4 bounded contexts behind frozen seams)
**Work items**:
  - [A] **User-Identity**: Anchor Account, profile, login, agent-settings persistence, locale preference (FR-001..003, FR-080/081, UJ-001)
  - [A] **Billing (Stripe)**: customer-at-signup, `anchor_user_plan` mirror, webhook handler + idempotency, reconciliation job, Checkout/Portal handoff plumbing (DEC-0005, DEC-0016; FR-070/071/074/075; BPR-*)
  - [A] **Safety**: trusted-contact invitation + verification, assisted password reset, recovery flow, emergency boundary surfacing, least-privilege guarantees (DEC-0006; FR-050/051; PSR-*; UJ-010)
  - [A+H] **Diary**: dated entries with source evidence, canonical relational storage, deletion + recall exclusion, export hook (DEC-0004, DEC-0013; DR-001..008; FR-041)
**Success Criteria** (what must be TRUE):
  1. A new User can register one Anchor Account, log in via magic link, and set their agent settings + locale, with copy that uses "User" not "Patient".
  2. A User has exactly one `anchor_user_plan` row created as `free` at signup with no Stripe interaction, and Stripe webhooks keep it consistent idempotently.
  3. A User can invite and verify a Trusted Contact who can later assist a password reset (new password, revoked web sessions, Telegram/Google left intact) but never gains diary/calendar access or delete authority.
  4. A dated Diary Entry can be created and stored as a canonical record linked to Source Evidence, and a deleted entry enters Recall Exclusion while original evidence is preserved.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Wave 2 — Memory, Calendar, Usage-Limits, Webapp-UI
**Goal**: Deliver the product-core memory system, calendar integration, minute metering, and the full setup/account webapp so a User's data, limits, and surfaces are all real.
**Depends on**: Phase 1
**Requirements**: REQ-memory, REQ-calendar, REQ-billing-and-plans, REQ-webapp-ui-ux (+ memory/calendar/minute/UI FRs from REQ-functional)
**Build shape**: PARALLEL (4 bounded contexts)
**Work items**:
  - [A+H] **Memory**: context map (entities + relationships), fact extraction, date-based recall, context/topic recall, correction (supersede), update (historical), deletion with citation + confirmation (DEC-0004; MR-001..015; FR-042..047; UJ-007/008/009)
  - [A+H] **Calendar**: Google read/write, OAuth lifecycle + revocation handling, morning check-in data, calendar additions without confirmation, reminder patterns, calendar-as-memory-source (DEC-0001, DEC-0008; CAL-001..010; FR-020..022; UJ-003/006)
  - [A] **Usage-Limits**: daily conversation-minute counter (`increment_minutes` RPC), user-local midnight reset, gentle limit notice, plan-aware budget enforcement config (DEC-0009; FR-060/061/072/073)
  - [A] **Webapp-UI**: three-step setup wizard, account/connection status, `/account/plan` view + upgrade/manage, plan badge, in-context upgrade prompt, empty/edge states, realtime sync (DEC-0015; WUX-001..020, WUX-024; UJ-011/012/013)
**Success Criteria** (what must be TRUE):
  1. A User can ask a date-based or topic-based recall question and receive a grounded answer drawn only from Source Evidence, with light uncertainty when fuzzy and no exposed retrieval internals.
  2. A User can correct a fact (old fact superseded, evidence preserved) and delete memory with a citation + explicit confirmation, after which the content is excluded from recall.
  3. A User can connect Google Calendar, have today's events read for a morning check-in, and have a clear calendar addition written immediately without a confirmation prompt with the Calendar Write Acknowledgement.
  4. Daily conversation minutes accumulate durably per user-local day, reset at local midnight, and a gentle limit notice fires at the plan allowance without naming tokens, quotas, Stripe, or Pro.
  5. A User can complete the three-step setup wizard on a phone and view/upgrade/manage their plan at `/account/plan`, with the plan badge reflecting state via Realtime (never a stale or false-immediate claim).
**Plans**: TBD
**UI hint**: yes

### Phase 3: Wave 3 — Hermes Orchestration, Voice, Proactive Check-ins
**Goal**: Make the Anchor Agent fully conversational and proactive by wiring Hermes turn orchestration over the frozen edge functions, enabling voice, and scheduling the morning/evening check-ins.
**Depends on**: Phase 2
**Requirements**: REQ-agent-behavior (+ voice/check-in/turn FRs from REQ-functional: FR-011/012, FR-030/031/032)
**Build shape**: Hermes-heavy integration (sequential within Hermes; parallel-capable sub-tracks)
**Work items**:
  - [H] **Turn orchestration**: route each turn to memory/calendar/diary/safety edge fns, Good Friend Voice + small-talk mode, usage-limit enforcement in the hot path (DEC-0002, DEC-0009; ABR-*; FR-011)
  - [A+H] **Voice transcription**: modular `Transcriber` (Deepgram Nova-3 primary, Whisper fallback), audio-not-persisted lifecycle, voice consent, cost cap + tracking (DEC-0014; FR-012)
  - [A+H] **Proactive check-ins**: pg_cron morning calendar check-in (UJ-004) and evening diary check-in (UJ-005), one gentle follow-up then save partial answers, missed-reply handling (DEC-0019; FR-030/031/032)
**Success Criteria** (what must be TRUE):
  1. A User can hold a multi-turn text or voice conversation with the Anchor Agent that replies in Good Friend Voice, with voice messages transcribed (Deepgram, Whisper on failure) and audio discarded after transcription.
  2. When the User reaches their daily minute allowance mid-conversation, Hermes enforces it with a single gentle limit notice and stops until reset, never exposing tokens/quotas/Stripe/Pro.
  3. A User receives a proactive morning calendar check-in (today's relevant events, not an agenda dump, asking what to add) and an evening daily check-in (short multi-turn questions) at their configured local times.
  4. A single missed reply triggers at most one gentle follow-up, then the check-in stops and saves partial answers — it never triggers Non-response Escalation.
**Plans**: TBD

### Phase 4: Ship-readiness
**Goal**: Make Anchor launchable to real German users — public landing with trust + AEO, the complete legal/compliance surface, an operator surface with observability, and all quality gates green including the agent eval harness.
**Depends on**: Phase 3
**Requirements**: REQ-compliance (+ landing/trust/AEO from REQ-webapp-ui-ux: WUX-021/022/023; quality gates from REQ-functional)
**Build shape**: PARALLEL sub-tracks, converging on a launch gate
**Work items**:
  - [A] **Landing + AEO + trust**: calm hero with brand mark, pricing section, trust/reassurance block (incl. mandatory medical-device disclaimer), server-rendered AEO FAQ + FAQPage/Organization JSON-LD (DEC-0022; WUX-013/014/021/022/023)
  - [A] **Compliance**: legal routes `/impressum /datenschutz /agb /widerruf`, Widerruf consent at Checkout, cookie-consent-free posture, sub-processor register, GDPR Art.17 erasure (`/account/delete`) + Art.20 export (`/account/export`); **AGB + Widerruf still UNWRITTEN — qualified legal review per CR-011**; add USt-IdNr **DE455180377** to Impressum/Datenschutz (DEC-0021; CR-001..011)
  - [A] **Operator surface**: Supabase Studio + audited SECURITY DEFINER procs + observability (Sentry/Axiom/Better Stack) + health endpoint + alerting (DEC-0018)
  - [A+H] **Quality hardening**: full Playwright journey suite, Lighthouse perf-budget hardening, agent eval harness with frozen scenario set + pass threshold (DEC-0020)
**Success Criteria** (what must be TRUE):
  1. A scam-wary visitor lands on a crawlable, accessible page that states the medical-device disclaimer, shows transparent Free/Pro pricing with "Jederzeit kündbar", and emits FAQPage + Organization JSON-LD so answer engines can cite it.
  2. All four German legal documents are reachable from a persistent footer, the Checkout requires the unchecked 14-day Widerruf acknowledgment (logged with timestamp), the build fails if any Impressum slot (incl. USt-IdNr DE455180377) is unset, and AGB + Widerruf have passed qualified legal review.
  3. A User can self-service delete their account (magic-link confirm → 7-day grace → irreversible cascade purge) and export their data (async JSON bundle emailed), each with an operator fallback.
  4. The full quality gate is green: Vitest ≥70% critical-path, the Playwright journey suite passes as a merge gate, Lighthouse budgets hold, and the agent eval harness meets its frozen recall-quality threshold with no >5pp regression.
  5. The first paid Pro conversion is possible end-to-end (signup → pair → connect → converse → hit limit → upgrade via Stripe → Pro minutes available on next turn).
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Spine & Interface Freeze | 0/6 | Not started | - |
| 1. Wave 1 — Identity/Billing/Safety/Diary | 0/TBD | Not started | - |
| 2. Wave 2 — Memory/Calendar/Limits/UI | 0/TBD | Not started | - |
| 3. Wave 3 — Hermes/Voice/Check-ins | 0/TBD | Not started | - |
| 4. Ship-readiness | 0/TBD | Not started | - |
