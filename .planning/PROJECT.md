# Anchor

## What This Is

Anchor is a Telegram-first conversational "second brain" for older adults with memory difficulties. The User sends text or voice to a personal Anchor Agent in Telegram; the agent transcribes voice, extracts memory facts, keeps a dated diary, reads and writes Google Calendar, runs proactive morning/evening check-ins, and replies in a warm "Good Friend Voice". A Next.js webapp handles signup, Telegram and Google pairing, agent settings, trusted-contact recovery, and Stripe billing. The product is non-clinical: it never frames the User as a patient and is not a medical device or emergency service.

## Core Value

A User with memory difficulties can converse naturally with their Anchor Agent (text or voice) and reliably recall what was said, what happened, and what is coming up — grounded in real source evidence, never fabricated.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current v1 scope. Full checkable list in REQUIREMENTS.md. -->

- [ ] User identity, magic-link login, Telegram pairing, Google Calendar connection, agent settings (REQ-product-vision, REQ-functional, REQ-user-journeys, REQ-webapp-ui-ux)
- [ ] Telegram text + voice agent interaction with Good Friend Voice and voice transcription (REQ-agent-behavior, REQ-functional)
- [ ] Memory: source-evidence capture, fact extraction, date + topic recall, correction, update, deletion (REQ-memory, REQ-diary)
- [ ] Dated diary from check-ins and conversations (REQ-diary)
- [ ] Google Calendar read/write, morning check-in, calendar additions without confirmation, reminder patterns (REQ-calendar)
- [ ] Proactive morning calendar + evening diary check-ins (REQ-agent-behavior, REQ-functional)
- [ ] Daily Conversation Minute accounting, gentle limit UX, Free/Pro plans (REQ-billing-and-plans)
- [ ] Stripe Pro subscription, VAT, webhooks, plan-state mirror, upgrade/manage flows (REQ-billing-and-plans)
- [ ] Trusted-contact recovery, assisted password reset, emergency boundary, privacy/safety posture (REQ-privacy-safety)
- [ ] German legal/compliance layer, GDPR erasure + export, landing page with trust signals + AEO (REQ-compliance, REQ-webapp-ui-ux)
- [ ] Two deployables built together: Anchor (Next.js on Vercel + Supabase edge functions + self-hosted Postgres) and Hermes (Docker orchestrator on the VPS), seamed by the 13-endpoint edge-function contract

### Out of Scope

<!-- Explicit boundaries. Reasoning prevents re-adding. -->

- Caregiver role / caregiver dashboard — non-clinical product; deferred to a later milestone (mvp-scope, OQ-042)
- Shared family account / multi-user households — doubles consent + account-ownership surface (mvp-scope, OQ-042)
- Non-response Escalation — creates consent/safety/expectation complexity; trusted contacts are recovery-only in MVP (mvp-scope, OQ-003)
- Medical advice, diagnosis, treatment, emergency dispatch/monitoring — Anchor is not a medical device or emergency service (product-requirements)
- Always-on passive listening — privacy + scope; agent acts only on sent messages (mvp-scope)
- Voice output (TTS) — adds cost, voice design, delivery, accessibility testing; voice input only in MVP (OQ-002)
- Diary/memory browsing + editing in a rich web UI — Telegram agent is the day-to-day surface; correction/deletion happen in conversation (mvp-scope, OQ-001, OQ-020)
- User-visible Context Map / graph explorer — graph UI is complex and may confuse the target User (mvp-scope, OQ-021)
- Multiple external calendars, channels beyond Telegram, annual/coupon plans — single-channel, single monthly SKU for MVP (mvp-scope, OQ-043)

## Context

- **Build shape:** SPINE-THEN-RIBS. One sequential foundation pass (Phase 0) freezes shared interfaces — the cross-context DB schema, the 13-endpoint edge-function contract, and one Google-token-lifecycle module — then dependency-ordered parallel waves of bounded contexts build behind those frozen seams.
- **Two deployables, one seam:** (A) the Anchor repo and (H) Hermes are built together. The only seam between them is the 13-endpoint Supabase Edge Function contract (DEC-0010). Each work item is tagged A (Anchor) or H (Hermes).
- **Execution model:** Supervised per-phase — plan → execute → verify, with a review gate between phases.
- **Pilot scale:** ~10 pilot Users (NFR-009, DEC-0003). Isolation, observability, and cost controls are sized for this; per-user containers are explicitly deferred.
- **Prior decisions:** 22 ADRs exist. DEC-0005..0022 are Accepted/LOCKED. DEC-0001..0004 are proposed foundations (no `Status: Accepted` yet) that the locked layer already depends on.
- **Memory architecture is the product core:** Supabase/Postgres is the source of truth and retrieval store; canonical relational records (transcripts, diary, facts, calendar) carry FTS + vector indexes. A domain-specific memory index with real FKs and a single-source CHECK constraint (DEC-0004) replaces any generic thoughts table.
- **Compliance is launch-gating:** German/EU B2C. GDPR-first, German authoritative legal language, cookie-consent-free posture. Legal prose (Impressum/Datenschutz exist as drafts; AGB + Widerruf unwritten) needs qualified legal review before launch (CR-011).

## Constraints

- **Tech stack (LOCKED):** Next.js 15 App Router on Vercel; Tailwind + shadcn/ui + magic-ui; next-intl (DE authoritative, EN secondary) (DEC-0011, DEC-0012).
- **Backend (LOCKED):** Self-hosted Supabase Postgres on a Hostinger VPS; plain SQL migrations applied via psql as schema source of truth; Drizzle as query layer only; UUIDv7 PKs; `anchor_user.id = auth.users.id`; RLS via `auth.uid()` (DEC-0003, DEC-0013).
- **API seam (LOCKED):** Single Supabase Edge Functions (Deno) surface of 13 endpoints, consumed identically by webapp and Hermes; service-role JWT + `x-hermes-secret` for Hermes-only functions; OpenAPI contract is `docs/api/openapi.yaml` (DEC-0010).
- **Auth (LOCKED):** Passwordless magic-link login; trusted-person recovery; no password fallback (DEC-0006).
- **Voice (LOCKED):** Deepgram Nova-3 primary, OpenAI Whisper fallback behind a modular `Transcriber` interface; audio never persisted; voice consent required; €5/month/user cost cap (DEC-0014).
- **Realtime + scheduling (LOCKED):** Supabase Realtime on RLS-scoped rows with 30s polling fallback (DEC-0015); all scheduled jobs are pg_cron entries calling Edge Functions, missed runs skipped (DEC-0019).
- **Billing (LOCKED):** Single €10/month Pro plan selling Daily Conversation Minutes via Stripe Checkout + Customer Portal; plan mirrored to `anchor_user_plan`; event-id-idempotent webhooks; net-fixed VAT via Stripe Tax (DEC-0005, DEC-0009, DEC-0016).
- **Email (LOCKED):** All transactional email via Resend with DKIM/SPF/DMARC and bounce gating (DEC-0017).
- **Quality gates (LOCKED):** Vitest ≥70% critical-path coverage; Playwright E2E gate to main; custom LLM-judge Agent Eval Harness (>5pp regression blocks); Lighthouse CI budgets (LCP <2.0s, INP <200ms, CLS <0.1, first-load JS <90KB landing / <150KB account) (DEC-0020).
- **Observability (LOCKED):** Sentry + Axiom + Better Stack; operator surface = Supabase Studio with audited `SECURITY DEFINER` procs (DEC-0018).
- **Compliance (LOCKED):** German legal docs at `/impressum /datenschutz /agb /widerruf`; cookie-consent-free; 14-day Widerruf acknowledgment at Checkout; GDPR Art.17 erasure + Art.20 export self-service (DEC-0021, DEC-0022).
- **Privacy:** Never expose retrieval internals, confidence scores, embeddings, graph metadata, OAuth/token language, or provider quota language to the User (product-requirements, PSR, WUX-009).

## Key Decisions

<!-- Decisions that constrain future work. DEC-0005..0022 are ADR-locked; DEC-0001..0004 are proposed. -->

<decisions>

### Proposed (ADRs 0001–0004 — not yet Accepted)

| ID | Decision | Status |
|----|----------|--------|
| DEC-0001 | Calendar additions happen without a separate confirmation prompt (act-and-acknowledge) | — Proposed |
| DEC-0002 | Hermes orchestrates Telegram agent communication; Anchor backend owns state/permissions/memory | — Proposed |
| DEC-0003 | Single Hostinger VPS runs Hermes and Supabase in separate Docker containers for MVP | — Proposed |
| DEC-0004 | Domain-specific Postgres memory index with real FKs instead of OB1 generic thoughts table | — Proposed |

### Locked (ADRs 0005–0022 — Status: Accepted)

| ID | Decision | Status |
|----|----------|--------|
| DEC-0005 | Stripe subscription: single €10/mo Pro plan selling Daily Conversation Minutes; mirror to `anchor_user_plan` | LOCKED |
| DEC-0006 | Passwordless magic-link auth with trusted-person recovery; no password fallback | LOCKED |
| DEC-0007 | Single shared Telegram bot; 8-char Crockford-Base32 pairing code, 15-min TTL, deep link | LOCKED |
| DEC-0008 | Google Calendar `calendar.events` scope; refresh tokens encrypted (pgcrypto); revocation detection; buffered additions | LOCKED |
| DEC-0009 | Conversation Minute accounting on confirmed delivery; `increment_minutes` RPC; user-local midnight reset; over-limit UX | LOCKED |
| DEC-0010 | Supabase Edge Functions (Deno) as the 13-endpoint Anchor↔Hermes API; service-role JWT + `x-hermes-secret` | LOCKED |
| DEC-0011 | Next.js 15 App Router on Vercel; Tailwind + shadcn/ui + magic-ui | LOCKED |
| DEC-0012 | i18n via next-intl; German authoritative locale; subpath /de /en; CI key-parity check | LOCKED |
| DEC-0013 | DB foundation: plain SQL migrations + Drizzle query layer + UUIDv7; `anchor_user.id = auth.users.id`; RLS | LOCKED |
| DEC-0014 | Voice transcription: Deepgram Nova-3 primary, Whisper fallback, modular `Transcriber`; audio not persisted | LOCKED |
| DEC-0015 | Supabase Realtime for webapp state sync on RLS-scoped rows; 30s polling fallback | LOCKED |
| DEC-0016 | Stripe ops: customer-at-signup; event-id idempotent webhooks; hourly reconciliation; net-fixed VAT via Stripe Tax | LOCKED |
| DEC-0017 | Transactional email via Resend; React Email; DKIM/SPF/DMARC; bounce gating | LOCKED |
| DEC-0018 | Operator surface = Supabase Studio + audited SECURITY DEFINER procs; observability via Sentry/Axiom/Better Stack | LOCKED |
| DEC-0019 | Scheduling via pg_cron in Supabase triggering Edge Functions; missed runs skipped; advisory-lock idempotency | LOCKED |
| DEC-0020 | Testing: Vitest + Playwright + Agent Eval Harness + Lighthouse CI; mobile-first performance budgets | LOCKED |
| DEC-0021 | German legal/compliance layer; cookie-consent-free; 14-day Widerruf; GDPR Art.17 erasure + Art.20 export | LOCKED |
| DEC-0022 | Landing-page trust signals (incl. medical-device disclaimer) + AEO content layer with FAQPage/Organization JSON-LD | LOCKED |

</decisions>

## Risks & Ship-Blockers

<!-- Must be resolved before launch. Tracked in STATE.md Blockers/Concerns. -->

| ID | Risk / Blocker | Severity | Owner action |
|----|----------------|----------|--------------|
| BLK-01 | AGB + Widerrufsbelehrung are **unwritten**; qualified legal review pending (CR-011). A German paid product cannot launch without them. | Ship-blocker | Engage qualified legal party; draft + review before Phase 4 ships |
| BLK-02 | USt-IdNr **DE455180377** must be added to Impressum and Datenschutz (CR-003 operator-supplied fields). | Ship-blocker | Add to operator config; build fails on unset Impressum slots |
| BLK-03 | Free/Pro daily minute caps undecided (OQ-040, ⛔ BLOCKS SHIP). Placeholder: Free 15 min/day, Pro 120 min/day — must be set in config before any minute-enforcement code ships. | Ship-blocker | Freeze caps in `app_config`; calibrate against pilot |
| BLK-04 | Minimum acceptable recall quality undefined (OQ-022, ⛔ BLOCKS SHIP). Eval scenario set + pass threshold gate launch; recall quality is the product core. | Ship-blocker | Define agent-eval scenarios + threshold in Phase 4 |
| BLK-05 | First scale target not frozen (OQ-011, ⛔ BLOCKS SHIP). Assumed ~10-User pilot (NFR-009, DEC-0003); confirm and freeze — isolation/observability/cost depend on it. | Ship-blocker | Confirm pilot number; record in PROJECT.md |
| OQ-06 | **Open question (not a blocker):** ADR-0006 cross-references a non-existent `0005-local-first-data-with-end-to-end-encrypted-sync.md` and protects an "E2E master key" no present ADR defines. Current architecture is server-side Supabase (DEC-0003/0013), so this is most likely a stale cross-ref from an abandoned local-first/E2E approach. | Open question | Confirm: is a local-first/E2E ADR expected, or is the cross-ref stale? Reconcile DEC-0006 recovery semantics accordingly. |
| RISK-07 | DEC-0001..0004 are proposed, not Accepted, yet the locked layer depends on them. | Risk | Add `Status: Accepted` to lock ADRs 0001–0004 (synthesis follow-up #1) |

---

## Evolution

PROJECT.md evolves throughout the project lifecycle.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)

---
*Last updated: 2026-05-30 after /gsd-ingest-docs bootstrap (49 docs synthesized; 22 ADRs)*
