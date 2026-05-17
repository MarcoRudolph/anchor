# Anchor Requirements

This directory contains the product and system requirements for Anchor.

Anchor is a Telegram-first second-brain webapp for older adults with memory difficulties. Requirements here describe what the product must do. Domain terminology lives in `docs/contexts/`.

## Documents

- [Product Requirements](./product-requirements.md)
- [MVP Scope](./mvp-scope.md)
- [User Journeys](./user-journeys.md)
- [Functional Requirements](./functional-requirements.md)
- [Agent Behavior Requirements](./agent-behavior-requirements.md)
- [Memory Requirements](./memory-requirements.md)
- [Calendar Requirements](./calendar-requirements.md)
- [Privacy and Safety Requirements](./privacy-safety-requirements.md)
- [Infrastructure Requirements](./infrastructure-requirements.md)
- [Non-Functional Requirements](./non-functional-requirements.md)
- [Open Questions](./open-questions.md)

## Source context

- `docs/contexts/user-identity/CONTEXT.md`
- `docs/contexts/agent-interaction/CONTEXT.md`
- `docs/contexts/memory/CONTEXT.md`
- `docs/contexts/calendar/CONTEXT.md`
- `docs/contexts/safety/CONTEXT.md`
- `docs/contexts/usage-limits/CONTEXT.md`
- `docs/adr/0001-calendar-additions-without-confirmation.md`

## Documentation rule

- Context docs own canonical language and relationships.
- Requirement docs own product behavior and acceptance criteria.
- ADRs own hard-to-reverse architecture decisions with real tradeoffs.
- If a requirement conflicts with context terminology, fix the context first.
