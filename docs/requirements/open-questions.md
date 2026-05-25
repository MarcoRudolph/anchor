# Anchor Open Questions

This file tracks decisions that should be resolved before implementation or before architecture is frozen.

Items are tagged **Decision** (resolved) or **Recommendation** (open). Open items that still **block ship** are marked **⛔ BLOCKS SHIP**; open items that are merely calibration are **🟡 tunable**.

## Authentication

### OQ-005 What authentication and recovery mechanism?

Decision: Passwordless email magic-link; account recovery via a Trusted Person flow gated by birthdate (+ zipcode tiebreak). No passwords, no password reset, no PIN. 2FA deferred. See ADR-0006. This closes the largest cluster of TODO blockers (#1) and the previously-missing Auth section.

## Product scope

### OQ-001 Is the webapp only setup/settings in MVP?

Decision: Yes. MVP webapp is limited to setup, settings, and recovery: registration, login, Telegram pairing, Google Connection, Agent Settings, Trusted Contact setup, and Assisted Password Reset.

Diary/memory browsing and editing are deferred. The Telegram Anchor Agent remains the primary day-to-day interaction channel.

### OQ-002 Is voice output required for MVP?

Recommendation: Support voice input in MVP; defer voice output unless Telegram text replies are not sufficient for the target Users.

Why it matters: voice output adds TTS cost, voice design, delivery behavior, and accessibility testing.

### OQ-003 Is Trusted Contact escalation in MVP?

Decision: No. Include Trusted Contacts for recovery first. Defer Non-response Escalation.

Why it matters: escalation creates consent, safety, and expectation-management complexity.

## Infrastructure

### OQ-010 Is per-user Docker isolation a hard requirement?

Decision: No for MVP. Hermes runs in a Docker container on the Hostinger VPS, and Supabase runs in a separate container. Anchor does not provision one Hermes container per User in the MVP.

Why it matters: per-user containers increase operational burden before product-market fit.

### OQ-011 What is the first scale target? ⛔ BLOCKS SHIP

Recommendation: Pick an explicit first target: 10 pilot Users, 100 beta Users, or 1,000 early Users. (NFR-009 + ADR-0003 assume a ~10-User pilot; confirm and freeze this number, since isolation, observability, and cost controls depend on it.)

Why it matters: runtime isolation, storage, observability, and cost controls differ dramatically.

### OQ-012 What retrieval stack should Anchor use?

Decision: Use Supabase/Postgres as the source of truth and retrieval store. Store canonical Diary Entries, Conversation Transcripts, Memory Facts, Recall Exclusion, and audit state in relational tables; add full-text and vector search over that canonical data for recall.

Why it matters: vector search is a retrieval index, not enough by itself for deletion, auditability, permissions, or timeline-aware recall. Graph databases add complexity; the product needs recall quality more than visible graph purity.

### OQ-013 Should requirements be stack-neutral or stack-specific?

Recommendation: Keep requirements stack-neutral for now. Write implementation plans later for the chosen stack.

Why it matters: requirements should survive framework changes.

### OQ-014 Does Hermes orchestrate Telegram agent communication?

Decision: Yes. Hermes owns Telegram conversation flow, Good Friend Voice, Small Talk Mode, calendar/diary/memory skills, and tool calls.

The webapp/backend provides stable APIs/tools and persistence, but must not duplicate agent conversation logic. Zapier may be used only as an integration adapter, not as the source of truth.

## Memory and diary

### OQ-020 Are Diary Entries user-editable in MVP?

Recommendation: Defer rich editing. Support deletion/correction via conversation first.

Why it matters: editing creates source evidence/versioning complexity.

### OQ-021 Should the User see the Context Map?

Recommendation: No for MVP. Keep Context Map internal for retrieval; show plain recall answers and source references.

Why it matters: graph UI is complex and may confuse the core User.

### OQ-022 What is the minimum acceptable recall quality? ⛔ BLOCKS SHIP

Recommendation: Define evaluation scenarios before implementation: date recall, topic recall, correction, deletion exclusion, and fuzzy uncertainty. (Eval harness is framed by ADR-0020; the concrete scenario set and pass threshold are still open and gate launch, since recall quality is the product core.)

Why it matters: memory quality is the product core and cannot be validated only by unit tests.

### OQ-023 Should Diary be stored as vectors only?

Decision: No. Store Diary Entries and Conversation Transcripts as canonical relational records in Supabase/Postgres, then store embeddings/vector indexes for retrieval against those records.

Why it matters: Diary Entries need dates, Source Evidence, Recall Exclusion, deletion confirmation, correction/update state, auditability, and per-user authorization. Vector-only storage is poor at those responsibilities.

### OQ-024 Should Anchor use OB1 `thoughts` directly as the product memory index?

Decision: No. OB1's `thoughts` table is a useful template, but Anchor uses its own memory index table.

The Anchor memory index must include `anchor_user_id`, `source_kind`, `occurred_at`, `recall_excluded_at`, and domain metadata. This avoids generic OB1 terminology leaking into Anchor and keeps User isolation, Source Evidence, Recall Exclusion, and timeline-aware recall explicit.

### OQ-025 How should Memory Index Items link to canonical source records?

Decision: Use separate nullable foreign keys plus `source_kind`, not free-form `source_table`/`source_id` strings.

Each Memory Index Item links to exactly one canonical source record through fields such as `conversation_transcript_id`, `diary_entry_id`, `memory_fact_id`, or `calendar_event_id`. `source_kind` identifies which foreign key is active. This gives real referential integrity, predictable cascades, and better indexes.

### OQ-026 Should the database enforce exactly one Memory Index Item source?

Decision: Yes. The memory index schema must use a CHECK constraint so each Memory Index Item has exactly one canonical source foreign key and `source_kind` matches the populated foreign key.

Why it matters: grounded recall depends on every retrieved index item resolving to one clear Source Evidence record.

## Legal and compliance

### OQ-030 What country/legal regime is the MVP targeting first?

Decision: Germany/EU. GDPR-first design; German is the authoritative legal language. Legal surfaces, consent posture, sub-processor register, and data-subject rights are fixed in ADR-0021 and `compliance-requirements.md`.

### OQ-031 What is the retention policy?

Decision: Memory, diary, and transcripts are stored until the User deletes them (DR-006, ABR-043) or until account deletion (CR-009, Art. 17 — 7-day grace then irreversible purge). This default is stated plainly to the User in the Datenschutzerklärung. Per-category shorter retention MAY be added later but is not required for MVP.

## Monetization

### OQ-040 What are the exact daily minute caps for Free and Pro? ⛔ BLOCKS SHIP

Recommendation: Start with Free = 15 minutes/day, Pro = 120 minutes/day as a placeholder; calibrate against the first 10 pilot Users' actual conversation length distribution before opening signups beyond pilot. (A concrete number must be set before any minute enforcement code ships.)

Why it matters: caps that are too tight punish target Users for memory difficulty (slow, repetitive speech burns minutes); caps that are too loose erase the Pro upgrade incentive.

### OQ-041 Should Pro include a one-time generosity buffer on first exhaustion?

Recommendation: Consider a single "+30 Min. Schenkung" the first time a Free User hits the daily limit, as a softer way to introduce the Pro option without nagging.

Why it matters: matches Anchor's calm, non-punitive tone (BPR-009) and may convert better than an empty wall.

### OQ-042 Family or Trusted-Contact billing for v2?

Decision: No for MVP. Defer to a later milestone.

Why it matters: the target User may not handle cards, but introducing payer-on-behalf in MVP doubles the consent and account-ownership surface area.

### OQ-043 Annual plan, discount, or coupon support?

Decision: No for MVP. Single monthly price only.

Why it matters: any second SKU multiplies pricing-display copy, refund logic, and Customer Portal configuration.
