---
description: "ADR-0010 — Anchor exposes a single API surface as Supabase Edge Functions consumed identically by the webapp and by Hermes; same-VPS deployment keeps invocation latency at loopback speed."
paths:
  - "../requirements/infrastructure-requirements.md"
  - "./0002-hermes-orchestrates-telegram-agent-communication.md"
  - "./0003-hostinger-vps-with-hermes-and-supabase-containers.md"
---

# Supabase Edge Functions as the Anchor↔Hermes API

Status: Accepted

The Anchor backend exposes one HTTP API surface implemented as Supabase Edge Functions (TypeScript, Deno). Both clients of this surface — the webapp browser and the Hermes orchestrator container — call the same endpoints; there is no separate "internal" backend service. Endpoints are versioned under `/functions/v1/<name>` and described by a hand-maintained `docs/api/openapi.yaml` that lives in the same repository as the Edge Function source, so the contract and the implementation evolve together. Both Hermes and the webapp pin against the OpenAPI document to generate clients; drift between client and server is caught at code-review time, not at runtime.

Same-VPS deployment (per ADR-0003) eliminates the cold-start latency that would normally disqualify Edge Functions from Hermes' tight turn-latency budget (NFR-005). Hermes calls Edge Functions over the loopback interface of the Hostinger VPS at sub-millisecond network cost; the Edge Function runtime stays warm because both Hermes and the webapp continuously exercise the same handlers. PostgREST is rejected as the direct interface for Hermes because it leaks the Postgres schema to a service that should depend on stable verbs, not table layouts; Edge Functions provide a stable contract layer above PostgREST. A separate Node/Fastify backend in the Hermes repo is rejected because it would duplicate auth, schema typing, and deployment surface for no clear gain at MVP scale.

Authentication uses two stacked factors for Hermes calls. The first factor is a Supabase service-role JWT held in the Hermes container environment; the second is an `x-hermes-secret` header that every Hermes-only Edge Function validates against a value also held in the Hermes environment and rotated independently. Edge Functions that the webapp may also call accept the User's session JWT instead; the service-role path is gated behind explicit handler-side checks so that the broader keys cannot accidentally execute User-only paths. Webapp calls flow through the standard Supabase JS client and inherit RLS for direct table reads; Edge Function calls bypass RLS by design and are responsible for authorization themselves.

Plan-state lookups happen on every Conversation Turn start but rarely change, so Hermes maintains an in-process per-`anchor_user_id` cache with a 30-second TTL. Stripe webhooks that change plan state (`customer.subscription.updated`, `customer.subscription.deleted`) call a dedicated `hermes-cache-invalidate` Edge Function which forwards the invalidation to Hermes, keeping Pro→Free transitions visible within seconds rather than the cache TTL. Usage increments (`turn-deliver`) are idempotent on `turn_id` so a Hermes retry after a transient Edge Function failure cannot double-charge minutes.

The initial endpoint inventory is: `auth-resolve-telegram`, `pairing-issue`, `pairing-redeem`, `turn-start`, `turn-deliver`, `turn-fail`, `plan-state`, `calendar-list`, `calendar-add`, `memory-recall`, `memory-store`, `diary-append`, `hermes-cache-invalidate`. Each handler is single-purpose and verb-named; CRUD-shaped composite endpoints are avoided so OpenAPI types stay narrow.

Out of scope for MVP: gRPC or any binary protocol, server-sent events or websockets from Hermes to webapp, public third-party API access to any of these endpoints, multi-region deployment, automatic OpenAPI client generation in CI (manual regeneration with PR review is sufficient at MVP scale).
