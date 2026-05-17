# Anchor Infrastructure Requirements

## Purpose

This document classifies the infrastructure Anchor needs and evaluates runtime isolation options. It does not commit to a final stack.

## Infrastructure layers

### INF-001 Webapp layer

The webapp must support:

- Registration and login.
- Onboarding.
- Telegram pairing.
- Google Calendar OAuth.
- Agent Settings.
- Trusted Contact setup if included.
- Account recovery flows.
- Optional diary/memory browsing later.

### INF-002 Agent runtime layer

Anchor must run one logical Anchor Agent per User.

The runtime must support:

- Telegram send/receive.
- Scheduled Morning Calendar Check-in.
- Scheduled Daily Check-in.
- Event Extraction.
- Memory extraction and recall.
- Calendar tools.
- Voice transcription.
- LLM provider calls.
- Per-user configuration and permissions.

### INF-003 Data layer

Anchor needs durable storage for:

- Anchor Accounts.
- User profile and settings.
- Telegram identity mapping.
- Google Connection token metadata and encrypted token material.
- Trusted Contacts and invitation state.
- Calendar Event links and Calendar Additions.
- Conversation Transcripts.
- Voice transcripts.
- Diary Entries.
- Memory Facts.
- Memory correction/update/deletion state.
- Context Map entities and relationships.
- Audit events.
- Usage counters.

### INF-004 Retrieval layer

Anchor needs retrieval over personal memory.

Capabilities:

- Date filtering.
- Full-text search.
- Semantic/vector search.
- Context Map traversal.
- Source Evidence retrieval.
- Recall Exclusion filtering.

### INF-005 Scheduling layer

Anchor needs reliable scheduling for:

- Morning Calendar Check-in.
- Evening Daily Check-in.
- Calendar reminders.
- Correction Reply Window expiry.
- Non-response Escalation windows if enabled.
- Retry of transient Telegram/Google/provider failures.

### INF-006 Integration layer

Required integrations:

- Telegram Bot API.
- Google Calendar API.
- LLM provider, likely OpenRouter initially.
- Speech-to-text for Telegram voice replies.
- Email delivery for Trusted Contact Invitations and recovery.

Potential integrations:

- Text-to-speech if Anchor sends voice messages later.
- Observability provider.
- Managed vector database or graph database.

### INF-007 Security and isolation layer

Anchor must enforce:

- Per-user data isolation.
- Per-user tool permission boundaries.
- OAuth token protection.
- Secret management.
- Audit logging for sensitive actions.
- Rate limits and usage budgets.
- Safe operational access to logs and transcripts.

### INF-008 Observability layer

Anchor needs visibility into:

- Agent runs.
- Telegram message delivery failures.
- Voice transcription failures.
- Google Calendar sync/write failures.
- LLM provider failures and fallback behavior.
- Scheduler execution.
- Retrieval failures.
- Usage budget state.

Observability must avoid unnecessary exposure of private memory content.

## Agent runtime options

### Option A: Per-user Docker container running Hermes Agent

Description:
- Registration provisions a standardized container per User.
- Container includes Hermes Agent, special `SOUL.md`, and Anchor skills.
- User state/config lives inside or mounted into that container.

Pros:
- Strong runtime isolation.
- Simple mental model: one User, one agent runtime.
- Easy per-user customization.
- Lower blast radius for tool/runtime bugs.

Cons:
- Operationally expensive.
- Many containers to schedule, update, monitor, migrate, and restart.
- Secrets, logs, backups, and upgrades become harder.
- Cold starts and idle cost may be bad.
- Harder to query fleet-wide health.

Best fit:
- Small beta where isolation matters more than cost.
- Users require custom toolchains or filesystem-level isolation.

### Option B: Shared multi-tenant agent service

Description:
- One webapp/backend runs agent workflows using per-user config/state.
- No always-on per-user container.

Pros:
- Simpler MVP operations.
- Cheaper at small and medium scale.
- Easier migrations and deployments.
- Easier observability.
- Easier to maintain shared prompt/skill versions.

Cons:
- Requires strong logical data isolation.
- Tool permissions must be carefully enforced.
- A runtime bug could affect multiple users if isolation is weak.

Best fit:
- MVP focused on product validation.
- Most SaaS-style deployments.

### Option C: Hybrid shared control plane with isolated worker jobs

Description:
- Webapp and database are shared.
- Agent runs execute in pooled or ephemeral workers.
- Workers may use containers for job-level isolation without one always-on container per User.

Pros:
- Good compromise between operations and isolation.
- Allows isolated execution for risky agent/tool runs.
- Avoids always-on container per User.
- Can scale workers independently.

Cons:
- More orchestration complexity than pure shared service.
- Requires job queue and worker lifecycle management.

Best fit:
- Strong MVP architecture if agent tools become risky.
- Better long-term path than per-user always-on containers.

## MVP recommendation

Do not make per-user Docker containers a product requirement yet.

Recommended MVP infrastructure:

- Shared webapp.
- Shared relational database.
- Worker queue for scheduled and asynchronous agent jobs.
- Per-user agent configuration/state.
- Centralized retrieval services.
- Strict application-level authorization and per-user data filtering.
- Optional isolated worker containers for agent runs if needed.

Treat “one Docker container per User running Hermes Agent” as an architecture hypothesis to validate, not a default requirement.

## Provisioning requirement

If per-user containers are later chosen, registration must trigger:

- Standard container image selection.
- User-specific config generation.
- Anchor `SOUL.md` installation.
- Anchor skills installation.
- Secret injection without writing secrets into images.
- Health check registration.
- Upgrade path for prompt/skill/runtime versions.

## Runtime artifacts

Future agent runtime package should include:

- Anchor `SOUL.md` generated from agent behavior requirements.
- Skill for calendar management.
- Skill for diary/memory management.
- Safety and privacy constraints.
- Tool allowlist.
- Model/provider configuration.

## ADR candidates

Create ADRs only after decisions are made:

- Agent runtime isolation model.
- Memory storage and retrieval model.
- Telegram-first interaction model.
- Calendar write without confirmation already has ADR 0001.
