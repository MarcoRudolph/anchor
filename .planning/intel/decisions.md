---
description: "Synthesized architecture decisions (ADRs) extracted from Anchor docs/adr/ during /gsd-ingest-docs"
paths:
  - "../INGEST-CONFLICTS.md"
  - "./SYNTHESIS.md"
---

# Decisions Intel

Synthesized from 22 ADR classification records (`docs/adr/0001`–`0022`).
Locked status reflects the canonical classification `locked` field:
ADRs 0001–0004 are **not locked** (no explicit `Status: Accepted`); ADRs 0005–0022 are **locked**.

Each entry preserves one decision separately. `source:` traces provenance back to the originating ADR.

---

## DEC-0001 — Calendar additions happen without a separate confirmation prompt
- source: docs/adr/0001-calendar-additions-without-confirmation.md
- status: proposed (locked: false — no explicit Status: Accepted)
- decision: Anchor creates a calendar event or reminder immediately on request and replies with a short acknowledgement, trading misheard-input risk for lower friction.
- scope: calendar event creation, reminders, Anchor Agent, voice input, confirmation prompt
- cross_refs: (none)

## DEC-0002 — Hermes orchestrates Telegram agent communication
- source: docs/adr/0002-hermes-orchestrates-telegram-agent-communication.md
- status: proposed (locked: false)
- decision: Hermes owns runtime Telegram conversation orchestration while the Anchor backend provides stable APIs and retains ownership of state, permissions, and memory.
- scope: Hermes, Telegram, Good Friend Voice, Small Talk Mode, calendar skill, diary skill, memory skill, Anchor backend, Google Connection, Recovery Flows, Zapier
- cross_refs: (none)

## DEC-0003 — Hostinger VPS runs Hermes and Supabase containers for MVP
- source: docs/adr/0003-hostinger-vps-with-hermes-and-supabase-containers.md
- status: proposed (locked: false)
- decision: MVP deployment baseline is a single Hostinger VPS running Hermes and Supabase in separate Docker containers, deferring per-user containers.
- scope: Hostinger VPS, Hermes, Supabase, Docker containers, MVP deployment topology, per-user data isolation
- cross_refs: (none)

## DEC-0004 — Anchor uses a domain-specific memory index instead of OB1 thoughts
- source: docs/adr/0004-anchor-specific-memory-index-instead-of-ob1-thoughts.md
- status: proposed (locked: false)
- decision: Anchor builds a domain-specific Postgres memory index with real foreign keys instead of reusing OB1's generic `thoughts` table.
- scope: memory index, OpenBrain Supabase/pgvector/Edge Functions, OB1 thoughts table, Conversation Transcripts, Diary Entries, Memory Facts, Calendar Events, Recall Exclusion, source integrity CHECK constraint
- cross_refs: (none)

## DEC-0005 — Stripe subscription for Pro Conversation Minutes (LOCKED)
- source: docs/adr/0005-stripe-subscription-for-pro-conversation-minutes.md
- status: LOCKED
- decision: Monetize Anchor via a single EUR 10/month Pro plan on Stripe selling Daily Conversation Minutes, with plan state mirrored into Supabase (`anchor_user_plan`) for runtime enforcement.
- scope: Stripe Checkout, Stripe Customer Portal, Pro plan, Daily Conversation Minutes, anchor_user_plan mirror table, Supabase, Hermes runtime enforcement, billing webhooks, reconciliation job
- cross_refs: docs/requirements/billing-and-plans-requirements.md; docs/adr/0002; docs/adr/0004; docs/contexts/usage-limits/CONTEXT.md; open-questions.md

## DEC-0006 — Passwordless magic-link auth with trusted-person recovery (LOCKED)
- source: docs/adr/0006-passwordless-magic-link-auth-with-trusted-person-recovery.md
- status: LOCKED
- decision: Adopt passwordless email magic-link login plus a 2-of-3 trusted-person quorum for E2E master-key recovery, with no password fallback.
- scope: authentication, magic-link login, device-bound sessions, trusted-person recovery, Shamir secret sharing, E2E master key recovery
- cross_refs: ./0005 (note: dangling — see conflicts INFO); ../requirements/REQUIREMENTS.md (dangling); ADR 0005; ADR 0007

## DEC-0007 — Single shared Telegram bot with Pairing Code (LOCKED)
- source: docs/adr/0007-single-shared-telegram-bot-with-pairing-code.md
- status: LOCKED (Status: Accepted in source)
- decision: Anchor runs one shared Telegram bot; pairing uses an 8-char Crockford-Base32 single-use code with a 15-minute TTL redeemed via a Telegram deep link.
- scope: Telegram bot, Pairing Code, Crockford Base32, Telegram deep link, Hermes orchestrator, Telegram Re-Pairing, onboarding gate, Pairing Code rate limiting, Anchor Account, telegram_user_id binding
- cross_refs: ../contexts/user-identity/CONTEXT.md; ../requirements/functional-requirements.md; ./0002

## DEC-0008 — Google Calendar OAuth scope and token lifecycle (LOCKED)
- source: docs/adr/0008-google-calendar-oauth-scope-and-token-lifecycle.md
- status: LOCKED (Status: Accepted in source)
- decision: Use the single `calendar.events` OAuth scope, encrypt refresh tokens at rest (Supabase pgcrypto envelope encryption), detect external revocation, and buffer calendar additions while disconnected.
- scope: Google OAuth, calendar.events scope, refresh token storage, Supabase pgcrypto envelope encryption, External Revocation detection, Google Connection State, Pending Calendar Additions, Re-Consent Flow, weekly proactive ping job
- cross_refs: ../contexts/calendar/CONTEXT.md; ../requirements/functional-requirements.md; ./0001

## DEC-0009 — Conversation Minute accounting and limit UX (LOCKED)
- source: docs/adr/0009-conversation-minute-accounting-and-limit-ux.md
- status: LOCKED
- decision: Daily Conversation Minutes are metered on Telegram-confirmed delivery, persisted in Postgres (`increment_minutes` RPC, Daily Minute Usage Row), reset at user-local midnight; defines over-limit UX (Gentle Limit Notice, Silence Refresh Notice, Limit Explanation Turn), voice-reply charging, failed-turn forensics, and Pro-to-Free downgrade grace.
- scope: Conversation Minute accounting, Daily Minute Usage Row, Postgres increment_minutes RPC, user-local timezone reset, over-limit UX, voice reply charging, failed turn forensics, Pro-to-Free downgrade grace, /account/plan view
- cross_refs: ../contexts/usage-limits/CONTEXT.md; ../requirements/agent-behavior-requirements.md; ../requirements/functional-requirements.md; ./0005

## DEC-0010 — Supabase Edge Functions as the Anchor↔Hermes API (LOCKED)
- source: docs/adr/0010-supabase-edge-functions-as-anchor-hermes-api.md
- status: LOCKED
- decision: Expose the Anchor backend as a single Supabase Edge Functions (Deno) API surface consumed identically by the webapp and the Hermes orchestrator over loopback; OpenAPI contract; service-role JWT auth plus `x-hermes-secret`; plan-state cache invalidated by Stripe webhooks.
- scope: Supabase Edge Functions, Deno runtime, Anchor API, Hermes orchestrator, OpenAPI contract, Hostinger VPS deployment, service-role JWT auth, x-hermes-secret, plan-state cache, Stripe webhook invalidation
- cross_refs: ../requirements/infrastructure-requirements.md; ./0002; ./0003

## DEC-0011 — Next.js on Vercel with Tailwind and shadcn/ui (LOCKED)
- source: docs/adr/0011-nextjs-on-vercel-with-tailwind-and-shadcn.md
- status: LOCKED
- decision: Lock the Anchor webapp as Next.js 15 App Router deployed to Vercel, styled with Tailwind CSS and shadcn/ui, with backend services remaining on the Hostinger VPS.
- scope: Anchor webapp frontend, Next.js 15 App Router, Vercel deployment and CDN, Tailwind CSS, shadcn/ui components, magic-ui motion library, next-intl internationalization, Stripe webhook Route Handlers, SEO/AEO funnel pages
- cross_refs: ../requirements/webapp-ui-ux-requirements.md; ../requirements/infrastructure-requirements.md; ./0003

## DEC-0012 — i18n: next-intl with German as authoritative locale (LOCKED)
- source: docs/adr/0012-i18n-next-intl-de-authoritative.md
- status: LOCKED
- decision: Adopt next-intl for the Anchor webapp with German as the authoritative legal locale, subpath routing (/de, /en), ICU formatting, namespaced catalogs, a CI key-parity check, and a synced Hermes string subset.
- scope: internationalization (i18n), next-intl, locale routing, message catalogs/namespaces, ICU pluralization, legal copy localization, CI key-parity check (scripts/i18n-check.ts), Hermes locale sync, users.locale
- cross_refs: ../requirements/webapp-ui-ux-requirements.md; ../requirements/functional-requirements.md; ./0011; ADR-0010

## DEC-0013 — Database foundation: plain SQL migrations, Drizzle query layer, UUIDv7 (LOCKED)
- source: docs/adr/0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md
- status: LOCKED
- decision: Plain SQL migrations applied via psql; Drizzle as query layer (not schema source); UUIDv7 primary keys; `anchor_user`/`auth.users` identity mapping; RLS policies; defined deletion/retention semantics.
- scope: self-hosted Supabase Postgres, plain SQL migrations, Drizzle ORM query layer, UUIDv7 primary keys, anchor_user/auth.users identity mapping, RLS policies, deletion and retention semantics
- cross_refs: ../requirements/infrastructure-requirements.md; ./0003; ./0010; docs/handoff.md (dangling — see conflicts INFO)

## DEC-0014 — Voice transcription: modular Deepgram with Whisper fallback (LOCKED)
- source: docs/adr/0014-voice-transcription-modular-deepgram-with-whisper-fallback.md
- status: LOCKED
- decision: Deepgram Nova-3 is the primary voice-transcription provider with OpenAI Whisper fallback behind a modular `Transcriber` interface; audio deleted after transcription with explicit user consent; cost tracking.
- scope: voice transcription, Deepgram Nova-3, OpenAI Whisper, Transcriber interface, Telegram voice messages, audio data lifecycle, voice consent, cost tracking
- cross_refs: ../requirements/functional-requirements.md; ../requirements/non-functional-requirements.md; ../requirements/infrastructure-requirements.md; ./0009

## DEC-0015 — Supabase Realtime for webapp state sync (LOCKED)
- source: docs/adr/0015-supabase-realtime-for-webapp-state-sync.md
- status: LOCKED
- decision: The webapp observes server-side state changes via Supabase Realtime subscriptions on the User's own RLS-scoped rows, with a 30-second polling fallback.
- scope: Supabase Realtime, webapp state synchronization, Onboarding Wizard, /account and /account/plan views, anchor_user/google_connection/stripe_subscription rows, RLS-scoped Realtime channels, polling fallback
- cross_refs: ../requirements/webapp-ui-ux-requirements.md; ../requirements/user-journeys.md; ../requirements/functional-requirements.md; ./0010; ./0011

## DEC-0016 — Stripe operations: customer lifecycle, webhooks, VAT (LOCKED)
- source: docs/adr/0016-stripe-operations-customer-lifecycle-webhooks-vat.md
- status: LOCKED
- decision: Customer created at signup; Price IDs in `app_config`; event-id idempotent webhooks (`stripe_event_log`) with hourly reconciliation; composite outbound idempotency keys; net-fixed VAT with country-specific Checkout markup via Stripe Tax.
- scope: Stripe Customer lifecycle, app_config table for Price/Product IDs, Stripe webhook handler, stripe_event_log idempotency, subscription reconciliation job, outbound idempotency keys, VAT handling at Checkout, Stripe Tax
- cross_refs: ../requirements/billing-and-plans-requirements.md; ../requirements/functional-requirements.md; ./0005; ./0010

## DEC-0017 — Email delivery via Resend (LOCKED)
- source: docs/adr/0017-email-delivery-via-resend.md
- status: LOCKED
- decision: Send all transactional email through Resend with React Email templates, DKIM/SPF/DMARC on the sending domain, send-rate limiting, `email_log`, and bounce-webhook gating via an `email-bounce` Edge Function.
- scope: transactional email, Resend, React Email templates, DKIM/SPF/DMARC, bounce handling, Magic Link email, Trusted Person Invitations, send-rate limiting, email_log, email-bounce Edge Function
- cross_refs: ../requirements/infrastructure-requirements.md; ../requirements/functional-requirements.md; ./0006; ./0011

## DEC-0018 — Operator surface and observability (LOCKED)
- source: docs/adr/0018-operator-surface-via-supabase-studio-and-three-observability-vendors.md
- status: LOCKED
- decision: During pilot scale the operator surface is Supabase Studio with audited `SECURITY DEFINER` stored procedures (`operator_action_log`); observability split across Sentry, Axiom, and Better Stack with a defined alerting policy and health endpoint.
- scope: operator surface, Supabase Studio, SECURITY DEFINER stored procedures, operator_action_log, observability, Sentry, Axiom structured logs, Better Stack Uptime, health endpoint, alerting policy, data retention
- cross_refs: ../requirements/non-functional-requirements.md; ../requirements/infrastructure-requirements.md; ../requirements/product-requirements.md; ./0013; ADR-0016; ADR-0013

## DEC-0019 — Scheduling via pg_cron in Supabase (LOCKED)
- source: docs/adr/0019-scheduling-via-pg-cron-in-supabase.md
- status: LOCKED
- decision: All scheduled jobs run as pg_cron entries in Supabase Postgres, triggering Edge Functions over HTTP; missed runs are skipped rather than catch-up replayed; job idempotency via advisory locks.
- scope: pg_cron, Supabase Postgres, scheduled jobs, cron.job table, Edge Functions, Hermes, Morning Calendar Check-in, job idempotency, advisory locks
- cross_refs: ../requirements/infrastructure-requirements.md; ../requirements/functional-requirements.md; ./0010; ./0013; ./0016; ADR-0010; ADR-0016; ADR-0008; ADR-0017; ADR-0007; ADR-0013; ADR-0018

## DEC-0020 — Testing strategy and performance budgets (LOCKED)
- source: docs/adr/0020-testing-strategy-and-performance-budgets.md
- status: LOCKED
- decision: Lock the quality stack (Vitest unit/integration, Playwright E2E, custom LLM-judge Agent Eval Harness, Lighthouse CI) and mobile-first performance budgets (LCP, INP, CLS, first-load JS).
- scope: Vitest, Playwright, Agent Eval Harness (LLM judge), User Acceptance Testing, Lighthouse CI, performance budgets, bundle analysis, font and image loading
- cross_refs: ../requirements/non-functional-requirements.md; ../requirements/agent-behavior-requirements.md; ../requirements/webapp-ui-ux-requirements.md; ./0011; ./0018; docs/uat/<feature>.md (dangling); DESIGN.md (dangling)

## DEC-0021 — Legal and compliance layer (LOCKED)
- source: docs/adr/0021-legal-and-compliance-layer.md
- status: LOCKED
- decision: Ship the German legal layer (Impressum, Datenschutz, AGB, Widerruf), run cookie-consent-free (strictly-necessary cookies only), maintain a versioned sub-processor register, implement 14-day Widerrufsrecht, and provide GDPR Art. 17 erasure (/account/delete) and Art. 20 export (/account/export) as self-service flows; Stripe Checkout immediate-performance acknowledgment.
- scope: German legal documents, cookie-consent-free posture, 14-day right of withdrawal, sub-processor register/AVV-DPA tracking, GDPR Art.17 erasure flow, GDPR Art.20 export flow, Stripe Checkout immediate-performance acknowledgment, localized legal routes and footer links
- cross_refs: ../requirements/non-functional-requirements.md; ../requirements/billing-and-plans-requirements.md; ../requirements/webapp-ui-ux-requirements.md; ../requirements/open-questions.md; ../compliance/impressum.md; ../compliance/datenschutz.md; ../compliance/subprocessors.md; ./0005; ./0006; ./0011; ./0016; ./0017

## DEC-0022 — Landing-page trust signals and AEO (LOCKED)
- source: docs/adr/0022-landing-page-trust-signals-and-aeo.md
- status: LOCKED
- decision: Add an above-the-fold trust/reassurance block (incl. medical-device disclaimer), a persistent legal/trust footer, and an AEO-structured server-rendered FAQ/definition layer with FAQPage and Organization JSON-LD plus SEO metadata so answer engines can cite the landing page.
- scope: landing page, trust/reassurance block, medical-device disclaimer, legal and trust footer, AEO content layer, server-rendered FAQ section, FAQPage JSON-LD, Organization JSON-LD, definition block, SEO metadata
- cross_refs: ../requirements/webapp-ui-ux-requirements.md; ../requirements/compliance-requirements.md; ./0011; ./0012; ./0021

---

## Locked-decision summary

Locked (18): DEC-0005, DEC-0006, DEC-0007, DEC-0008, DEC-0009, DEC-0010, DEC-0011, DEC-0012, DEC-0013, DEC-0014, DEC-0015, DEC-0016, DEC-0017, DEC-0018, DEC-0019, DEC-0020, DEC-0021, DEC-0022.

Not locked (4): DEC-0001, DEC-0002, DEC-0003, DEC-0004 (no explicit `Status: Accepted`).

No LOCKED-vs-LOCKED contradiction detected: each locked ADR governs a distinct scope. See INGEST-CONFLICTS.md.
