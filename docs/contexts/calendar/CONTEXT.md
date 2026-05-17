# Calendar

Calendar owns the language for Google Calendar connection, calendar event retrieval, reminders, and safe calendar mutation.

## Language

**Google Connection**:
The User's authorized Google account connection that lets Anchor read or write selected calendar data.
_Avoid_: Google account, OAuth token

**Calendar Event**:
A dated commitment, appointment, reminder, or scheduled activity from the User's connected calendar.
_Avoid_: Meeting, task, diary event

**Morning Calendar Check-in**:
A morning Anchor Agent conversation that reminds the User about today's Calendar Events and asks whether anything should be added to the calendar.
_Avoid_: Daily check-in, agenda dump

**Calendar Addition**:
A calendar event or reminder the Anchor Agent creates immediately when the User clearly asks to remember something calendar-related.
_Avoid_: Calendar proposal, draft event, unconfirmed event

**Calendar Write Acknowledgement**:
The short confirmation the Anchor Agent sends after adding something to the calendar.
_Avoid_: Permission request, approval prompt

**Reminder Pattern**:
A User-selected setting that determines when Anchor reminds the User before and at a Calendar Event.
_Avoid_: Notification rule, alert policy

**Custom Single Reminder Offset**:
A fixed-list minute/hour/day value selected when the User chooses a single reminder before a Calendar Event.
_Avoid_: Arbitrary number input, advanced schedule, cron setting

## Relationships

- A **Google Connection** belongs to exactly one **Anchor Account**.
- A **Calendar Event** may be used as Source Evidence for memory recall.
- A **Morning Calendar Check-in** presents today's relevant **Calendar Events** in the morning.
- A **Morning Calendar Check-in** asks whether the User wants to add anything to the calendar.
- Outside the **Morning Calendar Check-in**, the User may still ask the Anchor Agent to remember calendar-related information at any time.
- If the User clearly asks to remember something calendar-related, Anchor creates a **Calendar Addition** immediately without a separate confirmation prompt.
- If the date, time, or intent is unclear, the Anchor Agent asks a short clarifying question before creating a **Calendar Addition**.
- After a **Calendar Addition**, the Anchor Agent uses a **Calendar Write Acknowledgement**, e.g. "Got it! We won't forget that."
- A **Reminder Pattern** controls reminders for Calendar Events.
- The mobile-first reminder settings include fixed patterns and one fixed-list **Custom Single Reminder Offset**.
- The **Custom Single Reminder Offset** list should be small and avoid arbitrary numeric input.

## Example dialogue

> **Dev:** "If the **User** says 'Remind me tomorrow to call Anna,' do we create the event immediately?"
> **Domain expert:** "No. The date is clear but the time is missing, so the **Anchor Agent** asks one short clarifying question before creating a **Calendar Addition**."

## Flagged ambiguities

- "event" can mean diary event or calendar event. Resolved: use **Calendar Event** only for calendar-backed scheduled items.
