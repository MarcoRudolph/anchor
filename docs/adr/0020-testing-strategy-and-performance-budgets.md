---
description: "ADR-0020 — Anchor's quality stack is Vitest for unit/integration, Playwright for E2E, a custom LLM-judge harness for agent evals, and Lighthouse CI for performance budgets; mobile-first targets are LCP <2s on Slow-4G, INP <200ms, CLS <0.1, first-load JS <90 KB."
paths:
  - "../requirements/non-functional-requirements.md"
  - "../requirements/agent-behavior-requirements.md"
  - "../requirements/webapp-ui-ux-requirements.md"
  - "./0011-nextjs-on-vercel-with-tailwind-and-shadcn.md"
  - "./0018-operator-surface-via-supabase-studio-and-three-observability-vendors.md"
---

# Testing strategy and performance budgets

Status: Accepted

## Testing

Anchor uses a three-layer test stack.

**Vitest** handles unit and integration tests for Edge Functions, Next.js Server Actions, and Hermes business logic. The coverage target is 70% of the critical paths: Plan-State transitions, Conversation Minute accounting (ADR-0009), Pairing Code lifecycle (ADR-0007), Stripe webhook handling and reconciliation (ADR-0016), Magic Link issuance and consumption (ADR-0006), Google OAuth token refresh and disconnection (ADR-0008). UI snapshot tests are explicitly out of scope — they over-trigger on harmless markup changes and add noise without catching real regressions. Integration tests for Edge Functions run against an ephemeral local Supabase instance booted via the Supabase CLI in CI; each test file gets a fresh schema seeded from migrations.

**Playwright** runs eight to ten end-to-end User journeys against the Vercel preview deployment of each PR: complete signup with Magic Link, Onboarding Wizard with Telegram Pairing simulated via a stub bot, Google Calendar connect with a recorded OAuth fixture, Pro upgrade through Stripe Checkout in Test Mode, daily-minute limit hit and the resulting Gentle Limit Notice surface, Telegram Re-Pairing with security email confirmation, Trusted Person Recovery end-to-end. The Playwright suite is the gate for merging to `main`; failures block.

**Agent Eval Harness** is custom and addresses the part of Anchor that conventional testing cannot cover: whether the Anchor Agent's memory recall, calendar interpretation, and limit-aware behavior are correct. Each eval is a JSON fixture `{ user_state, message, expected_behavior_tags, forbidden_behavior_tags }`. The harness runs the agent against the fixture in a sandboxed Hermes instance, captures the response, and submits the response plus the expected tags to an LLM judge (Claude 3.5 Sonnet, separate API key from production) which scores adherence. Two categories cover MVP: memory-recall quality (ABR-040) and limit-explanation behavior (ABR-051, ADR-0009). Marco spot-checks 10% of judge verdicts weekly to catch judge drift. Aggregated scores are tracked in CI; a regression of more than 5 percentage points on any rubric dimension blocks the PR.

User Acceptance Testing is manual. Before any production deploy that touches a User-facing feature, the operator works through the relevant checklist in `docs/uat/<feature>.md` and signs off in the deploy PR. This is the final human gate on the elderly-User UX promises that automation cannot verify.

## Performance budgets

Targets are mobile-first and assume older Android hardware on a Slow-4G connection (the realistic floor for the target audience).

- **LCP** under 2.0 seconds on Slow-4G throttling.
- **INP** under 200 ms at the 75th percentile.
- **CLS** under 0.1.
- **First-Load JS** under 90 KB gzipped on landing-page routes; under 150 KB on authenticated account routes.
- **Lighthouse** ≥ 90 mobile and ≥ 95 desktop across all five categories on every public route.

**Lighthouse CI** runs against the Vercel preview deployment of every PR and fails the build on regression beyond the budgets above. **`@next/bundle-analyzer`** runs locally on demand; PRs that grow first-load JS by more than 5% require a written justification in the description.

Font loading is `next/font/google` with `display: 'swap'` and `preload: true`, weight 900 only — Unbounded ships exactly one weight per the brand system (DESIGN.md). Images use `next/image` with AVIF output, hero images target under 100 KB after conversion, and everything below the fold lazy-loads. Routes that risk Tailwind class explosion (the funnel landing pages) compile with the `purge` allowlist tightened to the routes' own components.

## Out of scope for MVP

Load tests against the production target, accessibility regression CI (manual Lighthouse a11y category is the gate), visual regression tooling (Chromatic/Percy), contract tests between Edge Functions and Hermes (the OpenAPI document is the gate per ADR-0010), property-based testing, chaos engineering, performance monitoring of the agent eval LLM judge beyond Marco's spot checks.
