# Anchor MVP Scope

## In scope

### User identity and setup

- Anchor Account creation for one User.
- Login to the webapp.
- Telegram pairing for the User's Anchor Agent.
- Google Connection for Google Calendar read/write access.
- User-managed Agent Settings:
  - Daily Check-in Time Setting.
  - Wellbeing Check-in Setting.
  - Reminder Pattern Setting.

### Telegram agent interaction

- User can send text messages to the Anchor Agent.
- User can send voice messages to the Anchor Agent.
- Voice messages are transcribed before processing.
- Anchor Agent responds in Good Friend Voice.
- Anchor Agent supports small talk without saying there was nothing to store.

### Proactive check-ins

- Morning Calendar Check-in.
- Evening Daily Check-in.
- One gentle follow-up for missed replies, then stop and save partial answers.

### Calendar

- Read today's Google Calendar events for morning check-ins.
- Create Calendar Additions when the User clearly asks to remember calendar-related information.
- Ask a short clarifying question if date, time, or intent is unclear.
- Use the Calendar Write Acknowledgement: “Got it! We won't forget that.”
- Apply the User's Reminder Pattern.

### Memory and diary

- Save Conversation Transcripts as Source Evidence.
- Create Diary Entries from Daily Check-ins and daytime conversations where relevant.
- Extract Memory Facts from User messages, diary entries, and calendar context.
- Support date-based recall.
- Support context/topic-based recall.
- Support memory correction and update in natural conversation.
- Support Memory Deletion with citation and confirmation.

### Trusted Contacts and safety

- Trusted Contact setup is allowed only as fallback contact/recovery/escalation support.
- Trusted Contact has no default diary or calendar access.
- Non-response Escalation requires explicit User consent if included.
- Emergency Boundary must be visible in safety-sensitive flows.

## Out of scope for MVP

- Caregiver role or caregiver dashboard.
- Shared family account.
- Medical advice.
- Diagnosis, treatment, or clinical assessment.
- Emergency dispatch or emergency monitoring guarantee.
- Always-on passive listening.
- Arbitrary advanced reminder rules.
- Raw graph visualization for the User unless later explicitly scoped.
- Multi-user households.
- Multiple Anchor Agents per User.
- Public social features.

## Later, not now

- Diary/memory browsing and editing in a rich web UI.
- Multiple external calendars.
- Additional messaging channels beyond Telegram.
- Family collaboration with fine-grained permissions.
- Clinician export workflows.
- Advanced analytics.
- User-visible context-map graph explorer.

## MVP hardcoding decisions

- Morning Calendar Check-in happens in the morning.
- Daily Check-in happens at the User's configured evening time.
- Proactive daytime diary prompts are not supported.
- Proactive check-ins are limited to morning calendar and evening diary.
- Agent behavior outside configured settings is hardcoded.

## Scope risk

Trusted Contact escalation is still a product-scope risk. Recovery-only Trusted Contacts are simpler than non-response escalation. If time is tight, keep Trusted Contacts for account recovery first and defer escalation.
