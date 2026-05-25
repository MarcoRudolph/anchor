---
description: "ADR-0008 — Anchor requests the single Google OAuth scope `calendar.events`, encrypts refresh tokens at rest, detects External Revocation lazily plus a weekly ping, and buffers Pending Calendar Additions during disconnection."
paths:
  - "../contexts/calendar/CONTEXT.md"
  - "../requirements/functional-requirements.md"
  - "./0001-calendar-additions-without-confirmation.md"
---

# Google Calendar OAuth scope and token lifecycle

Status: Accepted

Anchor requests exactly one Google OAuth scope: `https://www.googleapis.com/auth/calendar.events`. This scope permits reading and writing Calendar Events on the User's primary calendar but exposes no calendar settings, sharing, ACLs, or other calendars. The narrower `calendar.readonly` is insufficient because ADR-0001 requires Anchor to write Calendar Additions; the broader `calendar` (full) scope is rejected because it triggers Google's restricted-scope CASA Tier 2/3 compliance (penetration testing, annual audit, ongoing cost) without proportional product value. `calendar.events` is a sensitive scope and requires Google Brand Verification and Security Assessment before production traffic from external Google users; this verification is started in parallel with MVP development, not after, because it has a 6–16 week turnaround. Until verification completes Anchor runs in OAuth Testing Mode with manually added testers, which matches the pilot scope (NFR-009).

Refresh tokens are stored in Supabase in an encrypted column (envelope encryption via `pgcrypto`; column key wrapped by a master key held in the Hermes container environment and rotated manually on a half-yearly cadence). Cleartext refresh tokens never appear in logs, backups, or process memory beyond the immediate API call. Access tokens are not persisted; they are obtained on demand from the refresh token and held only in memory for the lifetime of the request.

External Revocation — User revokes at myaccount.google.com, the refresh token hits the 6-month inactivity expiry, or a Google security event invalidates the grant — is detected two ways. **Lazy detection**: every Calendar API call that returns `invalid_grant` or `401 unauthorized` transitions the Google Connection State to `disconnected_external` and logs an audit event. **Proactive detection**: a weekly scheduled job pings `calendar.calendarList.list` (page size 1) for every Anchor Account whose Connection State is `connected`; failures transition state identically. The weekly ping costs roughly one API call per active User per week, far below Google's quota.

During `disconnected_external`, the Anchor Agent omits the calendar block from Morning Calendar Check-ins and substitutes a recovery prompt referencing the Re-Consent Flow. Calendar Additions the Agent would have written are buffered as Pending Calendar Additions for up to 7 days; on reconnection they are flushed in order, on timeout they are dropped with an audit log entry naming the dropped intent. The webapp `/account` view shows the Google Connection State and exposes a one-click Re-Consent Flow button. The Re-Consent Flow uses the same scope and adds `access_type=offline` and `prompt=consent` to the authorization URL so Google issues a fresh refresh token rather than reusing the prior grant.

Out of scope for MVP: multi-calendar selection (Anchor uses the User's primary calendar), reading from non-Google calendars, calendar sharing or invitee handling, automatic re-consent without User interaction, recovery of dropped Pending Calendar Additions after 7 days.
