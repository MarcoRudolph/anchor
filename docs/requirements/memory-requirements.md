# Anchor Memory Requirements

## Purpose

Anchor memory lets the User recover forgotten information from conversations, diary entries, calendar context, and structured memory facts.

## Core concepts

- Conversation Transcript: saved record of User and Anchor Agent messages.
- Source Evidence: original message, diary entry, transcript, or Calendar Event supporting an answer.
- Diary Entry: dated record of something said, experienced, planned, or worth remembering.
- Memory Fact: concise claim extracted from Source Evidence.
- Context Map: graph-like structure connecting people, places, events, dates, topics, diary entries, and calendar events.
- Recall Exclusion: state preventing deleted/superseded content from normal recall.

## MR-001 Conversation transcripts are source evidence

Every User conversation with Anchor must be stored as Source Evidence, including small talk.

Acceptance criteria:
- User-initiated conversations are stored.
- Proactive check-in conversations are stored.
- Small talk is stored even if no Memory Fact is extracted.
- Source Evidence can be used later for Conversation Summary Recall.

## MR-002 Diary entries

Anchor must create dated Diary Entries from Daily Check-ins and relevant daytime conversations.

Acceptance criteria:
- Diary Entries include date/time context.
- Diary Entries link to Source Evidence.
- Diary Entries can support date-based and context-based recall.

## MR-003 Memory facts

Anchor must extract Memory Facts only when a concise claim is supported by Source Evidence.

Acceptance criteria:
- Every Memory Fact links to Source Evidence.
- Not every Conversation Transcript produces a Memory Fact.
- Memory Facts can be corrected, updated, superseded, or excluded from recall.

## MR-004 Context Map

Anchor must maintain a Context Map connecting User-specific concepts.

Acceptance criteria:
- Memory Entities may represent people, places, events, dates, topics, Diary Entries, or Calendar Events.
- Memory Relationships connect Memory Entities and source records.
- Context Map supports semantic/context recall.
- Context Map internals are not exposed to the User as technical graph metadata.

## MR-005 Date-based recall

The User must be able to ask questions about a date or period.

Acceptance criteria:
- Anchor retrieves relevant Conversation Transcripts, Diary Entries, Calendar Events, and Memory Facts for the requested period.
- Anchor summarizes rather than dumping raw transcripts.
- Anchor excludes deleted or recall-excluded content.

## MR-006 Context/topic recall

The User must be able to ask about people, places, topics, or events.

Acceptance criteria:
- Anchor retrieves relevant Source Evidence and Memory Facts.
- Anchor explains uncertainty when matches are fuzzy.
- Anchor gives a user-friendly source reference when helpful.

## MR-007 Conversation Summary Recall

A question like “What did we talk about yesterday?” must use Conversation Transcripts and Diary Entries for the requested period.

Acceptance criteria:
- The answer does not require explicit structured events.
- The answer is concise and friendly.
- The answer is grounded in available Source Evidence.

## MR-008 Memory uncertainty

Anchor must express uncertainty lightly when recall evidence is imperfect.

Acceptance criteria:
- Use conversational phrasing such as “I'm fairly sure...” or “I found one note that may be related...”
- Do not expose confidence scores, embedding similarity, vector search, or retrieval internals.
- Do not overstate certainty.

## MR-009 Memory source references

Anchor should mention the source when it helps the User trust or understand the answer.

Acceptance criteria:
- Allowed references include diary, conversation, or calendar event.
- References are human-readable.
- Raw database IDs, metadata, or hidden source identifiers are not exposed.

## MR-010 Memory correction

Anchor must support correcting inaccurate Memory Facts through natural conversation.

Acceptance criteria:
- If User provides the corrected version, create Corrected Memory Fact.
- Supersede the inaccurate Memory Fact.
- Exclude Superseded Memory Fact from normal recall.
- Preserve original Source Evidence.

## MR-011 Unresolved memory correction

If User says a Memory Fact is inaccurate but does not provide the corrected version, Anchor must ask once.

Acceptance criteria:
- Ask one short clarifying question.
- Include a Correction Citation showing the old Memory Fact.
- If no correction is provided during the one-day Correction Reply Window, inaccurate Memory Fact enters Recall Exclusion.

## MR-012 Memory update

Anchor must distinguish changed facts from corrections.

Acceptance criteria:
- Changed facts create newer active Memory Facts.
- Older facts remain Historical Memory Facts for timeline-aware recall.
- If distinction is ambiguous and matters, Anchor asks Correction-or-Update Clarification.

## MR-013 Correction undo

Anchor must support deliberate Correction Undo.

Acceptance criteria:
- Show Correction Undo Citation comparing old and current facts.
- Require explicit Correction Undo Confirmation.
- Ambiguous replies, silence, or unrelated messages do not restore the superseded fact.

## MR-014 Memory deletion

Anchor must support User-requested deletion from normal recall.

Acceptance criteria:
- Show Deletion Citation.
- Require Deletion Confirmation.
- Accept simple confirmations by voice or text.
- Treat ambiguous replies or silence as no deletion.
- Move deleted content to Recall Exclusion.
- Excluded content must not appear in normal recall, summaries, or Context Map traversal.

## MR-015 Bulk memory deletion

Anchor must use stronger confirmation for large deletion scopes.

Acceptance criteria:
- Confirmation question names the exact scope.
- Example: “Do you really want to delete memory of 30.04.2025?”
- No bulk deletion happens from ambiguous approval.
