# Anchor Non-Functional Requirements

## NFR-001 Reliability

Anchor should reliably send scheduled check-ins and reminders.

Acceptance criteria:
- Scheduler failures are retried or surfaced to operators.
- Missed check-in jobs are detectable.
- Calendar write failures produce clear recovery behavior.

## NFR-002 Privacy

Anchor stores highly sensitive personal data and must minimize unnecessary exposure.

Acceptance criteria:
- User memory, diary, transcripts, and calendar data are isolated per User.
- Logs avoid unnecessary private content.
- Sensitive token material is encrypted or stored in managed secret infrastructure.

## NFR-003 Security

Anchor must protect accounts, integrations, and recovery flows.

Acceptance criteria:
- Web sessions can be revoked.
- Password reset never reveals existing passwords.
- Trusted Contacts have least privilege.
- OAuth tokens are protected.

## NFR-004 Accessibility

Anchor must be usable by older adults with memory difficulties.

Acceptance criteria:
- Webapp flows use plain language.
- UI avoids dense forms where possible.
- Mobile use is supported.
- Telegram voice input works for core flows.

## NFR-005 Latency

Anchor should feel conversational.

Initial targets:
- Telegram text response: typically under 10 seconds.
- Voice transcription plus response: typically under 20 seconds.
- Calendar writes: acknowledge success/failure promptly.

These are targets, not contractual guarantees.

## NFR-006 Cost control

Anchor must control LLM and transcription cost.

Acceptance criteria:
- Message Size Limit is enforced.
- Conversation Budget is enforced across Rolling Usage Windows.
- Agent jobs should avoid unnecessary long-context calls.
- Retrieval should narrow context before LLM calls.

## NFR-007 Observability

Operators must be able to diagnose failures without exposing unnecessary private data.

Acceptance criteria:
- Message delivery failures are logged.
- Calendar sync/write failures are logged.
- Agent run failures are logged.
- Recovery and deletion actions are auditable.
- Logs redact secrets and avoid full transcript dumps by default.

## NFR-008 Data retention and deletion

Anchor must distinguish operational retention from user-facing memory.

Acceptance criteria:
- Recall Exclusion prevents normal recall and summaries.
- Retained backup/legal/debug copies are outside Anchor memory.
- Retention policies are documented before production launch.

## NFR-009 Scalability

Anchor should support growth from private beta to early production without rethinking all architecture.

Acceptance criteria:
- Initial architecture supports at least tens to hundreds of Users.
- Agent job processing can scale horizontally.
- Per-user always-on containers are not assumed unless chosen by ADR.

## NFR-010 Portability

Anchor should avoid unnecessary provider lock-in during MVP.

Acceptance criteria:
- LLM provider is configurable.
- Speech-to-text provider is replaceable.
- Calendar integration can be isolated behind a service boundary.

## NFR-011 Safety communication

Safety limits must be visible and plain.

Acceptance criteria:
- Emergency Boundary is shown where relevant.
- Limit notices are gentle and non-technical.
- Non-response Escalation is not described as emergency response.

## NFR-012 Testability

Requirements should map to automated or manual tests.

Acceptance criteria:
- Functional requirements have stable IDs.
- Core agent behaviors have evaluation scenarios.
- Calendar write and memory deletion flows have explicit acceptance criteria.
