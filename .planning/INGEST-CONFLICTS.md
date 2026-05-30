---
description: "Conflict-detection report for the Anchor /gsd-ingest-docs run (49 docs synthesized)"
paths:
  - "./intel/SYNTHESIS.md"
  - "./intel/decisions.md"
---

## Conflict Detection Report

Mode: new (net-new bootstrap, no existing .planning/ files to check against).
Precedence: ADR > SPEC > PRD > DOC.
Inputs: 49 canonical classification records (22 ADR, 12 PRD, 2 SPEC, 13 DOC).
Cycle detection: the cross-ref graph was built from every record's `cross_refs` and traversed with
DFS three-color marking. Max depth observed is far below the 50 cap. No cycles found — ADRs reference
only lower-numbered ADRs plus requirement/context docs; PRDs and SPECs reference ADRs; DOCs reference
ADRs/requirements. No back-edge closes a loop. The graph is a DAG, so full synthesis proceeded on all
49 docs.

### BLOCKERS (0)

None.

- LOCKED-vs-LOCKED: 18 locked ADRs (0005–0022) were checked pairwise for contradictory decision
  statements on overlapping scope. Each governs a distinct scope (auth, pairing, calendar OAuth,
  minute accounting, API surface, frontend, i18n, DB, voice, realtime, Stripe ops, email,
  observability, scheduling, testing, compliance, landing page). Adjacent ADRs reinforce rather than
  contradict (e.g. 0005↔0016 on Stripe, 0009↔0005 on minutes, 0010↔0013↔0019 on backend). No two
  locked decision statements conflict on the same scope.
- No `UNKNOWN`-with-`low`-confidence classifications exist. Lowest confidence in the set is the single
  `medium` on docs/requirements/open-questions.md (classified DOC); everything else is `high`.
- No cross-ref cycles.

### WARNINGS (0)

None.

- Competing acceptance variants: none. No two PRDs define a requirement on the same scope with
  non-identical acceptance criteria.
  Checked overlaps:
  - billing: docs/requirements/billing-and-plans-requirements.md (BPR-*) vs
    docs/requirements/functional-requirements.md (FR-070/FR-071) — complementary (detailed spec vs
    enumeration), both bound by the same locked ADRs (DEC-0005/0009/0016). No divergence.
  - memory: docs/requirements/memory-requirements.md (MR-*) vs docs/requirements/diary-requirements.md
    (DR-*) — diary specializes the memory model; both bound by DEC-0004. No divergence.
  - compliance: docs/requirements/compliance-requirements.md (CR-*) is the requirement-level
    expression of DEC-0021. No divergence.
  None required splitting into competing variants.

### INFO (7)

[INFO] ADRs 0001–0004 are not LOCKED but are uncontradicted
  Found: docs/adr/0001, 0002, 0003, 0004 carry locked:false — their bodies are single-paragraph
  decision stubs with no "Status: Accepted" line (unlike 0005–0022).
  Note: No higher- or equal-precedence source contradicts any of them, so no auto-resolution was
  needed. They are synthesized as proposed decisions (DEC-0001..DEC-0004) and are heavily depended on
  downstream (0005 cites 0002/0004; 0007 cites 0002; 0008 cites 0001; 0010 cites 0002/0003; 0011 cites
  0003; 0013 cites 0003; infrastructure SPEC defers to 0001–0004). Recommendation: add "Status:
  Accepted" to lock them, since the locked ADR layer already treats them as settled foundations.

[INFO] Two SPEC documents defer to ADRs by precedence (auto-resolved, no contradiction)
  Found: docs/requirements/infrastructure-requirements.md (SPEC) explicitly states it "does not commit
  to a final stack" and defers binding choices to ADRs; docs/requirements/non-functional-requirements.md
  (SPEC) states quality targets that docs/adr/0020 (LOCKED) and docs/adr/0018 (LOCKED) then bind with
  concrete budgets/tooling.
  Resolution: ADR > SPEC. The ADRs are authoritative on concrete bindings (deployment topology,
  performance budgets, observability vendors); the SPECs supply the broader requirement they satisfy.
  No factual contradiction. See intel/constraints.md (SPEC-001, SPEC-002, CON-performance-budgets,
  CON-observability-alerting).

[INFO] FR-level contract detail superseded by ADR bindings (auto-resolved)
  Found: docs/requirements/functional-requirements.md (PRD) embeds contract detail in FR-070
  (`anchor_user_plan` schema) and FR-071 (Stripe webhook events); docs/requirements/
  billing-and-plans-requirements.md BPR-005 states "VAT-inclusive" pricing.
  Resolution: ADR > PRD. DEC-0005 binds `anchor_user_plan`; DEC-0016 binds the webhook contract AND
  explicitly updates BPR-005 to "EUR 10 inclusive is the German baseline; other EU countries see
  country-specific Stripe Tax totals." The PRD wording is reconciled by the locked ADR; recorded for
  transparency, no blocker.

[INFO] Dangling cross-reference in ADR 0006
  Found: docs/adr/0006 references "./0005-local-first-data-with-end-to-end-encrypted-sync.md",
  "../requirements/REQUIREMENTS.md", and "ADR 0005" as the E2E-sync source — but the actual ADR 0005
  in this set is the Stripe subscription ADR, and there is no REQUIREMENTS.md.
  Note: Treated as a stale link, not a content conflict. ADR 0006's body references "E2E master key"
  recovery, implying an intended local-first/E2E-encryption ADR that is missing from docs/adr/.
  Roadmapper should confirm whether that ADR is expected (the trusted-person recovery in 0006 protects
  an E2E master key that no present ADR defines).

[INFO] Dangling cross-reference in ADR 0013
  Found: docs/adr/0013 references "docs/handoff.md", which is not present in the set (0013 itself states
  the handoff doc "will accompany the first complete schema cut").
  Note: Forward-reference to a not-yet-written operator playbook. Non-blocking.

[INFO] Dangling/template cross-references in ADR 0020
  Found: docs/adr/0020 references "docs/uat/<feature>.md" (a path template, not a file) and "DESIGN.md"
  (a global rules file outside the repo doc tree).
  Note: Placeholder + external references, not real docs in the ingest set. Non-blocking.

[INFO] Bounded-context naming: patient-identity deprecated in favor of user-identity
  Found: docs/contexts/patient-identity/CONTEXT.md is a deprecation stub redirecting to
  docs/contexts/user-identity/CONTEXT.md.
  Note: Not a conflict — the deprecated context explicitly yields to user-identity. Both captured in
  intel/context.md; downstream should treat user-identity as canonical.
