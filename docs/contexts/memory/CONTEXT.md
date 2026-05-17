# Memory

Memory owns the language for diary storage, retrievable personal knowledge, and the graph-like context map used to recover forgotten information.

## Language

**Diary Entry**:
A dated record of something the User said, experienced, planned, or wanted Anchor to remember.
_Avoid_: Journal row, note, message

**Daytime Diary Capture**:
Diary-relevant information captured from a User-initiated conversation outside the evening Daily Check-in.
_Avoid_: Proactive daytime diary prompt, background surveillance

**Memory Fact**:
A concise claim extracted from User messages, diary entries, or calendar context with source evidence.
_Avoid_: Knowledge, belief, embedding

**Memory Correction**:
A User statement during ordinary conversation that says an existing Memory Fact is inaccurate and should be corrected.
_Avoid_: Separate correction workflow, support ticket, edit form

**Memory Update**:
A User statement that something has changed over time, creating a newer active Memory Fact while preserving the older fact as historical memory.
_Avoid_: Correction, overwrite, contradiction

**Correction-or-Update Clarification**:
A short question Anchor asks only when it materially cannot tell whether the User is correcting an inaccurate fact or describing a changed fact.
_Avoid_: Over-questioning, unnecessary confirmation

**Corrected Memory Fact**:
The replacement Memory Fact Anchor uses after the User provides a corrected version.
_Avoid_: Duplicate fact, conflicting memory

**Historical Memory Fact**:
An older Memory Fact that remains true for a past time period after a Memory Update.
_Avoid_: Superseded error, deleted old fact

**Superseded Memory Fact**:
An older Memory Fact replaced by a correction and excluded from normal recall while its Source Evidence remains preserved.
_Avoid_: Active conflicting memory, deleted transcript

**Correction Undo**:
A deliberate User request to undo a Memory Correction and restore the previously superseded Memory Fact as active memory.
_Avoid_: Accidental rollback, automatic conflict resolution

**Correction Undo Citation**:
A side-by-side citation showing the superseded old Memory Fact and the current Corrected Memory Fact before undoing a correction.
_Avoid_: Blind rollback, vague undo target

**Correction Undo Confirmation**:
An explicit User approval required before Anchor restores a Superseded Memory Fact as active memory.
_Avoid_: Accidental correction undo, implied rollback

**Unresolved Memory Correction**:
A Memory Correction where the User identifies an inaccurate memory but does not provide the corrected version.
_Avoid_: Half-fixed memory, ignored correction

**Correction Citation**:
The old Memory Fact Anchor shows when asking the User for the corrected version.
_Avoid_: Guessing the wrong memory, vague correction prompt

**Source Evidence**:
The original message, diary entry, transcript, or calendar event that supports a memory fact or answer.
_Avoid_: Citation metadata, provenance blob

**Conversation Transcript**:
The saved source record of a User's conversation with the Anchor Agent, including ordinary small talk.
_Avoid_: Disposable chat log, unmemorable message

**Conversation Summary Recall**:
A memory answer that summarizes what the User and Anchor Agent talked about during a requested time period.
_Avoid_: Raw transcript dump, unsupported recollection

**Memory Uncertainty**:
A lightweight expression of confidence when Anchor answers from imperfect or fuzzy memory evidence.
_Avoid_: False certainty, technical confidence score

**Memory Source Reference**:
A short user-friendly mention of where a recalled answer came from, such as a diary entry, conversation transcript, or calendar event.
_Avoid_: Raw citation metadata, database ID, hidden source

**Recall Follow-up Question**:
A short optional question after a memory recall answer that offers a clearly useful next action.
_Avoid_: Automatic task prompt, pressure, interrogation

**Memory Deletion**:
A User-requested removal of a Conversation Transcript, Diary Entry, Memory Fact, or day from normal Anchor recall.
_Avoid_: Hide button, archive, forget maybe

**Deletion Citation**:
A short citation or preview of the memory content Anchor is about to delete, shown before deletion.
_Avoid_: Blind deletion, raw database row, vague target

**Deletion Confirmation**:
An explicit User approval required before Anchor performs Memory Deletion.
_Avoid_: Accidental deletion, implied consent

**Voice Deletion Confirmation**:
A Deletion Confirmation spoken by the User and transcribed from Telegram voice.
_Avoid_: Button-only confirmation, exact phrase requirement

**Bulk Memory Deletion**:
A Memory Deletion request covering a large scope such as all memory for one day.
_Avoid_: Silent mass deletion, casual cleanup

**Recall Exclusion**:
The state of deleted or hidden content being unavailable to normal memory recall, summaries, and Context Map traversal.
_Avoid_: Soft delete that still answers, invisible memory

**Correction Reply Window**:
The one-day period after Anchor asks for a corrected version of an inaccurate memory.
_Avoid_: Indefinite pending correction, immediate deletion

**Context Map**:
The graph-like structure connecting people, places, events, dates, topics, diary entries, and calendar events for recall.
_Avoid_: Knowledge graph, vector database, memory store

**Memory Entity**:
A node in the Context Map representing a person, place, event, date, topic, or other User-specific concept.
_Avoid_: Node, object, record

**Memory Relationship**:
A typed connection between Memory Entities or source records in the Context Map.
_Avoid_: Edge, link

## Relationships

- A **Diary Entry** may produce one or more **Memory Facts**.
- A **Diary Entry** may come from the evening Daily Check-in or from **Daytime Diary Capture**.
- **Daytime Diary Capture** happens whenever the User talks to the Anchor Agent; Anchor does not proactively ask diary questions during the day.
- Every User conversation is memorable as **Conversation Transcript** Source Evidence, even when it contains no dates, events, or explicit things-to-remember.
- A **Memory Fact** must have **Source Evidence**.
- Not every **Conversation Transcript** needs to produce a **Memory Fact**.
- The Anchor Agent should detect **Memory Correction** during natural conversation; there is no separate correction workflow in the MVP.
- The Anchor Agent should distinguish **Memory Correction** from **Memory Update**.
- **Memory Correction** means the old Memory Fact was inaccurate.
- **Memory Update** means the old Memory Fact may have been true before, but a newer fact is now true.
- A **Memory Update** creates a newer active Memory Fact while preserving the older fact as a **Historical Memory Fact** for timeline-aware recall.
- Anchor asks a **Correction-or-Update Clarification** only when the distinction materially affects future recall.
- Signals such as "now" usually imply **Memory Update** and do not require clarification.
- Signals such as "no" or "that's wrong" usually imply **Memory Correction** and do not require clarification.
- If the User states a new fact that conflicts with existing memory and there is no clear update/correction signal, Anchor asks a short **Correction-or-Update Clarification**, e.g. "Should I remember that Anna lives in Berlin now, or was the old memory wrong?"
- If the User provides the corrected version, Anchor replaces the inaccurate Memory Fact with a **Corrected Memory Fact**.
- The inaccurate Memory Fact becomes a **Superseded Memory Fact** and should no longer be used for normal recall after it is replaced.
- The original **Source Evidence** remains preserved after **Memory Correction**.
- A **Superseded Memory Fact** may be restored only through a deliberate **Correction Undo** requested by the User.
- Before performing **Correction Undo**, Anchor shows a **Correction Undo Citation** comparing the old and current facts and asks for **Correction Undo Confirmation**.
- **Correction Undo Confirmation** may be given by voice or text, but ambiguous replies, silence, or unrelated messages do not restore the superseded fact.
- If the User says a Memory Fact is inaccurate but does not provide the corrected version, Anchor asks one short clarifying question for the corrected version.
- When asking for the corrected version, Anchor includes a **Correction Citation** showing the old Memory Fact, e.g. "You told me Anna is your sister. What should I remember instead?"
- If the User does not provide the corrected version during the **Correction Reply Window**, the inaccurate Memory Fact enters **Recall Exclusion** after one day.
- A User question such as "What did we talk about yesterday?" uses **Conversation Summary Recall** over the relevant **Conversation Transcripts** and Diary Entries.
- Memory recall answers should include **Memory Uncertainty** when the evidence is fuzzy, incomplete, transcript-derived, or semantically matched rather than exact.
- **Memory Uncertainty** should be light and conversational, e.g. "I’m fairly sure...", "I found one note that may be related...", or "I’m not sure, but..."
- Memory recall answers should use **Memory Source Reference** when helpful, e.g. "I found this in your diary from Tuesday."
- Anchor should not expose technical confidence scores, embedding similarity, or retrieval internals to the User.
- Anchor may ask a **Recall Follow-up Question** after a recall answer, but only when it is clearly useful.
- A **Recall Follow-up Question** should offer help without pressure, e.g. "Do you want me to remind you about Anna's visit again later?"
- Anchor should not turn every recall answer into a task prompt.
- Anchor should never pressure the User to create a reminder, calendar event, diary entry, or other follow-up action.
- The User may request **Memory Deletion** for a conversation, day, Diary Entry, Conversation Transcript, or Memory Fact.
- Anchor does not support a separate "hide from summaries" action in the MVP.
- The single User-facing privacy action is **Memory Deletion**, which leads to **Recall Exclusion**.
- Only the **User** may request or confirm **Memory Deletion** in the MVP.
- A **Trusted Contact** cannot delete, hide, or confirm deletion of the User's memory content.
- Before performing **Memory Deletion**, Anchor shows a **Deletion Citation** and asks for **Deletion Confirmation**.
- A **Deletion Citation** should be human-readable and specific enough for the User to recognize what will be deleted.
- **Deletion Confirmation** may be given by voice or text using simple phrases such as "yes", "delete it", or "go ahead".
- Rejection of deletion may be given by voice or text using simple phrases such as "no" or "keep it".
- Ambiguous replies, silence, or unrelated messages do not count as **Deletion Confirmation**.
- For **Bulk Memory Deletion**, the Anchor Agent asks a direct confirmation question naming the scope, e.g. "Do you really want to delete memory of 30.04.2025?"
- Content under **Memory Deletion** must enter **Recall Exclusion** and must not appear in normal memory recall or conversation summaries.
- If deleted content is retained for backup, legal, abuse prevention, or debugging reasons, that retained copy is not Anchor memory and is outside normal Anchor Agent recall.
- The **Context Map** contains **Memory Entities** and **Memory Relationships**.
- A memory recall answer should be grounded in **Source Evidence**.

## Example dialogue

> **Dev:** "Can the **Anchor Agent** answer from memory if no source exists?"
> **Domain expert:** "No. A **Memory Fact** needs **Source Evidence**, and uncertain answers should say they are uncertain."

> **Dev:** "If the **User** asks 'What did we talk about yesterday?', should Anchor answer?"
> **Domain expert:** "Yes. Anchor summarizes yesterday's **Conversation Transcripts** and Diary Entries instead of requiring explicit events or dates."

> **Dev:** "Can the **User** delete yesterday's conversation from memory?"
> **Domain expert:** "Yes, but Anchor first shows a **Deletion Citation** and asks for **Deletion Confirmation**. For a whole day, it asks directly: 'Do you really want to delete memory of 30.04.2025?'"

> **Dev:** "Does the **User** need to press a button to confirm deletion?"
> **Domain expert:** "No. The **User** can confirm by voice or text with simple phrases like 'yes', 'delete it', or 'go ahead'."

> **Dev:** "Can a **Trusted Contact** delete or hide memories for the **User**?"
> **Domain expert:** "No. Only the **User** can request and confirm **Memory Deletion** in the MVP."

> **Dev:** "Should Anchor support hiding memories from summaries separately from deletion?"
> **Domain expert:** "No. The MVP has one clear action: **Memory Deletion**, which removes the content from normal recall and summaries through **Recall Exclusion**."

> **Dev:** "Does correcting a memory require a separate workflow?"
> **Domain expert:** "No. The **Anchor Agent** detects **Memory Correction** in conversation. If the corrected version is present, it replaces the inaccurate Memory Fact. If not, Anchor asks for the corrected version; after one day without a reply, the inaccurate Memory Fact enters **Recall Exclusion**."

> **Dev:** "Should Anchor show the old memory when asking for a correction?"
> **Domain expert:** "Yes. Anchor should include a **Correction Citation**, e.g. 'You told me Anna is your sister. What should I remember instead?'"

> **Dev:** "Does correction delete the original source?"
> **Domain expert:** "No. The original **Source Evidence** remains preserved, but the old extracted fact becomes a **Superseded Memory Fact** and is excluded from normal recall unless the User deliberately requests **Correction Undo**."

> **Dev:** "Should **Correction Undo** require citation and confirmation?"
> **Domain expert:** "Yes. Anchor should show the old and current facts, then ask for explicit confirmation before restoring the old version."

> **Dev:** "Should Anchor distinguish 'I was wrong' from 'things changed'?"
> **Domain expert:** "Yes. 'Anna is not my sister, she is my daughter' is **Memory Correction**. 'Anna moved to Berlin' is **Memory Update**: the newer fact becomes active, while the older fact remains available as historical memory for timeline questions."

> **Dev:** "Should Anchor ask when it cannot tell correction from update?"
> **Domain expert:** "Yes, but only when it matters. If 'now' or 'that's wrong' makes the intent clear, Anchor should act. If a conflicting fact is ambiguous, Anchor asks: 'Should I remember that Anna lives in Berlin now, or was the old memory wrong?'"

> **Dev:** "Should Anchor expose uncertainty in memory answers?"
> **Domain expert:** "Yes, lightly. It can say 'I’m fairly sure...' or 'I found this in your diary from Tuesday,' but it should not show technical confidence scores."

> **Dev:** "Should Anchor ask follow-up questions after recall answers?"
> **Domain expert:** "Sometimes, but carefully. If the User asks 'What did we talk about yesterday?', Anchor might answer: 'We talked mostly about Anna's visit and your doctor appointment. I found that in yesterday's conversation. Do you want me to remind you about Anna's visit again later?' It should ask only when clearly useful, should not turn every recall into a task prompt, and should never pressure the User."

## Flagged ambiguities

- "context-map" means the User's memory graph, not the repository `CONTEXT-MAP.md` documentation file.
