# Anchor Open Questions

This file tracks decisions that should be resolved before implementation or before architecture is frozen.

## Product scope

### OQ-001 Is the webapp only setup/settings in MVP?

Recommendation: MVP webapp should be setup/settings first: registration, Telegram pairing, Google Connection, Agent Settings, Trusted Contacts. Defer full diary/memory browsing unless it is needed for trust or demos.

Why it matters: diary browsing adds UI, permissions, deletion/editing, and privacy complexity.

### OQ-002 Is voice output required for MVP?

Recommendation: Support voice input in MVP; defer voice output unless Telegram text replies are not sufficient for the target Users.

Why it matters: voice output adds TTS cost, voice design, delivery behavior, and accessibility testing.

### OQ-003 Is Trusted Contact escalation in MVP?

Recommendation: Include Trusted Contacts for recovery first. Add Non-response Escalation only if it is central to the first pilot.

Why it matters: escalation creates consent, safety, and expectation-management complexity.

## Infrastructure

### OQ-010 Is per-user Docker isolation a hard requirement?

Recommendation: No. Treat it as a hypothesis. Start with shared webapp, shared DB, worker queue, and per-user config/state unless hard isolation is required.

Why it matters: per-user containers increase operational burden before product-market fit.

### OQ-011 What is the first scale target?

Recommendation: Pick an explicit first target: 10 pilot Users, 100 beta Users, or 1,000 early Users.

Why it matters: runtime isolation, storage, observability, and cost controls differ dramatically.

### OQ-012 What retrieval stack should Anchor use?

Recommendation: Start with relational storage plus full-text search and vector search. Add graph database only if Context Map traversal cannot be handled simply.

Why it matters: graph databases add complexity; the product needs recall quality more than visible graph purity.

### OQ-013 Should requirements be stack-neutral or stack-specific?

Recommendation: Keep requirements stack-neutral for now. Write implementation plans later for the chosen stack.

Why it matters: requirements should survive framework changes.

## Memory and diary

### OQ-020 Are Diary Entries user-editable in MVP?

Recommendation: Defer rich editing. Support deletion/correction via conversation first.

Why it matters: editing creates source evidence/versioning complexity.

### OQ-021 Should the User see the Context Map?

Recommendation: No for MVP. Keep Context Map internal for retrieval; show plain recall answers and source references.

Why it matters: graph UI is complex and may confuse the core User.

### OQ-022 What is the minimum acceptable recall quality?

Recommendation: Define evaluation scenarios before implementation: date recall, topic recall, correction, deletion exclusion, and fuzzy uncertainty.

Why it matters: memory quality is the product core and cannot be validated only by unit tests.

## Legal and compliance

### OQ-030 What country/legal regime is the MVP targeting first?

Recommendation: Decide before launch. Germany/EU implies GDPR-first design and stricter data handling expectations.

Why it matters: consent, deletion, export, retention, and processor agreements depend on jurisdiction.

### OQ-031 What is the retention policy?

Recommendation: Define default retention before production. In beta, be explicit that memory is stored until the User deletes it or account deletion occurs.

Why it matters: memory products need trust and deletion clarity.
