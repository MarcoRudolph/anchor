---
description: "ADR-0018 — During pilot scale the operator surface is Supabase Studio plus audited stored procedures; observability is split across Sentry (errors), Axiom (structured logs), and Better Stack (uptime), with a defined alerting policy."
paths:
  - "../requirements/non-functional-requirements.md"
  - "../requirements/infrastructure-requirements.md"
  - "../requirements/product-requirements.md"
  - "./0013-database-foundation-plain-sql-migrations-drizzle-uuidv7.md"
---

# Operator surface and observability

Status: Accepted

## Operator surface

During the pilot phase (tens to low hundreds of Users, per NFR-009) Anchor does not ship a dedicated admin webapp. The operator surface is Supabase Studio against the self-hosted instance, gated behind the operator's VPS-level credentials and an IP allowlist. Routine operator actions that change User-visible state — account deletion (GDPR Article 17), unsticking a stalled pairing, marking a Trusted Person as compromised — are not performed as ad-hoc `DELETE` or `UPDATE` statements in Studio. They are wrapped in `SECURITY DEFINER` Postgres functions named `op_<verb>_<noun>(...)` (`op_delete_anchor_user`, `op_reset_pairing`, `op_revoke_trusted_person`) that perform the change and write an `operator_action_log(actor, action, target_anchor_user_id, payload, occurred_at)` row in the same transaction. Convention: every mutation against User data must go through one of these functions; raw `DELETE`/`UPDATE` on User tables is reserved for schema migrations only. This gives a complete audit trail without a UI investment that the pilot scale does not warrant.

A dedicated admin webapp becomes worth building when active User count reaches roughly 200 or when more than one operator exists. The deferred design is a Next.js route group `/admin/*` on the same Vercel deployment, behind Magic Link login plus an `app_config.admin_emails` allowlist check, calling the same `op_*` stored procedures as the manual path. No custom auth, no separate deployment.

Stripe-side operator work (refunds, dunning intervention) is handled in the Stripe Dashboard directly per BPR-010; mirrored side effects in Anchor (e.g. marking an account refunded) happen automatically through the webhook idempotency path defined in ADR-0016. User-support correspondence runs through `kontakt@anchor.com` for the pilot.

## Observability

Three observability tools are stood up, each scoped to one concern.

**Sentry** captures unhandled errors and slow transactions on both the Next.js webapp and the Hermes Node service via `@sentry/nextjs` and `@sentry/node`. Source maps upload on every Vercel deploy and on Hermes container build. Sentry's Performance Monitoring covers Core Web Vitals on the marketing pages and Hermes' LLM-call latency distribution; a dedicated APM/OpenTelemetry pipeline is deferred. Sentry's free tier (5,000 errors/month) covers pilot scale.

**Axiom** captures structured JSON logs from Edge Functions and from Hermes via `axiom-js`. Logs use a fixed schema with `anchor_user_id`, `request_id`, `service`, `event`, plus per-event fields. Schema-on-read lets the operator filter by `anchor_user_id` to inspect one User's recent activity without joining anything. The free tier (~0.5 GB/month) is sufficient at pilot scale; the JSON schema is the contract, so swapping Axiom for Logtail, Better Stack Logs, or self-hosted Loki later is a config change.

**Better Stack Uptime** runs synthetic checks every 60 seconds against `https://anchor.com/api/health` (covers Vercel + Edge Function + Supabase reachability), the Stripe webhook endpoint (HEAD only, returns 405 — confirms the route is wired), and the Hermes `/health` endpoint on the VPS. The free tier (10 monitors) covers MVP.

The `/api/health` response is the JSON `{ supabase: 'ok'|'fail', last_stripe_webhook_age_s: number, last_hermes_heartbeat_age_s: number, version: string }`. Hermes posts a heartbeat row to `service_heartbeat` every 30 seconds; the webapp reads that table for the value above. A heartbeat older than 90 seconds fails the health check.

## Alerting

Alerts go to Marco's email and (later) Telegram, with severity levels:

- P1 (page-now): three consecutive Stripe webhook delivery failures from Stripe, uptime check failing >2 minutes, Sentry issue firing >10 events/hour.
- P2 (next-business-hour): reconciliation finding more than 5 drift cases per hour, voice-provider failure rate >20% over 10 minutes (the fallback is already active automatically, so this is awareness, not action).
- Digest: a daily 09:00 Europe/Berlin email with active Users, new signups, Pro conversions, projected cost burn, and the top three Sentry issues by event count.

Retention: Sentry 30 days, Axiom 30 days, `operator_action_log` and `audit_event` 12 months then anonymized per ADR-0013.

## Out of scope for MVP

A custom admin webapp, a full APM/distributed-tracing pipeline, paging via PagerDuty, on-call rotation, status-page automation (a static `status.anchor.com` may be added if and when it becomes useful), log-volume alerting, anomaly detection on usage patterns, a self-service operator dashboard for non-engineering staff.
