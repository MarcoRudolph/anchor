---
description: "Synthesized supporting context (DOC-type sources) for Anchor from /gsd-ingest-docs"
paths:
  - "../INGEST-CONFLICTS.md"
  - "./SYNTHESIS.md"
---

# Context Intel

Running notes from 13 DOC-classified sources, keyed by topic with source attribution.
DOC is the lowest-precedence tier; nothing here overrides an ADR, SPEC, or PRD.

---

## Topic: Agent interaction (bounded context)
- source: docs/contexts/agent-interaction/CONTEXT.md
- notes: How users interact with the Anchor agent across Telegram and voice — interaction patterns and domain language for the agent-interaction bounded context.

## Topic: Calendar (bounded context)
- source: docs/contexts/calendar/CONTEXT.md
- notes: Entities, domain language, and integration boundaries for the calendar domain (Google Calendar boundary). Supports REQ-calendar, DEC-0001, DEC-0008.

## Topic: Usage limits (bounded context)
- source: docs/contexts/usage-limits/CONTEXT.md
- notes: Conversation-minutes, plan limits, and accounting language for the usage-limits bounded context. Supports DEC-0005, DEC-0009, REQ-billing-and-plans.

## Topic: Memory (bounded context)
- source: docs/contexts/memory/CONTEXT.md
- notes: Memory entities, recall rules, and retention language for the memory bounded context. Supports DEC-0004, REQ-memory, REQ-diary.

## Topic: Safety (bounded context)
- source: docs/contexts/safety/CONTEXT.md
- notes: Crisis handling, escalation language, and safety boundaries for the safety bounded context. Supports REQ-privacy-safety, REQ-agent-behavior.

## Topic: Patient identity (bounded context)
- source: docs/contexts/patient-identity/CONTEXT.md
- notes: Identity entities, pairing, and account-linkage language for the patient/user-identity domain. Naming overlaps the user-identity context below — both describe identity; not contradictory.

## Topic: User identity (bounded context)
- source: docs/contexts/user-identity/CONTEXT.md
- notes: Identity entities, authentication, pairing, and account linkage. Supports DEC-0006 (auth), DEC-0007 (pairing).

## Topic: Privacy policy (legal)
- source: docs/compliance/datenschutz.md
- notes: German-language privacy policy — data processing, legal bases, sub-processors, data-subject rights. Authoritative legal text governed by DEC-0021.

## Topic: Legal notice / Impressum (legal)
- source: docs/compliance/impressum.md
- notes: German-language Impressum — operator identity and contact information. Governed by DEC-0021.

## Topic: Sub-processors register (legal)
- source: docs/compliance/subprocessors.md
- notes: Versioned register of third-party sub-processors (purpose, data categories, AVV/DPA). Governed by DEC-0021.

## Topic: Requirements index
- source: docs/requirements/README.md
- notes: Index/overview of the requirements documents and how they fit together. Navigational.

## Topic: Style guide
- source: docs/styleguide.md
- notes: Content and UI style guide — tone, terminology, visual conventions. Informs REQ-webapp-ui-ux and REQ-agent-behavior tone.

## Topic: Open questions (unresolved decisions)
- source: docs/requirements/open-questions.md
- notes: Tracks unresolved product/technical questions needing decisions before/during implementation. Informational tracker — downstream roadmapper should treat these as risks/follow-ups, not as decisions. Referenced by DEC-0005 and DEC-0021.
