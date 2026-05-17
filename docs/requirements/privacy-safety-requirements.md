# Anchor Privacy and Safety Requirements

## Purpose

Anchor stores sensitive personal conversations, memory, calendar data, and recovery information. Privacy and safety boundaries must be explicit.

## PSR-001 Non-clinical framing

Anchor must present itself as non-clinical.

Acceptance criteria:
- Product copy uses User, not Patient.
- In-app copy avoids dementia unless specifically in allowed help/legal/safety contexts.
- Anchor does not claim to diagnose, treat, monitor, or provide medical care.

## PSR-002 Emergency Boundary

Anchor must make clear it is not an emergency service.

Acceptance criteria:
- Safety-sensitive UI includes an Emergency Boundary.
- Non-response Escalation is described as optional contact notification only.
- Anchor does not promise urgent intervention.

## PSR-003 Consent Boundary for Trusted Contacts

External contact notification requires User consent.

Acceptance criteria:
- Trusted Contacts must be invited and verified.
- Non-response Escalation requires explicit enablement.
- Trusted Contacts do not receive default diary/calendar access.

## PSR-004 Trusted Contact least privilege

Trusted Contacts are fallback contacts, not caregivers or account members.

Acceptance criteria:
- Trusted Contact cannot read diary by default.
- Trusted Contact cannot read calendar by default.
- Trusted Contact cannot delete, hide, or confirm deletion of memory content.
- Assisted Password Reset gives no lasting login ability.

## PSR-005 Password safety

Recovery flows must never disclose existing passwords.

Acceptance criteria:
- Password recovery creates or resets credentials.
- Existing password is never emailed, displayed, or revealed.
- Assisted Password Reset revokes active web sessions.

## PSR-006 Sensitive recovery data

User Birthdate and User Zipcode are sensitive matching factors, not standalone secrets.

Acceptance criteria:
- User Birthdate is required when first Trusted Contact is added.
- User Zipcode is required when first Trusted Contact is added.
- User Zipcode is stored separately from full address data.
- User Zipcode is requested from Trusted Contact only when needed for disambiguation.

## PSR-007 Memory deletion

User deletion requests must remove content from normal recall.

Acceptance criteria:
- Deleted content enters Recall Exclusion.
- Deleted content does not appear in normal recall, summaries, or Context Map traversal.
- If retained for backup, legal, abuse prevention, or debugging, retained copies are outside Anchor memory.

## PSR-008 Source evidence privacy

Source Evidence must be protected as sensitive personal data.

Acceptance criteria:
- Access is limited to the User's account and authorized system processing.
- Debugging and logs avoid unnecessary transcript exposure.
- Source references shown to the User are human-readable and minimal.

## PSR-009 OAuth token security

Google Connection token material must be protected.

Acceptance criteria:
- Tokens are encrypted at rest or stored in a managed secret store.
- Tokens are scoped to required calendar permissions.
- Disconnect removes or invalidates stored token material where possible.

## PSR-010 Telegram data handling

Telegram identities and message content must be treated as sensitive.

Acceptance criteria:
- Telegram identity maps to exactly one Anchor Account.
- Voice transcripts are treated like message content.
- Message logs are not exposed to Trusted Contacts by default.

## PSR-011 Limit notices preserve trust

Usage and safety limits must be explained gently.

Acceptance criteria:
- No provider quota language.
- No punitive tone.
- User is told when they can continue if known.

## PSR-012 Auditability

Sensitive actions must be auditable.

Acceptance criteria:
- Recovery attempts are logged.
- Password resets are logged.
- Memory deletion confirmations are logged.
- Google connect/disconnect events are logged.
- Logs avoid storing unnecessary secret or transcript content.
