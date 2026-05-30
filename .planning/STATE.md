# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-30)

**Core value:** A User with memory difficulties can converse naturally with their Anchor Agent (text or voice) and reliably recall what was said, what happened, and what is coming up — grounded in real source evidence, never fabricated.
**Current focus:** Phase 0 — Spine & Interface Freeze

## Current Position

Phase: 0 of 4 (Spine & Interface Freeze)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-30 — Roadmap bootstrapped from /gsd-ingest-docs (49 docs, 22 ADRs); PROJECT/REQUIREMENTS/ROADMAP/STATE written

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: — min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table (22 ADRs: DEC-0005..0022 LOCKED, DEC-0001..0004 proposed).
Recent decisions affecting current work (Phase 0 spine):

- [Phase 0]: DB foundation = plain SQL migrations + Drizzle query-only + UUIDv7; `anchor_user.id = auth.users.id`; RLS (DEC-0013)
- [Phase 0]: Anchor↔Hermes seam = single 13-endpoint Supabase Edge Functions API; service-role JWT + `x-hermes-secret` (DEC-0010)
- [Phase 0]: Passwordless magic-link auth, no password fallback (DEC-0006)
- [Build shape]: SPINE-THEN-RIBS — freeze shared interfaces in Phase 0, then dependency-ordered parallel waves

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Ship-blockers and open questions carried from ingest. Detail in PROJECT.md Risks & Ship-Blockers.]

- **BLK-01 (ship-blocker):** AGB + Widerrufsbelehrung unwritten; qualified legal review pending (CR-011). German paid product cannot launch without them. Surfaces in Phase 4.
- **BLK-02 (ship-blocker):** USt-IdNr **DE455180377** must be added to Impressum + Datenschutz (CR-003). Build should fail on unset Impressum slots.
- **BLK-03 (ship-blocker):** Free/Pro daily minute caps undecided (OQ-040). Placeholder Free 15 / Pro 120 min/day; must be frozen in `app_config` before minute-enforcement code ships (Phase 2).
- **BLK-04 (ship-blocker):** Recall-quality threshold + eval scenario set undefined (OQ-022). Gates launch; product core. Define in Phase 4 agent eval harness.
- **BLK-05 (ship-blocker):** First scale target not frozen (OQ-011). Assumed ~10-User pilot (NFR-009, DEC-0003); confirm and record.
- **OQ-06 (open question, not blocking):** ADR-0006 cross-references a non-existent `0005-local-first-data-with-end-to-end-encrypted-sync.md` and protects an "E2E master key" no present ADR defines. Architecture is server-side Supabase (DEC-0003/0013), so this is likely a stale cross-ref from an abandoned local-first/E2E approach — confirm before relying on DEC-0006 recovery semantics.
- **RISK-07:** DEC-0001..0004 are proposed (no `Status: Accepted`) yet the locked layer depends on them. Recommend locking ADRs 0001–0004.

## Deferred Items

Items acknowledged and carried forward (v2 / later):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Safety | Non-response Escalation (FR-052) | Deferred to v2 | Ingest bootstrap |
| Caregiver/Family | Caregiver dashboard, shared family account, payer-on-behalf billing | Deferred to v2 | Ingest bootstrap |
| Memory UI | Rich diary/memory browsing+editing, Context Map explorer | Deferred to v2 | Ingest bootstrap |
| Channels/Plans | Channels beyond Telegram, multiple calendars, annual/coupon plans, voice output (TTS) | Deferred to v2 | Ingest bootstrap |

## Session Continuity

Last session: 2026-05-30 11:35
Stopped at: Wrote PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md from /gsd-ingest-docs intel
Resume file: None
