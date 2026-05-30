---
description: "Synthesized product requirements (PRDs) extracted from Anchor docs/requirements/ during /gsd-ingest-docs"
paths:
  - "../INGEST-CONFLICTS.md"
  - "./SYNTHESIS.md"
---

# Requirements Intel

Synthesized from 12 PRD classification records under `docs/requirements/`.
(`infrastructure-requirements.md` and `non-functional-requirements.md` are classified SPEC, not PRD,
and live in constraints.md.) Each requirement carries `source:` for provenance; IDs are derived as
`REQ-{slug}`. Internal numbered IDs (FR-*, BPR-*, CAL-*, etc.) are preserved from the source docs.
No two PRDs define the same requirement with divergent acceptance criteria, so there are zero
competing variants.

---

## REQ-product-vision
- source: docs/requirements/product-requirements.md
- description: Anchor is a low-friction conversational memory aid delivered via Telegram (with a
  companion webapp) for older adults with memory difficulties.
- acceptance (summary): Target users, value proposition, and core pillars (Telegram agent, calendar,
  daily check-in, memory-fact recall, trusted contacts, account recovery) are defined.
- scope: Anchor Agent, Telegram channel, webapp, Google Calendar integration, Daily Check-in, Memory
  Fact recall, Trusted Contacts, agent settings, Telegram pairing, account recovery
- cross_refs: (none)

## REQ-mvp-scope
- source: docs/requirements/mvp-scope.md
- description: In-scope, out-of-scope, and deferred ("Later, not now") feature boundaries for the
  Anchor MVP across identity, Telegram agent, check-ins, calendar, memory, and safety.
- acceptance (summary): Explicit In scope / Out of scope / Later sections plus "MVP hardcoding
  decisions" and "Scope risk" make the launch boundary unambiguous.
- scope: MVP scope boundaries, account/login, Telegram pairing+interaction, Google Calendar read/write,
  agent settings, voice transcription, proactive check-ins, calendar additions, memory facts/diary,
  recall/correction/deletion, Trusted Contacts (recovery-only), emergency boundary safety
- cross_refs: (none)

## REQ-functional
- source: docs/requirements/functional-requirements.md
- description: Numbered functional requirements FR-001..FR-081 covering account, Telegram, calendar,
  check-ins, memory, trusted contacts, billing, and i18n, each with acceptance criteria.
- acceptance (summary): Each FR has a requirement + acceptance-criteria pair. Note: a few FRs embed
  contract-level detail (FR-070 `anchor_user_plan` schema, FR-071 Stripe webhook events) that is
  bound authoritatively by the corresponding ADRs (DEC-0005/0016) — see constraints.md.
- scope: Anchor Account, identity/login, Agent Settings, Telegram pairing/messaging, Google Calendar,
  Morning/Daily Check-ins, memory facts/diary/recall/correction/deletion, Trusted Contacts/recovery,
  message+budget limits, Stripe billing/plan management, i18n (en/de)
- cross_refs: ../adr/0001 (DEC-0001); ../adr/0005 (DEC-0005); ../contexts/user-identity/CONTEXT.md

## REQ-user-journeys
- source: docs/requirements/user-journeys.md
- description: Thirteen end-to-end user journeys UJ-001..UJ-013 (onboarding, Telegram/Google pairing,
  daily/evening check-ins, memory recall/correction/deletion, Pro billing lifecycle, trusted-contact
  recovery) with Trigger/Preconditions/Steps/Data-created/Acceptance criteria.
- acceptance (summary): Each journey is mapped start-to-finish with explicit triggers, steps, data
  created, and acceptance criteria.
- scope: account/onboarding, Telegram pairing, Anchor Agent, Google Calendar Connection, Calendar
  Additions, Morning/Evening Check-ins, Memory Facts, recall/correction/deletion, Diary Entries,
  Source Evidence/Recall Exclusion, Stripe Pro lifecycle, Daily Conversation Minutes, Trusted Contact recovery
- cross_refs: (none — inline IDs only, e.g. WUX-017, /account/plan)

## REQ-webapp-ui-ux
- source: docs/requirements/webapp-ui-ux-requirements.md
- description: Numbered UI/UX requirements (WUX-*) for the MVP webapp: setup, settings, recovery,
  landing page, plan/upgrade, accessibility for older adults, privacy-preserving UI, i18n, AEO content.
- acceptance (summary): Each WUX requirement specifies the screen/behavior; landing trust+AEO layers
  (WUX-021/022/023) are governed by DEC-0022; styling/stack by DEC-0011.
- scope: MVP webapp, landing page, registration/login, onboarding wizard, Telegram pairing, Google
  Connection, Agent Settings, Trusted Contact recovery, Assisted Password Reset, plan view + Stripe
  upgrade, accessibility, privacy-preserving UI, i18n (en/de), AEO landing content
- cross_refs: docs/styleguide.md; ../adr/0022 (DEC-0022); DESIGN.md (external)

## REQ-agent-behavior
- source: docs/requirements/agent-behavior-requirements.md
- description: Required Anchor Agent behavior (ABR-*) across Good Friend Voice, conversation modes,
  check-ins, calendar additions, memory recall/correction/deletion, message+minute limits, and the
  emergency boundary.
- acceptance (summary): Behavior is specified per area; over-limit behavior (ABR-051) reconciled by
  DEC-0009; calendar-add behavior by DEC-0001.
- scope: Anchor Agent, Good Friend Voice, conversation modes, morning calendar check-in, daily
  check-in, calendar additions, memory recall/correction/deletion, message+minute limits, emergency boundary
- cross_refs: ../adr/0007 (DEC-0007); SOUL.md (external); inline BPR/WUX/CAL/TODO IDs

## REQ-calendar
- source: docs/requirements/calendar-requirements.md
- description: Calendar product requirements CAL-001..CAL-010: Google connection, OAuth lifecycle,
  event retrieval, morning check-in, calendar additions + write acknowledgement, reminder pattern,
  calendar-as-memory-source, timezone handling, disconnect.
- acceptance (summary): Each CAL requirement has acceptance criteria in user/product language;
  add-without-confirmation governed by DEC-0001, OAuth lifecycle by DEC-0008.
- scope: Google Calendar connection, OAuth token lifecycle, event retrieval, Morning Calendar
  Check-in, Calendar Additions, Calendar Write Acknowledgement, Reminder Pattern, calendar-as-memory,
  timezone handling, disconnect, Telegram, Good Friend Voice
- cross_refs: docs/adr/0001 (DEC-0001)

## REQ-diary
- source: docs/requirements/diary-requirements.md
- description: Diary as a first-class object (DR-001..DR-008): conversational capture, canonical
  relational storage, source evidence, dated timeline recall, correction, deletion + recall exclusion,
  privacy-preserving surfacing, grounded Telegram recall, export.
- acceptance (summary): Each DR has acceptance criteria; storage/integrity governed by DEC-0004 and
  DEC-0013.
- scope: Diary Entry, conversational capture, canonical relational storage, Source Evidence, dated
  recall, correction-via-conversation, deletion+recall exclusion, privacy surfacing, Telegram recall, export
- cross_refs: ../adr/0013 (DEC-0013); ../adr/0004 (DEC-0004); ./memory-requirements.md; ./agent-behavior-requirements.md

## REQ-memory
- source: docs/requirements/memory-requirements.md
- description: Memory system requirements (MR-001..MR-015): conversations as evidence, fact
  extraction + recall (date-based and context/topic), correction, update, deletion.
- acceptance (summary): Each MR has acceptance criteria in user-facing language; storage model
  governed by DEC-0004.
- scope: Conversation Transcript, Source Evidence, Diary Entry, Memory Fact, Context Map, Recall
  Exclusion, date-based recall, context/topic recall, correction, update, deletion
- cross_refs: (none — but aligns with DEC-0004 memory index)

## REQ-billing-and-plans
- source: docs/requirements/billing-and-plans-requirements.md
- description: Free vs Pro plans (BPR-001..BPR-011), Daily Conversation Minute billing unit, Stripe
  subscription lifecycle (Checkout/Portal), plan-state mirror, pricing display, payment-failure grace,
  cancellation, refunds, tax/receipts/PCI, gentle exhaustion/upgrade handling.
- acceptance (summary): Each BPR has acceptance criteria; bound by DEC-0005 (plan/Stripe), DEC-0009
  (minute accounting), DEC-0016 (Stripe ops, incl. BPR-005 VAT wording update and BPR-007 grace, BPR-009
  no-surprises, BPR-010 operator refunds).
- scope: billing, Free/Pro plans, Daily Conversation Minutes, Stripe Checkout + Customer Portal,
  plan-state mirror, pricing display, payment-failure grace + cancellation, refunds, tax/receipts/PCI
- cross_refs: ../adr/0005 (DEC-0005); ../adr/0002 (DEC-0002); ../contexts/usage-limits/CONTEXT.md;
  ./agent-behavior-requirements.md; ./webapp-ui-ux-requirements.md; ./functional-requirements.md

## REQ-privacy-safety
- source: docs/requirements/privacy-safety-requirements.md
- description: Privacy + safety requirements PSR-001..PSR-012: non-clinical framing, emergency
  boundary, Trusted Contacts consent/least privilege, recovery + assisted reset, sensitive recovery
  data (birthdate/zipcode), memory deletion + recall exclusion, Source Evidence privacy, Google OAuth
  token security, Telegram data handling, limit notices, auditability/logging.
- acceptance (summary): Each PSR has acceptance criteria; OAuth-token security aligns with DEC-0008,
  recovery with DEC-0006, audit/retention with DEC-0013/0018.
- scope: non-clinical framing, emergency boundary, Trusted Contacts consent/least privilege, recovery
  + assisted reset, sensitive recovery data, memory deletion/recall exclusion, Source Evidence privacy,
  Google OAuth token security, Telegram data handling, limit notices, auditability/logging
- cross_refs: (none — but aligns with safety bounded context)

## REQ-compliance
- source: docs/requirements/compliance-requirements.md
- description: Compliance requirements CR-001..CR-011 (the requirement-level expression of DEC-0021):
  legal documents, Widerruf consent at Checkout, cookie-consent-free posture, sub-processor register/AVV,
  GDPR Art.17 erasure, GDPR Art.20 export, Stripe subscription/refund lifecycle, magic-link session cookie.
- acceptance (summary): Each CR states what the product must ship; mechanics bound by DEC-0021 (and
  DEC-0006, DEC-0016). Aligned, not contradictory.
- scope: legal documents (Impressum/Datenschutz/AGB/Widerruf), Widerruf consent at Checkout,
  cookie-consent-free posture, sub-processor register/AVV, right to erasure (Art.17), right to export
  (Art.20), Stripe subscription/refund lifecycle, magic-link session cookie
- cross_refs: ../adr/0021 (DEC-0021); ../adr/0006 (DEC-0006); ../adr/0016 (DEC-0016);
  ../compliance/subprocessors.md; ./non-functional-requirements.md; ./billing-and-plans-requirements.md; ./webapp-ui-ux-requirements.md

---

## Competing acceptance variants

None. No two PRDs define a requirement on the same scope with non-identical acceptance criteria.
Overlapping concerns are complementary, not contradictory, and each is governed by the same
locked ADR(s):
- Billing appears in billing-and-plans (BPR-*) and functional (FR-070/071); the BPR doc is the detailed
  product spec, the FRs enumerate the same behavior — both bound by DEC-0005/0009/0016.
- Memory appears in memory (MR-*) and diary (DR-*); diary is a specialization of the memory model,
  both bound by DEC-0004.
- Compliance appears in compliance (CR-*) and is the requirement-level expression of DEC-0021; no divergence.
