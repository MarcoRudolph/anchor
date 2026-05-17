# Anchor Functional Requirements

## Account and identity

### FR-001 Anchor Account registration

**Requirement:** A new User can create one Anchor Account.

**Acceptance criteria:**
- Given a new User, when registration succeeds, then an Anchor Account is created.
- The account belongs to exactly one User.
- Product copy uses User, not Patient.

**Source context:** `docs/contexts/user-identity/CONTEXT.md`

### FR-002 User login

**Requirement:** A registered User can log into the webapp.

**Acceptance criteria:**
- Valid credentials create a web session.
- Invalid credentials do not reveal whether an account exists.
- Password reset creates a new password; it never reveals the old password.

### FR-003 Agent settings

**Requirement:** The User can manage MVP Agent Settings in the webapp.

**Acceptance criteria:**
- User can set Daily Check-in Time Setting.
- User can set Wellbeing Check-in Setting.
- User can set Reminder Pattern Setting.
- No other agent behavior is exposed as a configurable MVP setting.

## Telegram

### FR-010 Telegram pairing

**Requirement:** A logged-in User can pair Telegram with their Anchor Account.

**Acceptance criteria:**
- One Anchor Agent communicates with exactly one User.
- Pairing links the correct Telegram identity to the correct Anchor Account.
- Re-pairing or lost Telegram access is handled as a Recovery Flow.

### FR-011 Telegram text messages

**Requirement:** The Anchor Agent can receive and respond to User text messages through Telegram.

**Acceptance criteria:**
- Every User Message is captured as Conversation Transcript Source Evidence.
- Messages are processed for Event Extraction and memory relevance.
- Small talk receives a natural Good Friend Voice response.

### FR-012 Telegram voice messages

**Requirement:** The Anchor Agent can receive User voice messages through Telegram and transcribe them before processing.

**Acceptance criteria:**
- Voice Reply is transcribed.
- Message Size Limit is applied after transcription.
- The transcript is stored as part of Source Evidence.

## Google Calendar

### FR-020 Google Connection

**Requirement:** A User can connect a Google account for calendar access.

**Acceptance criteria:**
- OAuth flow stores a Google Connection for exactly one Anchor Account.
- Calendar read is available for Morning Calendar Check-in.
- Calendar write is available for Calendar Additions.
- User can disconnect the Google Connection.

### FR-021 Calendar event retrieval

**Requirement:** Anchor can retrieve relevant Calendar Events for the current day.

**Acceptance criteria:**
- Morning Calendar Check-in includes today's relevant Calendar Events.
- Empty calendars produce a friendly message, not an error.
- Calendar retrieval failures are communicated non-technically.

### FR-022 Calendar Addition

**Requirement:** Anchor creates a Calendar Addition when the User clearly asks to remember calendar-related information.

**Acceptance criteria:**
- If intent, date, and time are clear, Anchor writes immediately without a separate confirmation prompt.
- If date, time, or intent is unclear, Anchor asks a short clarifying question before writing.
- After writing, Anchor says “Got it! We won't forget that.” or equivalent Calendar Write Acknowledgement.

**Source ADR:** `docs/adr/0001-calendar-additions-without-confirmation.md`

## Check-ins

### FR-030 Morning Calendar Check-in

**Requirement:** Anchor starts a morning check-in about today's calendar.

**Acceptance criteria:**
- Message uses Good Friend Voice.
- Message mentions today's relevant Calendar Events.
- Message asks whether anything should be added to the calendar.
- It is not treated as the evening Daily Check-in.

### FR-031 Daily Check-in

**Requirement:** Anchor starts an evening Daily Check-in at the configured time.

**Acceptance criteria:**
- Conversation is short and multi-turn.
- Anchor asks about daily highlights, topics discussed, and anything else to remember.
- Anchor asks one question at a time when possible.
- Partial replies are saved.

### FR-032 Missed Reply handling

**Requirement:** Anchor handles missed replies gently.

**Acceptance criteria:**
- Anchor sends at most one gentle follow-up or moves on once.
- If the User still does not reply, Anchor stops that check-in and saves partial answers.
- A single Missed Reply does not trigger Non-response Escalation.

## Memory and diary

### FR-040 Conversation Transcript capture

**Requirement:** Anchor stores every User conversation as Source Evidence.

**Acceptance criteria:**
- Small talk is captured as memorable source evidence.
- Not every transcript produces a Memory Fact.
- Anchor never tells the User “nothing was stored” merely because no structured fact was extracted.

### FR-041 Diary Entry creation

**Requirement:** Anchor creates Diary Entries from Daily Check-ins and relevant User-initiated conversations.

**Acceptance criteria:**
- Diary Entries are dated.
- Diary Entries link to Source Evidence.
- Diary Entries may produce Memory Facts.

### FR-042 Memory Fact extraction

**Requirement:** Anchor extracts concise Memory Facts from User messages, Diary Entries, and calendar context.

**Acceptance criteria:**
- Every Memory Fact has Source Evidence.
- Facts can reference people, places, events, dates, topics, diary entries, and Calendar Events.
- Facts support date and context recall.

### FR-043 Memory recall

**Requirement:** User can ask Anchor to recover forgotten information.

**Acceptance criteria:**
- Anchor answers date-based recall questions.
- Anchor answers topic/context recall questions.
- Anchor grounds answers in Source Evidence.
- Anchor expresses light uncertainty when evidence is fuzzy.
- Anchor does not expose technical confidence scores or retrieval internals.

### FR-044 Conversation Summary Recall

**Requirement:** User can ask what they talked about during a period.

**Acceptance criteria:**
- Anchor summarizes Conversation Transcripts and Diary Entries for the period.
- Anchor does not require explicit events or dates to answer.
- Deleted or recall-excluded content is not included.

### FR-045 Memory correction

**Requirement:** Anchor supports Memory Correction during natural conversation.

**Acceptance criteria:**
- If corrected value is present, Anchor replaces the inaccurate Memory Fact.
- Old inaccurate fact becomes Superseded Memory Fact.
- Original Source Evidence remains preserved.
- Superseded fact is excluded from normal recall.

### FR-046 Memory update

**Requirement:** Anchor distinguishes changed facts from inaccurate facts.

**Acceptance criteria:**
- “Now” style changes create a newer active Memory Fact.
- Older fact remains as Historical Memory Fact for timeline-aware recall.
- Ambiguous correction/update conflicts produce one short clarification only when it matters.

### FR-047 Memory deletion

**Requirement:** User can delete memory content from normal recall.

**Acceptance criteria:**
- Anchor shows a Deletion Citation before deletion.
- Anchor requires explicit Deletion Confirmation by voice or text.
- Ambiguous replies, silence, or unrelated messages do not confirm deletion.
- Deleted content enters Recall Exclusion.
- Trusted Contacts cannot delete or confirm deletion.

## Trusted Contacts and recovery

### FR-050 Trusted Contact invitation

**Requirement:** User can invite one or more Trusted Contacts by email.

**Acceptance criteria:**
- Invitation does not create another Anchor Account.
- Contact is Pending Trusted Contact until accepted.
- Only Verified Trusted Contacts can participate in recovery or enabled escalation.

### FR-051 Assisted Password Reset

**Requirement:** A Verified Trusted Contact can assist with password reset after a matching recovery request.

**Acceptance criteria:**
- Recovery uses Trusted Contact Email, User Birthdate, and User Recovery Identifier.
- User Zipcode is used only as an additional disambiguation factor when needed.
- Successful reset creates a new password and revokes active web sessions.
- Telegram pairing and Google Connection remain active by default.

### FR-052 Non-response Escalation

**Requirement:** Anchor may notify a Verified Trusted Contact after sustained non-response only if explicitly enabled.

**Acceptance criteria:**
- Non-response Escalation requires a Consent Boundary.
- Notification does not grant diary or calendar access.
- Emergency Boundary is visible in safety-sensitive UI.

## Usage limits

### FR-060 Message Size Limit

**Requirement:** Anchor enforces a per-message size limit.

**Acceptance criteria:**
- Applies to text messages directly.
- Applies to voice messages after transcription.
- If exceeded, Anchor sends a Gentle Limit Notice.

### FR-061 Conversation Budget

**Requirement:** Anchor enforces rolling usage budgets.

**Acceptance criteria:**
- Supports short and longer Rolling Usage Windows.
- When budget is reached, User gets a Gentle Limit Notice.
- Provider quota or token language is not shown to the User.
