# Anchor Calendar Requirements

## Purpose

Anchor calendar behavior helps the User remember appointments, commitments, reminders, and scheduled activities through Google Calendar and Telegram.

## CAL-001 Google Connection

A User must be able to connect a Google account for calendar access.

Acceptance criteria:
- Google Connection belongs to exactly one Anchor Account.
- OAuth token material is stored securely.
- User can disconnect the Google Connection.
- Calendar failures are communicated without technical jargon.

## CAL-002 Calendar Event retrieval

Anchor must retrieve today's relevant Calendar Events for Morning Calendar Check-in.

Acceptance criteria:
- All-day and timed events are handled.
- User timezone is respected.
- Empty calendar produces a friendly message.
- Retrieval failure does not crash the check-in.

## CAL-003 Morning Calendar Check-in

Anchor must send a morning calendar message.

Acceptance criteria:
- Message uses Good Friend Voice.
- Message mentions today's relevant Calendar Events.
- Message asks whether anything should be added to the calendar.
- Message is concise and not an agenda dump.

## CAL-004 Calendar Addition without confirmation

Anchor must create Calendar Additions immediately when details are clear.

Acceptance criteria:
- Clear intent + date + time results in immediate write.
- No separate “Should I add this?” prompt.
- Anchor sends Calendar Write Acknowledgement after success.

Source ADR: `docs/adr/0001-calendar-additions-without-confirmation.md`

## CAL-005 Clarifying question before incomplete calendar writes

Anchor must ask a short clarifying question if required calendar details are missing or ambiguous.

Acceptance criteria:
- Missing time causes clarification before write.
- Ambiguous date causes clarification before write.
- Unclear intent causes clarification before write.
- Clarification is short and asks for only the missing detail where possible.

## CAL-006 Calendar Write Acknowledgement

After a Calendar Addition, Anchor must acknowledge simply.

Acceptance criteria:
- Preferred phrasing: “Got it! We won't forget that.”
- Equivalent Good Friend Voice phrasing is allowed.
- Do not expose API write details.

## CAL-007 Reminder Pattern Setting

User must be able to choose the Reminder Pattern used for Calendar Events.

Acceptance criteria:
- Options include “30 minutes before and at the appointment time”.
- Options include “1 hour before and at the appointment time”.
- Options include “just once before” with small fixed-list offset choices.
- Avoid arbitrary numeric or cron-style input in MVP.

## CAL-008 Calendar events as memory source

Calendar Events may be used as Source Evidence for memory recall.

Acceptance criteria:
- Calendar Events can connect to Diary Entries or Memory Facts.
- Recall can reference calendar source in user-friendly language.
- Deleted memory rules still apply to memory content derived from calendar context.

## CAL-009 Timezone handling

Anchor must handle User timezone consistently.

Acceptance criteria:
- Check-ins fire according to User timezone.
- Calendar Events are interpreted according to User calendar timezone unless overridden.
- Ambiguous “tomorrow” or “today” is interpreted relative to User timezone.

## CAL-010 Calendar disconnect

User must be able to disconnect Google Calendar.

Acceptance criteria:
- Future calendar reads and writes stop after disconnect.
- Existing Anchor memory derived from prior calendar context follows normal memory deletion/retention rules.
- User receives clear confirmation.
