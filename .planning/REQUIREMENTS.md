# Requirements: Anchor

**Defined:** 2026-05-30
**Core Value:** A User with memory difficulties can converse naturally with their Anchor Agent (text or voice) and reliably recall what was said, what happened, and what is coming up — grounded in real source evidence, never fabricated.

> Requirements are the 12 PRD-level requirements synthesized from `docs/requirements/` during `/gsd-ingest-docs`.
> Each top-level `REQ-*` maps to exactly one roadmap phase. Internal numbered IDs (FR-*, BPR-*, CAL-*, MR-*, DR-*, PSR-*, ABR-*, WUX-*, UJ-*, CR-*) are preserved from the source docs for traceability and are split across phases per the Spine-then-Ribs build shape.
> Each line carries an **[A]** (Anchor repo) or **[H]** (Hermes) tag, or **[A+H]** when both repos participate behind the frozen seam.

## v1 Requirements

### Identity & Setup

- [ ] **REQ-product-vision** [A]: Anchor is a low-friction conversational memory aid via Telegram with a companion webapp for older adults with memory difficulties; target user, value, and core pillars are defined and used as the framing for all surfaces. (source: product-requirements.md)
- [ ] **REQ-mvp-scope** [A+H]: The MVP delivers the full in-scope feature set (identity, Telegram agent, check-ins, calendar, memory/diary, recovery-only safety) and ships nothing in the explicit out-of-scope / "later" lists. (source: mvp-scope.md)
- [ ] **REQ-user-journeys** [A+H]: All thirteen end-to-end journeys UJ-001..UJ-013 complete with their acceptance criteria (onboarding, Telegram/Google pairing, morning/evening check-ins, recall/correction/deletion, Pro lifecycle, trusted-contact recovery). (source: user-journeys.md)

### Functional Backbone

- [ ] **REQ-functional** [A+H]: Numbered functional requirements FR-001..FR-081 (account/identity, Telegram text+voice, Google Calendar, check-ins, memory/diary, trusted contacts, usage limits, billing, i18n) each meet their acceptance criteria; FR-070/FR-071 contract detail is bound by DEC-0005/0016. (source: functional-requirements.md)

### Webapp UI/UX

- [ ] **REQ-webapp-ui-ux** [A]: Numbered UI/UX requirements WUX-001..WUX-024 (setup-first IA, accessible low-load forms for older adults, connection status, agent settings, recovery safety, privacy-preserving UI, plan view/upgrade, landing hero/pricing/trust/AEO, i18n, empty/edge states) meet their acceptance criteria. (source: webapp-ui-ux-requirements.md)

### Agent Behavior

- [ ] **REQ-agent-behavior** [H]: Required Anchor Agent behavior ABR-* (Good Friend Voice, small-talk mode, morning calendar + evening daily check-ins, calendar additions, memory recall/correction/deletion, message+minute limit notices, emergency boundary) is implemented; over-limit UX per DEC-0009, calendar-add per DEC-0001. (source: agent-behavior-requirements.md)

### Calendar

- [ ] **REQ-calendar** [A+H]: Calendar requirements CAL-001..CAL-010 (Google connection, OAuth lifecycle, event retrieval, morning check-in, calendar additions + write acknowledgement, reminder pattern, calendar-as-memory-source, timezone handling, disconnect) meet their acceptance criteria. (source: calendar-requirements.md)

### Memory & Diary

- [ ] **REQ-memory** [A+H]: Memory requirements MR-001..MR-015 (conversations as evidence, fact extraction, date-based recall, context/topic recall, correction, update, deletion with recall exclusion) meet their acceptance criteria; storage per DEC-0004. (source: memory-requirements.md)
- [ ] **REQ-diary** [A+H]: Diary requirements DR-001..DR-008 (conversational capture, canonical relational storage, source evidence, dated recall, correction, deletion+recall exclusion, privacy-preserving surfacing, grounded Telegram recall, export) meet their acceptance criteria. (source: diary-requirements.md)

### Billing & Usage Limits

- [ ] **REQ-billing-and-plans** [A+H]: Billing requirements BPR-001..BPR-011 (Free/Pro plans, Daily Conversation Minute billing unit, Stripe Checkout/Portal lifecycle, plan-state mirror, pricing display, payment-failure grace, cancellation, refunds, tax/receipts/PCI, gentle exhaustion/upgrade) meet their acceptance criteria; bound by DEC-0005/0009/0016. (source: billing-and-plans-requirements.md)

### Privacy & Safety

- [ ] **REQ-privacy-safety** [A+H]: Privacy + safety requirements PSR-001..PSR-012 (non-clinical framing, emergency boundary, trusted-contact consent/least-privilege, recovery + assisted reset, sensitive recovery data, memory deletion/recall exclusion, source-evidence privacy, Google token security, Telegram data handling, limit notices, auditability/logging) meet their acceptance criteria. (source: privacy-safety-requirements.md)

### Compliance & Launch

- [ ] **REQ-compliance** [A]: Compliance requirements CR-001..CR-011 (four legal documents, Widerruf consent at Checkout, cookie-consent-free posture, sub-processor register/AVV, GDPR Art.17 erasure, Art.20 export, Stripe subscription/refund lifecycle, magic-link session cookie) meet their acceptance criteria; bound by DEC-0021. (source: compliance-requirements.md)

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### Caregiver & Family

- **CARE-01**: Caregiver role / caregiver dashboard
- **CARE-02**: Shared family account / multi-user household
- **CARE-03**: Family or trusted-contact billing (payer-on-behalf)

### Safety

- **SAFE-01**: Non-response Escalation (notify trusted contact after sustained non-response, consent-gated) — FR-052 deferred

### Memory & Diary UI

- **MEMUI-01**: Diary/memory browsing + editing in a rich web UI
- **MEMUI-02**: User-visible Context Map / graph explorer

### Channels & Plans

- **CHAN-01**: Messaging channels beyond Telegram
- **CHAN-02**: Multiple external calendars
- **PLAN-01**: Annual plan, discounts, or coupon support
- **VOICE-01**: Voice output (TTS) replies

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Medical advice, diagnosis, treatment, clinical assessment | Anchor is non-clinical and not a medical device |
| Emergency dispatch / emergency monitoring guarantee | Anchor is not an emergency response service |
| Always-on passive listening | Privacy + scope; agent acts only on sent messages |
| Public social features | Not core to the second-brain value |
| Multiple Anchor Agents per User | One agent ↔ one User is a core identity invariant |
| Arbitrary advanced reminder rules | Reminder Pattern is a small fixed list, not cron-style scheduling |
| Per-user Docker containers | Operational burden before product-market fit; single VPS for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-mvp-scope | Phase 0 | Pending |
| REQ-user-journeys | Phase 0 | Pending |
| REQ-functional | Phase 0 | Pending |
| REQ-product-vision | Phase 1 | Pending |
| REQ-privacy-safety | Phase 1 | Pending |
| REQ-diary | Phase 1 | Pending |
| REQ-memory | Phase 2 | Pending |
| REQ-calendar | Phase 2 | Pending |
| REQ-billing-and-plans | Phase 2 | Pending |
| REQ-webapp-ui-ux | Phase 2 | Pending |
| REQ-agent-behavior | Phase 3 | Pending |
| REQ-compliance | Phase 4 | Pending |

> Note on multi-phase requirements: `REQ-functional` is anchored to Phase 0 (its account/identity/edge-fn/i18n backbone FRs are frozen in the spine) but its feature-specific FRs are delivered across Phases 1-4 alongside the bounded-context requirement they belong to (e.g. FR-022 calendar in Phase 2, FR-072/073 minutes in Phase 2, FR-031/032 check-ins in Phase 3). The anchor phase is where the requirement's foundation is verified; later phases satisfy its remaining acceptance criteria.

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after /gsd-ingest-docs bootstrap*
