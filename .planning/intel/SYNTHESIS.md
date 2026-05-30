---
description: "Entry-point synthesis summary for the Anchor /gsd-ingest-docs run — read this first"
paths:
  - "../INGEST-CONFLICTS.md"
  - "./decisions.md"
  - "./requirements.md"
  - "./constraints.md"
  - "./context.md"
---

# Synthesis Summary

Single entry point for `gsd-roadmapper`. Mode: `new` (net-new bootstrap, no existing `.planning/` files).
Precedence applied: ADR > SPEC > PRD > DOC.

## Doc counts by type (49 canonical classification records)

- ADR: 22 (docs/adr/0001–0022)
- PRD: 12 (product-requirements, mvp-scope, functional, user-journeys, webapp-ui-ux, agent-behavior,
  calendar, diary, memory, billing-and-plans, privacy-safety, compliance)
- SPEC: 2 (infrastructure-requirements, non-functional-requirements)
- DOC: 13 (7 bounded-context CONTEXT.md, 3 compliance legal docs, requirements README, styleguide,
  open-questions)

Matches the ingest brief exactly. Note: the brief's pre-read remark "ADRs 0001–0004 have locked:false"
is confirmed by the source bodies (no "Status: Accepted"); ADRs 0005–0022 carry "Status: Accepted"
and locked:true.

## Decisions — intel/decisions.md

- Total extracted: 22 (DEC-0001 .. DEC-0022)
- Locked: 18 — DEC-0005..DEC-0022 (sources docs/adr/0005..0022)
- Not locked (proposed, uncontradicted foundations): 4 — DEC-0001..DEC-0004 (sources docs/adr/0001..0004)

## Requirements — intel/requirements.md

- Total extracted: 12
- IDs: REQ-product-vision, REQ-mvp-scope, REQ-functional, REQ-user-journeys, REQ-webapp-ui-ux,
  REQ-agent-behavior, REQ-calendar, REQ-diary, REQ-memory, REQ-billing-and-plans, REQ-privacy-safety,
  REQ-compliance
- Source-internal numbering preserved (FR-*, BPR-*, CAL-*, MR-*, DR-*, PSR-*, ABR-*, WUX-*, UJ-*).

## Constraints — intel/constraints.md

- Total: 18 (2 SPEC docs + 16 SPEC-like contracts lifted from ADRs)
- Type breakdown: api-contract 3, schema 6, protocol 6, nfr 5 (some entries multi-typed; SPEC-001 is
  schema/api-contract, SPEC-002 is nfr).
- SPEC docs: SPEC-001 (infrastructure layers, defers to ADRs), SPEC-002 (non-functional targets).

## Context topics — intel/context.md

- Total: 13
- 7 bounded contexts (agent-interaction, calendar, usage-limits, memory, safety, patient-identity
  [deprecated → user-identity], user-identity), 3 legal docs (datenschutz, impressum, subprocessors),
  requirements README, styleguide, open-questions tracker.

## Conflicts — ../INGEST-CONFLICTS.md

- BLOCKERS: 0
- WARNINGS (competing variants): 0
- INFO (auto-resolved + traceability): 7

## Status

READY — safe to route. No blockers, no competing variants.

Roadmapper follow-ups (all INFO, non-gating):
1. Lock ADRs 0001–0004 by adding "Status: Accepted" — they are foundations the locked layer depends on.
2. Confirm whether a missing local-first / E2E-encrypted-sync ADR is expected: ADR 0006 protects an
   "E2E master key" and cross-refs a non-existent 0005-local-first ADR and REQUIREMENTS.md.
3. SPEC docs (infrastructure, non-functional) correctly defer to ADRs by precedence — no action, noted.

## Intel files

- ../INGEST-CONFLICTS.md
- ./decisions.md
- ./requirements.md
- ./constraints.md
- ./context.md
