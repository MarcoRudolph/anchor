---
description: "Anchor Diary Entry requirements — capture, storage, correction, deletion, and recall of diary information. Mirrors calendar/memory parity (MR-002, FR-041)."
paths:
  - "./README.md"
  - "./agent-behavior-requirements.md"
  - "./memory-requirements.md"
  - "./functional-requirements.md"
  - "../adr/0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md"
  - "../adr/0004-anchor-specific-memory-index-instead-of-ob1-thoughts.md"
---

# Anchor Diary Requirements

## Purpose

The Diary is a first-class object (MR-002, FR-041): a timeline of what the User did, felt, and wants remembered, captured conversationally rather than typed. This leaf mirrors the calendar and memory requirement leaves so Diary Entries have explicit capture, storage, correction, deletion, and recall rules instead of living only inside agent-behavior prose.

## Scope

In scope (MVP): conversational diary capture, canonical storage with Source Evidence, correction and deletion via conversation, and timeline-aware recall. Out of scope (MVP): rich webapp diary browsing/editing (OQ-001, OQ-020), versioned source history, mood analytics.

**Source:** OQ-020, OQ-023; agent behavior ABR-010/011/021.

## DR-001 Conversational capture
Diary Entries are extracted from conversation (Small Talk Mode, User-Initiated Conversation, and the evening Daily Check-in), not entered through a webapp form in MVP. Anchor does not become a proactive daytime diary interviewer (ABR-012).

## DR-002 Canonical relational storage
Each Diary Entry is a canonical relational record in Supabase/Postgres (ADR-0013) with `anchor_user_id`, an `occurred_at` / entry date, the content, and a link to its Source Evidence. Vector embeddings index these records for recall but are never the source of truth (OQ-023).

## DR-003 Source Evidence
Every Diary Entry references the Conversation Transcript (or other source) it was derived from, so recall can cite where a fact came from (parity with the memory index, ADR-0004).

## DR-004 Dated timeline
Diary Entries carry a date so recall can answer "what happened on / around <date>" and order entries chronologically. When the date is fuzzy, the entry stores the best-known approximation and recall expresses appropriate uncertainty (ABR-040).

## DR-005 Correction via conversation
A User can correct a Diary Entry in conversation; Anchor applies the correction per ABR-042 without a separate workflow. Rich versioned source history is deferred (OQ-020).

## DR-006 Deletion and Recall Exclusion
A User can delete or exclude a Diary Entry from recall via conversation, with Deletion Citation and Deletion Confirmation per ABR-043. Excluded entries are marked `recall_excluded_at` and are not surfaced in recall, consistent with the memory index. Account-wide deletion is covered by CR-009.

## DR-007 Privacy-preserving surfacing
Diary content is not shown in the MVP webapp (WUX-009/WUX-012); it is surfaced only through the Telegram agent's grounded recall answers (ABR-040).

## DR-008 Export
Diary Entries are included in the user data export (CR-010, Art. 20) in machine-readable form.
