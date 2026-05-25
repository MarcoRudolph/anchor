---
description: "ADR-0019 — All scheduled jobs run as pg_cron entries inside Supabase Postgres; Hermes-side timing is triggered by pg_cron calling Edge Functions over HTTP, missed runs are skipped not catch-up replayed."
paths:
  - "../requirements/infrastructure-requirements.md"
  - "../requirements/functional-requirements.md"
  - "./0010-supabase-edge-functions-as-anchor-hermes-api.md"
  - "./0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md"
  - "./0016-stripe-operations-customer-lifecycle-webhooks-vat.md"
---

# Scheduling via pg_cron in Supabase

Status: Accepted

All scheduled jobs are pg_cron entries in the self-hosted Supabase Postgres. The scheduling surface is one table (`cron.job`) seeded by a SQL migration; jobs that need to act outside the database call an Edge Function via PostgREST (`SELECT net.http_post(...)`), and the Edge Function performs the work. Hermes does not run its own cron. Time-driven Hermes actions — composing the Morning Calendar Check-in, sweeping for stale paired Telegram sessions, retrying buffered Pending Calendar Additions — are triggered by pg_cron calling a dedicated Edge Function that in turn forwards to Hermes through the existing HTTP surface (ADR-0010). Centralizing the schedule in one system makes job inventory, on/off toggling, and timezone semantics legible from one place.

Scheduled job inventory at MVP:

- `daily-morning-checkins` — every minute, finds Users whose configured check-in time matches their local now() and dispatches to Hermes.
- `stripe-reconcile-hourly` — top of every hour, compares Stripe subscription state to local state (ADR-0016).
- `google-connection-weekly-ping` — daily at 03:00 UTC, sweeps active Google Connections in batches (ADR-0008).
- `email-bounce-decay` — daily at 03:30 UTC, clears `email_bounced_at` markers older than 24 hours so the User can re-attempt Magic Link delivery (ADR-0017).
- `pairing-code-expire` — every 5 minutes, deletes Pairing Codes whose TTL has elapsed (ADR-0007).
- `pending-calendar-flush` — every 15 minutes, processes Pending Calendar Additions on reconnected Google Connections, drops anything older than 7 days with an audit entry.
- `audit-anonymize-monthly` — first of each month, anonymizes `audit_event` and `agent_cost_log` rows older than 12 months (ADR-0013).
- `operator-digest-daily` — daily at 07:00 Europe/Berlin, composes the operator status email (ADR-0018).

Cold-start behavior after a VPS reboot: pg_cron resumes automatically from the next scheduled tick; missed runs are not catch-up replayed. The exceptions are time-sensitive User-facing jobs (Morning Calendar Check-in): if the User's expected tick falls inside an outage window of less than one hour, the next-eligible tick fires with a `delayed_recovery=true` flag in the Hermes log entry so the operator can spot pattern outages. Beyond one hour of delay the run is dropped and audit-logged; replaying a 09:00 check-in at 14:00 would be more disorienting than helpful.

Idempotency is the job's responsibility, not pg_cron's. Each job's Edge Function or stored procedure begins with a guard query (`WHERE last_run_at < tick_window` or an idempotency-token check) so that a double-fire from a manual retest does not double-act. Long-running jobs (anonymization sweep, batch ping) wrap their work in `SELECT pg_try_advisory_lock(<job_id>)` to prevent overlap if a prior run is still executing when the next tick arrives.

Out of scope for MVP: distributed schedulers (Temporal, Inngest), Hermes-local job systems (BullMQ), exact catch-up replay of missed User-facing jobs, second-precision scheduling, dynamic per-User cron expressions beyond the configured morning check-in time.
