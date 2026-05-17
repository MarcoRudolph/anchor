# Anchor User Journeys

## UJ-001 New User registers

**Trigger:** A person visits the Anchor webapp.

**Preconditions:** The person is not logged in.

**Steps:**
1. User creates an Anchor Account.
2. User verifies or confirms account credentials.
3. Webapp explains that Anchor works through Telegram and Google Calendar.
4. User proceeds to Telegram pairing.

**Data created:** Anchor Account, User profile.

**Acceptance criteria:**
- A new Anchor Account belongs to exactly one User.
- The UI uses User, not Patient.
- The onboarding copy describes older adults with memory difficulties without clinical framing.

## UJ-002 User pairs Telegram

**Trigger:** User chooses to connect Telegram during onboarding or settings.

**Preconditions:** User is logged into the webapp.

**Steps:**
1. Webapp shows pairing instructions.
2. User opens Telegram and starts the Anchor Agent.
3. User completes pairing.
4. Webapp confirms the Anchor Agent is connected.

**Data created:** Telegram identity mapping for the Anchor Account.

**Acceptance criteria:**
- One Anchor Agent communicates with exactly one User.
- Pairing cannot attach another User's Telegram identity to the wrong Anchor Account.

## UJ-003 User connects Google Calendar

**Trigger:** User chooses Google Connection.

**Preconditions:** User is logged in.

**Steps:**
1. User starts Google OAuth flow.
2. User grants calendar permissions.
3. Webapp stores the Google Connection.
4. Anchor can read today's Calendar Events and create Calendar Additions.

**Data created:** Google Connection, encrypted OAuth token material.

**Acceptance criteria:**
- Google Connection belongs to exactly one Anchor Account.
- User can disconnect the Google Connection later.
- Failure to connect gives a clear non-technical message.

## UJ-004 Morning Calendar Check-in

**Trigger:** Morning schedule fires.

**Preconditions:** Telegram paired; Google Connection active.

**Steps:**
1. Anchor reads today's relevant Calendar Events.
2. Anchor sends a short Good Friend Voice message listing relevant events.
3. Anchor asks whether anything should be added to the calendar.
4. If User replies with a clear event, Anchor creates a Calendar Addition.
5. If details are unclear, Anchor asks one clarifying question.

**Data created:** Message transcript; optional Calendar Addition; optional Diary Entry or Memory Fact if relevant.

**Acceptance criteria:**
- Anchor does not send an agenda dump.
- Anchor uses the configured Reminder Pattern for reminders.

## UJ-005 Evening Daily Check-in

**Trigger:** Daily Check-in Time Setting.

**Preconditions:** Telegram paired.

**Steps:**
1. Anchor asks one simple question about the day.
2. User replies by voice or text.
3. Anchor asks the next short question if useful.
4. Anchor captures highlights, topics, and things to remember.
5. If User stops replying, Anchor sends one gentle follow-up or moves on, then saves partial answers.

**Data created:** Conversation Transcript, Diary Entry, optional Memory Facts, optional Calendar Additions.

**Acceptance criteria:**
- Daily Check-in is multi-turn, not one long form.
- Anchor asks one question at a time when possible.
- A single missed reply does not trigger Non-response Escalation.

## UJ-006 User asks Anchor to remember an event

**Trigger:** User sends a message such as “Remind me tomorrow at 10 to call Anna.”

**Preconditions:** Telegram paired; Google Connection active for calendar write.

**Steps:**
1. Anchor performs Event Extraction.
2. If intent, date, and time are clear, Anchor creates a Calendar Addition immediately.
3. Anchor replies with Calendar Write Acknowledgement.
4. If required details are missing, Anchor asks one short clarifying question.

**Data created:** Conversation Transcript; Calendar Addition; optional Memory Fact.

**Acceptance criteria:**
- No confirmation prompt when details are clear.
- Clarification happens before write when details are missing.

## UJ-007 User asks a memory recall question

**Trigger:** User asks “What did we talk about yesterday?” or “What was Anna's appointment about?”

**Preconditions:** Relevant Source Evidence exists.

**Steps:**
1. Anchor retrieves Source Evidence by date, topic, or context.
2. Anchor answers in Good Friend Voice.
3. Anchor includes light uncertainty if evidence is fuzzy.
4. Anchor references the source when helpful.
5. Anchor may ask one gentle follow-up only if clearly useful.

**Data created:** Conversation Transcript of the recall interaction.

**Acceptance criteria:**
- Anchor does not answer from unsupported memory.
- Anchor does not expose retrieval internals.
- Anchor does not turn every recall into a task prompt.

## UJ-008 User corrects memory

**Trigger:** User says a remembered fact is wrong.

**Preconditions:** Existing Memory Fact may be affected.

**Steps:**
1. Anchor identifies Memory Correction intent.
2. If the corrected version is present, Anchor creates a Corrected Memory Fact and supersedes the old fact.
3. If the corrected version is missing, Anchor asks one clarifying question with a Correction Citation.
4. If no reply arrives within the Correction Reply Window, the inaccurate fact enters Recall Exclusion.

**Data created:** Corrected Memory Fact, Superseded Memory Fact state, audit event.

**Acceptance criteria:**
- Correction is handled in natural conversation.
- Original Source Evidence remains preserved.
- Superseded fact is excluded from normal recall.

## UJ-009 User deletes memory

**Trigger:** User asks Anchor to delete a memory, conversation, Diary Entry, or day.

**Preconditions:** Target content exists or can be identified.

**Steps:**
1. Anchor identifies the deletion target.
2. Anchor shows a Deletion Citation.
3. Anchor asks for Deletion Confirmation.
4. User confirms by voice or text.
5. Anchor moves content into Recall Exclusion.

**Data created:** Deletion audit event; recall exclusion state.

**Acceptance criteria:**
- Ambiguous replies or silence do not confirm deletion.
- Bulk deletion uses stronger confirmation naming the scope.
- Trusted Contacts cannot delete User memories.

## UJ-010 Trusted Contact assists password reset

**Trigger:** Verified Trusted Contact starts recovery.

**Preconditions:** User has configured and verified a Trusted Contact.

**Steps:**
1. Trusted Contact supplies Trusted Contact Email.
2. Trusted Contact supplies User Recovery Identifier and User Birthdate.
3. User Zipcode is requested only if needed for disambiguation.
4. If matched, Trusted Contact can set a new User password.
5. Active web sessions are revoked.
6. Telegram pairing and Google Connection remain active by default.

**Data created:** Recovery audit event; new password hash; session revocation.

**Acceptance criteria:**
- Existing password is never revealed.
- Trusted Contact receives no lasting login ability.
- Trusted Contact receives no default diary/calendar access.
