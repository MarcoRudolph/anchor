# Agent Interaction

Agent Interaction owns the language for how the User communicates with the Anchor Agent through Telegram using voice or text.

## Language

**Anchor Agent**:
The AI companion assigned to a User and responsible for check-ins, diary capture, calendar support, and memory recall.
_Avoid_: Bot, assistant, caregiver

**Good Friend Voice**:
The Anchor Agent's communication style: warm, interested, respectful, simple, and never infantilizing.
_Avoid_: Clinical tone, robotic assistant voice, childish language

**Good Companion Role**:
The Anchor Agent's role during ordinary conversation: a patient, contemporary companion who can make small talk and keep the User company without forcing every exchange into a task.
_Avoid_: Therapist, clinician, productivity bot, childish entertainer

**Small Talk Mode**:
A conversational behavior used when the User is simply talking and no immediate calendar or explicit memory action is needed.
_Avoid_: Nothing-to-store response, command failure, empty extraction message

**Daily Check-in**:
A short multi-turn evening conversation where the Anchor Agent asks the User about daily highlights, topics they talked about, and anything else they wish to remember.
_Avoid_: Survey, form, assessment, single long questionnaire

**Morning Calendar Check-in**:
A morning conversation where the Anchor Agent reminds the User about today's calendar events and asks whether anything should be added to the calendar.
_Avoid_: Daily check-in, agenda dump, task list

**Missed Reply**:
A Daily Check-in or Morning Calendar Check-in question that the User does not answer within the expected reply window.
_Avoid_: Non-response escalation, failure, abandonment

**Daily Check-in Time Setting**:
An Agent Setting that lets the User choose the evening time for the Daily Check-in.
_Avoid_: Frequency setting, schedule builder

**Agent Setting**:
A User-managed preference that changes how the Anchor Agent communicates or what it asks about.
_Avoid_: Clinical configuration, admin policy

**Wellbeing Check-in Setting**:
An Agent Setting that lets the User choose whether the Anchor Agent proactively asks about emotions and wellbeing.
_Avoid_: Mental health mode, therapy setting, diagnosis setting

**Reminder Pattern Setting**:
A mobile-first Agent Setting where the User chooses how Anchor reminds them before and at calendar events.
_Avoid_: Advanced notification rules, cron configuration

**User Message**:
A voice or text message sent by the User to the Anchor Agent about any topic.
_Avoid_: Input, ticket, note

**User-Initiated Conversation**:
A daytime or ad-hoc conversation started by the User, during which the Anchor Agent captures diary- and calendar-relevant information while still responding naturally.
_Avoid_: Scheduled check-in, passive monitoring

**Proactive Check-in**:
An Anchor Agent conversation started by Anchor rather than by the User.
_Avoid_: Always-on prompting, repeated nudges

**Event Extraction**:
The Anchor Agent's attempt to identify events, dates, appointments, reminders, and things-to-remember from any User Message.
_Avoid_: Form parsing, command handling only

**Clarifying Question**:
A short question the Anchor Agent asks when an extracted event, date, or memory detail is unclear.
_Avoid_: Error message, validation failure

**Voice Reply**:
A spoken User Message sent through Telegram and transcribed before processing.
_Avoid_: Audio blob, recording

## Relationships

- An **Anchor Agent** communicates with exactly one **User**.
- An **Anchor Agent** uses **Good Friend Voice**: warm, genuinely interested, respectful, and simple.
- In memory recall, **Good Friend Voice** includes light uncertainty when appropriate, rather than sounding falsely certain.
- After memory recall, **Good Friend Voice** may include one gentle follow-up question only when the next action is clearly useful.
- An **Anchor Agent** fills the **Good Companion Role**, especially when the User simply wants someone to talk to.
- In **Small Talk Mode**, the Anchor Agent responds naturally and does not say things like "I heard what you said, but I couldn't retrieve anything to store for now."
- A **Daily Check-in** happens in the evening at the User's configured **Daily Check-in Time Setting**.
- A **Morning Calendar Check-in** happens in the morning and mentions today's relevant calendar events.
- A **Morning Calendar Check-in** uses **Good Friend Voice**, e.g. "Hey, be aware that today is appointment xy."
- A **Morning Calendar Check-in** asks: "Is there anything to add to the calendar you wish to be remembered about?"
- A **Daily Check-in** is a short multi-turn conversation, not one long message.
- A **Daily Check-in** asks about daily highlights, topics the User talked about, and anything else the User wishes to remember.
- A **Daily Check-in** asks one question at a time when possible.
- On a **Missed Reply**, the Anchor Agent waits briefly, sends one gentle follow-up or moves on once, and does not pressure the User.
- The Anchor Agent does not pressure the User with follow-up prompts after memory recall.
- If the User still does not reply, the Anchor Agent stops that check-in and saves any partial answers.
- A single **Missed Reply** does not trigger **Non-response Escalation**.
- The User manages MVP **Agent Settings**: **Daily Check-in Time Setting**, **Wellbeing Check-in Setting**, and **Reminder Pattern Setting**.
- Other Anchor Agent behavior is hardcoded for MVP.
- The **Reminder Pattern Setting** is mobile-first and offers: "30 minutes before and at the appointment time", "1 hour before and at the appointment time", or "just once before" with a small fixed-list combobox for the offset.
- The **Wellbeing Check-in Setting** controls whether the Anchor Agent proactively asks about emotions and wellbeing.
- A **User Message** may be about any topic, not only calendar or diary commands.
- A **User-Initiated Conversation** may happen at any time during the day.
- During a **User-Initiated Conversation**, the Anchor Agent captures the conversation as memorable Source Evidence and extracts diary- and calendar-relevant information from natural conversation.
- The Anchor Agent performs **Event Extraction** on User Messages to find events, dates, appointments, reminders, and things-to-remember.
- When **Event Extraction** is unclear, the Anchor Agent asks a **Clarifying Question** before creating a Calendar Addition or memory record.
- The Anchor Agent asks a **Clarifying Question** whenever a calendar action, date, event, commitment, or important memory detail is unclear, regardless of whether the conversation was proactive or User-initiated.
- The Anchor Agent also asks a **Clarifying Question** when the User says an existing memory is inaccurate but does not provide the corrected version.
- The Anchor Agent asks a **Clarifying Question** when a conflicting memory could be either a correction or an update and the distinction matters for future recall.
- The Anchor Agent does not ask a **Clarifying Question** merely because a User Message has no date, event, or explicit memorable item.
- In MVP, **Proactive Check-ins** are limited to the morning **Morning Calendar Check-in** and the evening **Daily Check-in**.
- The Anchor Agent does not proactively ask diary questions during the day outside the evening **Daily Check-in**.
- The Anchor Agent does not proactively ask calendar questions outside the morning **Morning Calendar Check-in**, except for event reminders governed by the **Reminder Pattern Setting**.
- A **Voice Reply** is a User Message with an audio source and transcript.

## Example dialogue

> **Dev:** "Should the **Daily Check-in** ask all questions at once?"
> **Domain expert:** "No. The **Anchor Agent** should keep it simple and ask one thing at a time where possible."

> **Dev:** "What should happen when the User just wants to chat?"
> **Domain expert:** "The **Anchor Agent** uses **Small Talk Mode** and acts as a **Good Companion**. It should not complain that nothing was extracted."

## Flagged ambiguities

- "bot" is too generic. Resolved: use **Anchor Agent** for the user-facing AI companion.
