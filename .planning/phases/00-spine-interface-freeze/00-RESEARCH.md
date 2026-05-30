---
description: "Phase 0 (Spine & Interface Freeze) research — setup/versions/config/pitfalls for the locked Anchor + Hermes spine: Next.js + next-intl, self-hosted Supabase (Postgres + Edge Functions + Realtime), plain SQL migrations + Drizzle, magic-link auth, the 13-endpoint contract, Telegram pairing, and CI gates."
paths:
  - "../../ROADMAP.md"
  - "../../PROJECT.md"
  - "../../../docs/adr"
---

# Phase 0: Spine & Interface Freeze - Research

**Researched:** 2026-05-30
**Domain:** Greenfield full-stack scaffold + cross-context interface freeze (Next.js webapp on Vercel; self-hosted Supabase Postgres + Edge Functions + Realtime on a Hostinger VPS; Drizzle-as-query-layer over plain SQL migrations; magic-link auth; Telegram bot pairing via a Hermes Docker container; Vitest/Playwright/Lighthouse CI)
**Confidence:** HIGH on architecture + versions; MEDIUM on a few self-hosted-Supabase operational specifics. Domain/architecture are fully specified by 22 ADRs + requirements + contexts (all read this session). **All package versions are registry-VERIFIED** (`npm view`, 2026-05-30). Two ADR-vs-reality version gaps were found and are flagged below.

> **CRITICAL version findings for the planner (registry-verified 2026-05-30):**
> 1. **`next` is at 16.2.6**, not 15.x. The ADRs say "Next.js 15"; **Next 16 is current**. The decision (App Router on Vercel) is unaffected, but **Next 16 renamed `middleware.ts` → `proxy.ts`** [CITED: nextjs.org/docs/app/guides/upgrading/version-16] — the next-intl middleware now lives in `src/proxy.ts`. Confirm in `/gsd-discuss-phase` whether to pin Next 16 (recommended — 15 is a major behind) or hold at 15. **This is the one decision that changes scaffold tasks.**
> 2. **`next-intl` is at 4.13.0** (not v3). The v4 App-Router API uses `next-intl/middleware` `createMiddleware(routing)` + a `routing` object + `i18n/request.ts` `getRequestConfig` with `requestLocale`/`hasLocale` [CITED: next-intl.dev/docs/getting-started/app-router]. The middleware file is `proxy.ts` on Next 16 (next-intl docs note: "proxy.ts was called middleware.ts up until Next.js 16").
> 3. **`tailwindcss` is at 4.3.0** — Tailwind 4 is **CSS-first** (no `tailwind.config.js` by default; theme via `@theme` in CSS). `shadcn` CLI is at **4.8.3** and supports Tailwind 4. Scaffold tasks must use the v4 flow, not v3 tutorials.
>
> Other versions are current-major and the choices are ADR-locked; pin the exact verified versions from the Standard Stack table.

---

## Summary

Phase 0 is a **single sequential foundation pass** that scaffolds two empty deployables and freezes the three interfaces every later wave depends on: (1) the cross-context Postgres schema, (2) the 13-endpoint Supabase Edge Function contract (`docs/api/openapi.yaml`), and (3) one Google-token-lifecycle module. The exit gate is a thin end-to-end slice (UJ-002): webapp login → show pairing code → user redeems it in the shared Telegram bot → Hermes calls the `pairing-redeem` edge function → webapp flips to "connected" via Supabase Realtime. That one slice exercises both repos, the edge-function seam, RLS, and Realtime simultaneously — it is the cheapest proof that the architecture holds.

The stack is **fully locked by ADRs** — the researcher's job is *correct setup/config/version/pitfall* guidance, not technology selection. **Versions are registry-verified (2026-05-30):** the one surprise vs. the ADRs is that **Next.js is at 16.2.6 (ADRs say "15")**, and Next 16 renamed `middleware.ts → proxy.ts` with next-intl now on v4 and Tailwind on v4 (CSS-first) — these change the *scaffold* tasks but not the architecture (recommend pinning Next 16; see A1). The dominant *risk* is **self-hosted Supabase**, not Supabase Cloud: Edge Functions (Supabase flags self-hosted Edge as **beta**), Realtime, and `auth.users` behave the same logically, but you operate the Deno edge-runtime container (`supabase/edge-runtime` image), the Realtime container, pg extensions (`pg_uuidv7`, `pgcrypto`, `pg_cron`, `pg_net`, `vector`), JWT secrets, and `psql` migration application **yourself**. The second-biggest risk is the **reversed Drizzle workflow** (SQL is the source of truth; `drizzle-kit pull` introspects → generates `schema.ts`; you never run `drizzle-kit push`/`generate` from TS schema). The third is the **two-tier seam auth** (webapp = user session JWT through RLS; Hermes = service-role JWT + `x-hermes-secret` bypassing RLS, where the handler is responsible for authorization). Get those three right in Phase 0 and the waves are safe.

**Primary recommendation:** Scaffold as a **single-repo layout** (Anchor app + `supabase/` + Hermes as a tagged sibling that scaffolds when its work runs), apply the **frozen DDL via `psql` first**, then `drizzle-kit pull` to generate `src/db/schema.ts`, then build the 13 edge functions as **typed stubs that return contract-shaped fixtures** gated by the two-tier auth, write `docs/api/openapi.yaml` by hand to match, and prove the seam with the UJ-002 Playwright journey + a stub Telegram bot before declaring the freeze.

---

<user_constraints>
## User Constraints (from ADRs / PROJECT.md — no CONTEXT.md exists for this phase yet)

> No `.planning/phases/00-spine-interface-freeze/*-CONTEXT.md` exists (this phase has not been through `/gsd-discuss-phase`). The binding constraints are therefore the LOCKED ADR decisions (DEC-0005..0022 Accepted) plus the four proposed-but-depended-on foundations (DEC-0001..0004). Treat these as locked decisions for planning purposes.

### Locked Decisions (ADR-Accepted — research THESE, not alternatives)

- **DEC-0011** Next.js App Router on Vercel; Tailwind + shadcn/ui (source-in-repo, no runtime dep); magic-ui for motion; Unbounded display font via `next/font/google` (weight 900, `display:swap`, `preload`); Flower-of-Life icon + `spin-slow` keyframe as local component/CSS. *(ADR says "Next 15"; registry-current is Next 16 — see CRITICAL findings + A1.)*
- **DEC-0012** i18n via `next-intl`; German (`de`) authoritative, English (`en`) secondary; **subpath routing** `/de /en`; bare `/` → `/de`; `NEXT_LOCALE` cookie sticks choice; message catalogs `messages/<locale>/<namespace>.json`; **custom `scripts/i18n-check.ts` key-parity gate fails CI**; `i18n-unused` check warns (PR comment, non-blocking); ICU syntax only; `useFormatter()` for dates/numbers; brand wordmark `anchor` never in a locale file.
- **DEC-0013** Self-hosted Supabase Postgres on Hostinger VPS; **schema = plain SQL migrations** under `supabase/migrations/<timestamp>_<name>.sql`, applied with `psql -f` in lexical order via `pnpm db:migrate` (Supabase CLI optional, off the critical path); **Drizzle is query layer only** — `drizzle-kit pull` introspects live schema → emits `src/db/schema.ts`; **UUIDv7 PKs** via `pg_uuidv7` extension (`uuid_generate_v7()` default); **`anchor_user.id = auth.users.id`** (FK with `ON DELETE CASCADE`, no indirection); RLS `auth.uid() = anchor_user_id`. Prisma rejected. Hard-delete cascade for GDPR Art.17; `memory_fact`/`diary_entry` add `deleted_at` soft-delete for Recall Exclusion.
- **DEC-0010** Single Supabase **Edge Functions (Deno/TypeScript)** API surface, **13 endpoints**, consumed identically by webapp and Hermes; versioned `/functions/v1/<name>`; hand-maintained `docs/api/openapi.yaml` lives with the source; **webapp calls with user session JWT (inherits RLS for direct table reads)**; **Hermes calls with service-role JWT + `x-hermes-secret`** (bypasses RLS by design, handler does its own authz); Hermes↔Edge calls over VPS **loopback** (warm, sub-ms). The 13: `auth-resolve-telegram`, `pairing-issue`, `pairing-redeem`, `turn-start`, `turn-deliver`, `turn-fail`, `plan-state`, `calendar-list`, `calendar-add`, `memory-recall`, `memory-store`, `diary-append`, `hermes-cache-invalidate`.
- **DEC-0006** Passwordless **magic-link** auth (single-use, short TTL, HttpOnly session cookie on the opening device); **no password, no PIN, no password reset**; new devices repeat magic link; recovery = **Trusted Person** flow (birthdate + zipcode tiebreak → recovery link → assisted email rebind → new magic link), revokes web sessions, keeps Telegram/Google intact. 2FA deferred.
- **DEC-0007** **Single shared** Anchor Telegram Bot; **8-char Crockford-Base32** pairing code (`0-9A-HJKMNP-TV-Z`, omit I/L/O/U), **single-use, 15-min TTL**, bound to issuing account; deep link `https://t.me/<bot>?start=<code>`; `/start <code>` consumes; issuance rate-limited **5/hour/account**; Telegram pairing is a **hard onboarding prerequisite** before Checkout/agent surface; unpaired accounts deleted after 90 days.
- **DEC-0015** Supabase **Realtime** on RLS-scoped rows (subscribe to `anchor_user WHERE id = auth.uid()` + per-user related rows); **30s polling fallback** shares the same query results; UI never shows "Pro aktiv" / "connected" before the DB row reflects it; teardown via `useEffect` cleanup on route change; mobile-Safari re-subscribe + catch-up fetch on focus.
- **DEC-0020** CI gates: **Vitest** (≥70% critical-path; integration tests vs ephemeral local Supabase booted by CLI in CI; UI snapshot tests out of scope), **Playwright** (8–10 E2E journeys = merge gate to `main`; Telegram pairing simulated via stub bot), **Lighthouse CI** (LCP<2.0s Slow-4G, INP<200ms p75, CLS<0.1, first-load JS <90KB landing / <150KB account, Lighthouse ≥90 mobile/≥95 desktop), Agent Eval Harness (Phase 3/4 — not Phase 0).
- **DEC-0003** Single Hostinger VPS runs Hermes + Supabase as **separate Docker containers**; per-user isolation is an app/DB authorization concern, not a container boundary.
- **DEC-0002** Hermes orchestrates Telegram conversation/voice/skills; Anchor backend owns state/permissions/memory; webapp/backend must not duplicate agent conversation logic.
- **DEC-0008** (Google token module to freeze) single scope `calendar.events`; refresh tokens **envelope-encrypted via `pgcrypto`**, column key wrapped by a master key in the Hermes env (manual half-yearly rotation); access tokens never persisted; lazy + weekly-ping revocation detection; `disconnected_external` state; Re-Consent uses `access_type=offline&prompt=consent`.
- **DEC-0016 / DEC-0005** Stripe Customer created at magic-link verification (`stripe.customers.create({email, metadata:{anchor_user_id}})` → write `stripe_customer_id`); Price IDs in `app_config(key,value,env)` table; webhooks idempotent on event-id; `anchor_user_plan` mirror; single €10/mo Pro. (Stripe *handlers* are Phase 1/2; the **`anchor_user_plan` + `app_config` + customer-at-signup hooks belong to the frozen schema** in Phase 0.)
- **DEC-0017** Transactional email via **Resend** + React Email; DKIM/SPF/DMARC; bounce gating via `email-bounce` edge fn + `anchor_user.email_bounced_at`; magic-link send rate-limited 3/hour/email. (Magic-link delivery is needed for the Phase 0 auth slice.)
- **DEC-0019** pg_cron jobs call edge functions via `net.http_post`; `pairing-code-expire` (every 5 min) is the Phase-0-relevant job; idempotency is the job's responsibility (`pg_try_advisory_lock`).
- **DEC-0004** Domain-specific memory index with real FKs + single-source CHECK constraint (DDL must be **frozen** in Phase 0 even though memory logic is Phase 2).

### Claude's Discretion

- Repo layout (single repo vs. workspace), exact folder names under `src/`, stub fixture shapes, the precise local-dev orchestration (Supabase CLI vs. hand-rolled docker-compose for the VPS), and how the Hermes skeleton is wired (Node/TS framework choice for the webhook receiver — ADRs don't pin Hermes' internal framework).
- Whether to use `@supabase/ssr` for the Next.js auth/session cookie wiring (recommended — see Standard Stack).
- Whether the Phase-0 Telegram bot is the real shared bot in test mode or a stub; ADR-0020 says Playwright simulates pairing via a **stub bot**, so the stub is the CI path and the real bot proves the slice once.
- **Whether to pin Next 16 or hold at Next 15 (A1)** — recommend 16; it changes the middleware filename (`proxy.ts`) and a few APIs but nothing architectural.

### Deferred Ideas (OUT OF SCOPE for Phase 0)

- Any **feature logic** behind the frozen seams: real memory extraction/recall, real calendar read/write, real Stripe Checkout/Portal flows, real voice transcription, real check-ins, trusted-person recovery UI, landing/AEO pages, compliance/legal pages, operator surface. These are Waves 1–4. Phase 0 freezes their **schema + contract + token module** and ships **stubs**, not behavior.
- Agent Eval Harness (Phase 4). Per-user containers (deferred entirely). Read replicas / multi-region / automatic OpenAPI client gen in CI (ADR out-of-scope).
- The ship-blockers (legal prose, USt-IdNr, minute caps, recall threshold, scale freeze) — none gate Phase 0; they gate Phase 4/launch. **Exception:** `app_config` keys (`free_daily_minutes`, `pro_daily_minutes`, price IDs) should exist as a *table* in the frozen schema with placeholder rows, so later phases write values not migrations.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **REQ-mvp-scope** [A+H] | MVP delivers the in-scope set and ships nothing out-of-scope. | Phase 0 proves the *delivery vehicle* (both deployables + seam) and freezes schema/contract so in-scope features can be built and out-of-scope creep is structurally blocked (one owner per context, frozen interfaces read-only to feature agents). Architecture map + Standard Stack + Don't-Hand-Roll below. |
| **REQ-user-journeys** [A+H] | UJ-001..013 complete with acceptance criteria. | Phase 0 fully implements **UJ-002 (Telegram pairing)** as the thin E2E slice and lays the foundation (account, magic-link login = UJ-001 partial; pairing code lifecycle; realtime connection state) the other journeys build on. Pairing code spec (DEC-0007), Realtime spec (DEC-0015), and the pairing E2E test map are in Validation Architecture. |
| **REQ-functional** [A+H] | FR-001..081; the **account/identity/edge-fn/i18n/CI backbone** is anchored to Phase 0. | Phase-0 backbone FRs: **FR-001** (account registration), **FR-002** (login — adapted: magic link, no password), **FR-010** (Telegram pairing), **FR-070** (`anchor_user_plan` mirror — schema + free-at-signup), **FR-071** (Stripe webhook *endpoint* shape, idempotency table — handler logic deferred), **FR-080/081** (locale support + preference, key-parity CI). Feature FRs (FR-011/012/020-047/060/061/072-075) are deferred to their waves but their **schema slices are frozen now**. Per-FR support is mapped in Architecture Patterns and Validation Architecture. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Magic-link login + session cookie | Frontend Server (Next.js RSC/Route Handler + `@supabase/ssr`) | Supabase Auth (`auth.users`, OTP/magic-link) | Session is an HttpOnly cookie set server-side; Supabase Auth issues/validates the magic link. Browser only opens the link. |
| Account creation (`anchor_user` row) | API (Edge Function on magic-link verify) + DB trigger | Supabase Auth | `anchor_user.id = auth.users.id`; row + Stripe customer (DEC-0016) created at verification, server-side. Never client-side. |
| Pairing **code issuance** | API (`pairing-issue` Edge Function, user JWT) | DB (rate-limit count, TTL row) | Issued from an authenticated web session; bound to the account; rate-limited server-side. Browser never mints the code. |
| Pairing **code redemption** | API (`pairing-redeem` Edge Function, **Hermes** service-role + `x-hermes-secret`) | Hermes (Telegram webhook → `/start <code>`) | Redemption is triggered by Telegram, executed by Hermes calling the edge fn; writes `anchor_user.telegram_user_id`, burns code. RLS bypassed → handler authz. |
| "Connected" UI flip | Browser (Supabase Realtime subscription) | Frontend Server (30s polling fallback) | Realtime on `anchor_user WHERE id = auth.uid()`; UI binds to the DB row, never optimistic. |
| Telegram webhook ingress | Hermes (Docker on VPS, stable HTTPS endpoint) | — | Telegram requires a stable server-pinned endpoint with bot-token auth, not edge-distributed handlers (DEC-0011 rationale). |
| Schema / migrations / RLS | DB (plain SQL via `psql`) | — | Schema is the source of truth (DEC-0013); RLS, triggers, functions, extensions are clearer in raw SQL. |
| Typed query layer | API + Frontend Server (Drizzle over generated types) | DB (introspected) | `drizzle-kit pull` reads live schema → `src/db/schema.ts`; app code uses typed builder. **Never** TS-schema → SQL. |
| i18n routing/messages | Frontend Server (next-intl `proxy.ts` middleware + RSC) | — | Subpath `/de /en`; messages server-loaded per namespace; key-parity enforced in CI not runtime. |
| Static/landing assets | CDN (Vercel) | — | AEO/SEO pages are Vercel's profile (DEC-0011); only the app shell + branding ships in Phase 0. |
| Magic-link / pairing email | API (Resend via edge fn or Route Handler) | Supabase Auth email hook | Server-side send; bounce-gated. |

**Tier-correctness watch-items for the plan-checker:** (1) account creation and Stripe-customer creation MUST be server-side (Edge Function / Route Handler), never browser. (2) Pairing **redeem** belongs to Hermes-via-edge-fn (service-role), pairing **issue** belongs to the authenticated webapp (user JWT) — different auth tiers, do not collapse. (3) The "connected" flip is **Browser Realtime bound to a DB row**, never an optimistic client write.

## Standard Stack

> ✅ All versions below are **registry-VERIFIED via `npm view`, 2026-05-30**. The *choices* are LOCKED by ADRs. Pin these exact versions (or the matching caret range); re-run `npm view` only if planning is delayed past ~7 days.

### Core
| Library | Version (VERIFIED 2026-05-30) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| `next` | **16.2.6** `[VERIFIED: npm]` — ADRs say "15"; **16 is current** (see CRITICAL findings / A1) | App Router webapp | DEC-0011 (locked) |
| `react` / `react-dom` | 19.x (ships with Next 16) `[ASSUMED — confirm peer at install]` | UI runtime | Next peer |
| `next-intl` | **4.13.0** `[VERIFIED: npm]` (v4 API — not v3) | i18n, App-Router-native, subpath routing, ICU | DEC-0012 (locked) |
| `tailwindcss` | **4.3.0** `[VERIFIED: npm]` — **CSS-first config**, no `tailwind.config.js` | Styling | DEC-0011 (locked) |
| `shadcn` (CLI) | **4.8.3** `[VERIFIED: npm]` (Tailwind-4 compatible) | source-in-repo components | DEC-0011 |
| `@supabase/supabase-js` | **2.106.2** `[VERIFIED: npm]` | Postgres/Auth/Realtime client (browser + Deno Edge) | Supabase stack (locked) |
| `@supabase/ssr` | **0.10.3** `[VERIFIED: npm]` | Next.js App Router cookie session (replaces deprecated `auth-helpers-nextjs`) | Canonical SSR auth wiring |
| `drizzle-orm` | **0.45.2** `[VERIFIED: npm]` (a 1.0.0-beta line exists — stay on stable 0.45.x) | Typed query builder over generated types | DEC-0013 (locked, query-layer only) |
| `drizzle-kit` | **0.31.10** `[VERIFIED: npm]` — introspect via `drizzle-kit pull` + `defineConfig` | live schema → `src/db/schema.ts` | DEC-0013 |
| `stripe` (node) | **22.2.0** `[VERIFIED: npm]` | Customer-at-signup (Phase 0 hook); handlers later | DEC-0005/0016 |
| `resend` + `@react-email/components` | resend **6.12.4** `[VERIFIED: npm]` | Magic-link + pairing email | DEC-0017 |

### Supporting
| Library | Version (VERIFIED 2026-05-30) | Purpose | When to Use |
|---------|-------------------------------|---------|-------------|
| `zod` | latest `[ASSUMED — verify at install]` | Input validation at edge-fn + form boundaries (ASVS V5) | Every edge-fn request body + every form |
| `vitest` + `@vitest/coverage-v8` | vitest **4.1.7** `[VERIFIED: npm]` | Unit/integration | DEC-0020 (locked) |
| `@playwright/test` | **1.60.0** `[VERIFIED: npm]` | E2E pairing journey, merge gate | DEC-0020 (locked) |
| `@lhci/cli` (`lhci`) | **0.15.1** `[VERIFIED: npm]` | Lighthouse CI budgets | DEC-0020 (locked) |
| `@next/bundle-analyzer` | track `next` (16.x) `[ASSUMED]` | First-load JS budget checks | On-demand per DEC-0020 |
| `uuidv7` (npm) | **1.2.1** `[VERIFIED: npm]` | **JS fallback** for UUIDv7 if `pg_uuidv7` extension is unavailable on the VPS image (see Pitfall 1 / A5) | Only if the extension can't be installed |
| Telegram receiver lib for Hermes | `grammY` (Deno/Node) **or** raw `node:https` webhook `[ASSUMED — discretion]` | Webhook receive + `/start` parse | Discretion — `grammY` is the modern typed choice; ADR doesn't pin it |
| pg extensions | `pg_uuidv7`, `pgcrypto`, `pg_cron`, `pg_net`, `vector` | UUIDv7, token encryption, scheduling, http-from-sql, embeddings | Bootstrapped in the first migration; some need image-level install on self-hosted (verify on VPS) |

### Alternatives Considered (and rejected by ADR — do NOT propose)
| Instead of | Could Use | Why rejected |
|------------|-----------|--------------|
| Drizzle (query-only) | Prisma | RLS-hostile (runs service-role, bypasses policies); no DDL round-trip (DEC-0013) |
| next-intl | react-i18next / lingui / paraglide / FormatJS | App-Router story bolted-on or weaker Next integration (DEC-0012) |
| Edge Functions as seam | PostgREST direct / separate Node-Fastify backend | leaks schema / duplicates auth+deploy (DEC-0010) |
| Supabase Realtime | polling-only / bespoke Hermes→browser webhook | extra sync system, own auth/retry/ordering (DEC-0015) |
| Magic link | passwords / Google-OAuth-as-primary | password support-burden for elderly; OAuth ties launch to Google verification timeline (DEC-0006) |
| UUIDv7 | UUIDv4 / bigserial | v4 index fragmentation; bigserial leaks customer count (DEC-0013) |

**Installation (Tailwind 4 + Next 16 flow — versions verified 2026-05-30):**
```bash
pnpm create next-app@latest anchor --typescript --app --tailwind --eslint   # scaffolds Next 16 + Tailwind 4
pnpm add next-intl @supabase/supabase-js @supabase/ssr drizzle-orm zod stripe resend @react-email/components
pnpm add -D drizzle-kit vitest @vitest/coverage-v8 @playwright/test @lhci/cli @next/bundle-analyzer
npx shadcn@latest init        # shadcn 4.8.3 — Tailwind-4 aware
# Hermes (separate container): grammY or raw webhook + @supabase/supabase-js (Deno or Node)
```

**Re-verify only if planning is delayed >7 days:**
```bash
for p in next next-intl @supabase/supabase-js @supabase/ssr drizzle-orm drizzle-kit tailwindcss stripe resend vitest @playwright/test @lhci/cli zod uuidv7; do
  echo "$p = $(npm view "$p" version)"; done   # run WITHOUT a `cd` prefix in this harness (a cd-prefixed bash command triggers a perms prompt and aborts)
```
Verified set (2026-05-30): next 16.2.6 · next-intl 4.13.0 · tailwindcss 4.3.0 · shadcn 4.8.3 · @supabase/supabase-js 2.106.2 · @supabase/ssr 0.10.3 · drizzle-orm 0.45.2 · drizzle-kit 0.31.10 · stripe 22.2.0 · resend 6.12.4 · vitest 4.1.7 · @playwright/test 1.60.0 · @lhci/cli 0.15.1 · uuidv7 1.2.1.

## Architecture Patterns

### System Architecture Diagram (Phase 0 spine + UJ-002 slice)

```
                         ┌──────────────────────────────────────────────┐
   Browser (User)        │              VERCEL (Anchor webapp)           │
   ┌───────────┐         │  Next.js App Router  /de /en (next-intl v4)   │
   │ open       │  GET    │  ┌─ RSC app shell + branding (Unbounded,      │
   │ magic link │───────▶ │  │   Flower-of-Life spin-slow)               │
   │            │         │  ├─ Route Handler: /api/auth/* (@supabase/ssr │
   │ /de/onboard│         │  │   sets HttpOnly session cookie)           │
   │  shows     │ subscribe│  ├─ proxy.ts (next-intl locale middleware)   │
   │  pairing   │◀────────┼──┴─ pairing UI: calls pairing-issue (user JWT)│
   │  code +    │ Realtime │      Supabase Realtime (anchor_user row) ◀──┐│
   │  deeplink  │         │            30s polling fallback              ││
   └─────┬─────┘         └───────────────┬──────────────────────────────┘│
         │ user taps t.me/<bot>?start=CODE │ user-session JWT (RLS)        │
         ▼                                 ▼                              │
   ┌───────────┐    webhook    ┌─────────────────── HOSTINGER VPS ───────┴──────┐
   │ Telegram   │─────────────▶│  Hermes (Docker)         Supabase (Docker)      │
   │  servers   │  /start CODE  │  ┌──────────────┐  loopback  ┌───────────────┐ │
   └───────────┘               │  │ webhook recv  │──────────▶│ Edge Functions │ │
                               │  │ parse /start  │ service-   │ (Deno, beta)   │ │
                               │  │ echo turn     │ role JWT + │  13 endpoints  │ │
                               │  └──────────────┘ x-hermes-   │  pairing-redeem│ │
                               │                    secret      │  → writes      │ │
                               │                                │  telegram_user │ │
                               │                                │  _id, burns code│ │
                               │                                ├───────────────┤ │
                               │                                │ Postgres       │ │
                               │                                │  auth.users    │ │
                               │                                │  anchor_user   │ │
                               │                                │  (+ frozen DDL)│ │
                               │                                │  RLS auth.uid()│ │
                               │                                │  Realtime publ.│ │
                               │                                └───────────────┘ │
                               └────────────────────────────────────────────────┘

Trace UJ-002: login(cookie) → pairing-issue(user JWT, RLS) writes pairing_code row →
browser renders code+deeplink → user /start CODE → Telegram→Hermes webhook →
Hermes pairing-redeem(service-role + x-hermes-secret) writes anchor_user.telegram_user_id, burns code →
Postgres row change → Realtime → browser flips to "connected".
```

### Recommended Project Structure
```
anchor/                         # this repo (Anchor = A)
├── src/
│   ├── app/
│   │   ├── [locale]/           # next-intl subpath segment (/de /en)
│   │   │   ├── layout.tsx      # app shell, fonts, branding, NextIntlClientProvider
│   │   │   ├── page.tsx        # minimal home/onboarding entry (Phase 0)
│   │   │   └── (auth)/...      # magic-link request + callback UI
│   │   └── api/                # Route Handlers (auth callback, stripe webhook stub)
│   ├── proxy.ts                # next-intl middleware (Next 16 name; = middleware.ts on Next 15)
│   ├── i18n/
│   │   ├── routing.ts          # defineRouting({locales,defaultLocale,localePrefix})
│   │   └── request.ts          # getRequestConfig (per-namespace message loading)
│   ├── db/
│   │   ├── schema.ts           # GENERATED by drizzle-kit pull — do not hand-edit
│   │   └── client.ts           # Drizzle client (browser-safe + server variants)
│   └── components/             # shadcn source components + FlowerIcon, brand
├── messages/
│   ├── de/                     # common.json, onboarding.json, ... (authoritative)
│   └── en/
├── supabase/
│   ├── migrations/             # <timestamp>_<name>.sql — SOURCE OF TRUTH
│   └── functions/              # 13 Deno edge-fn dirs + _shared/ (auth guard, cors)
├── scripts/
│   ├── db-migrate.(ts|sh)      # psql -f loop -> pnpm db:migrate
│   ├── i18n-check.ts           # key-parity gate (fails CI)
│   └── i18n-unused.ts          # warn-only
├── docs/api/openapi.yaml       # the 13-endpoint contract — FREEZE artifact
├── e2e/                        # Playwright (pairing journey + stub bot)
├── drizzle.config.ts          # points at DATABASE_URL for introspect/pull
├── lighthouserc.(js|json)
└── .github/workflows/ci.yml   # lint, typecheck, i18n-parity, vitest, playwright, lhci

hermes/                         # sibling deployable (H) — scaffolds when its work runs
├── Dockerfile
├── src/ (webhook receiver, /start parse, edge-fn client, echo turn)
└── locales/{de,en}.json        # synced from Anchor catalog (pnpm sync-locales)
```

### Pattern 1: Reversed Drizzle workflow (SQL → introspect → types)
**What:** DDL is authored in `supabase/migrations/*.sql`, applied via `psql`, then `drizzle-kit pull` introspects the live DB and writes `src/db/schema.ts` (+ `relations.ts`, meta snapshots, a sql file). App code imports those types.
**When to use:** Always in this project. Never run `drizzle-kit generate`/`push` from a TS schema. RLS policies, triggers, and Postgres functions are NOT modeled by Drizzle — they live only in the SQL migrations, and that is expected.
**Example (workflow — `drizzle-kit pull` confirmed [CITED: orm.drizzle.team/docs/drizzle-kit-pull]):**
```bash
pnpm db:migrate                          # psql -f every migration in lexical order
pnpm drizzle-kit pull                     # introspect live schema -> src/db/schema.ts (+ relations.ts, meta/)
# commit BOTH the .sql migration and the regenerated schema.ts in the same PR
```
`drizzle.config.ts` (confirmed `defineConfig` shape [CITED: orm.drizzle.team/docs/drizzle-config-file]):
```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',          // OUTPUT of pull, not authored
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  // optional: schemaFilter / tablesFilter / extensionsFilters to skip Supabase-internal schemas
});
```

### Pattern 2: Two-tier edge-function auth guard (the seam)
**What:** A `_shared/auth.ts` helper distinguishes (a) webapp calls (verify user JWT, let RLS scope direct reads) from (b) Hermes calls (verify service-role JWT **and** `x-hermes-secret`, then do explicit per-`anchor_user_id` authorization in the handler because RLS is bypassed).
**When to use:** Every one of the 13 functions; `pairing-redeem`, `turn-*`, `*-store`, `hermes-cache-invalidate` are Hermes-only (service-role path); `pairing-issue`, `plan-state` (read), etc. accept user JWT.
**Pitfall it prevents:** a stolen/broad service-role key executing user-only paths, or a user JWT reaching a Hermes-only verb. ADR-0010: "service-role path is gated behind explicit handler-side checks."
```ts
// supabase/functions/_shared/auth.ts (shape ASSUMED — verify Deno/Supabase edge-runtime APIs at build)
export function requireHermes(req: Request) {
  const secret = req.headers.get('x-hermes-secret');
  if (secret !== Deno.env.get('HERMES_SHARED_SECRET')) throw new Response('forbidden', { status: 403 });
  // also verify the Authorization bearer is the service-role JWT
}
export async function requireUser(req: Request) {
  // verify the user session JWT via supabase client; return anchor_user_id
}
```

### Pattern 3: Contract-shaped stubs with a hand-written OpenAPI
**What:** Each of the 13 edge functions returns a fixture matching the frozen request/response shape; `docs/api/openapi.yaml` is authored by hand to match exactly. Both repos generate/pin clients against the YAML; drift is caught at PR review (no CI client-gen at MVP per DEC-0010).
**When to use:** Phase 0 only — these are stubs to freeze the contract, not implementations. Wave owners replace internals behind the unchanged contract.

### Pattern 4: Realtime-bound UI state (never optimistic)
**What:** Onboarding/account UI subscribes to `anchor_user WHERE id = auth.uid()` (+ related per-user rows); badges bind to subscription state; a 30s polling path re-runs the *same* query. UI shows "connected"/"Pro aktiv" only when the row reflects it.
**Pitfall it prevents:** BPR-009 "no surprises" violation if the UI renders a state ahead of the server write. Teardown via `useEffect` cleanup on route change; re-subscribe + catch-up on mobile-Safari focus.

### Anti-Patterns to Avoid
- **TS-first Drizzle schema** (`drizzle-kit generate`/`push` from `schema.ts`): violates DEC-0013; `schema.ts` is generated output.
- **`middleware.ts` on Next 16:** the file is `proxy.ts` now; a `middleware.ts` is silently ignored.
- **Optimistic "connected"/"Pro" UI:** violates DEC-0015/BPR-009.
- **Hardcoded display strings in components / wordmark in a locale file:** violates FR-080; fails (or should fail) the i18n gate.
- **Service-role key in the browser or in webapp env:** the service-role + `x-hermes-secret` belong only to the Hermes container env. Webapp uses anon key + user session.
- **`drizzle-kit push` against the self-hosted DB in CI:** migrations apply via `psql`; CI boots an ephemeral Supabase for *tests*, not to mutate prod schema from TS.
- **Assuming Supabase Cloud features exist on self-host without enabling them:** Realtime publication, `pg_cron`, `pg_net`, `vector`, `pg_uuidv7` must be explicitly enabled/installed (see Pitfalls).
- **Letting feature agents edit the frozen schema / contract / token module ad hoc:** changes go through a contract-change review (build-plan collision rule).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic-link issuance/verification + session | Custom token table + cookie logic | Supabase Auth (`signInWithOtp` / magic link) + `@supabase/ssr` | OTP TTL, single-use, secure cookie, replay protection, rate-limit hooks already solved (ASVS V2/V3) |
| UUIDv7 generation | App-side UUIDv7 lib called on insert | `pg_uuidv7` extension as column default (`uuidv7` 1.2.1 npm only as fallback) | Server-side, monotonic, one source; avoids client clock skew (DEC-0013) |
| Refresh-token encryption | Custom AES wrapper | `pgcrypto` envelope encryption + master key in env | DEC-0008; rolling your own crypto is the classic ASVS V6 failure |
| i18n key-parity | Manual diff / ad-hoc lint | `scripts/i18n-check.ts` (DEC-0012 mandates a custom but *specified* check) + ICU via next-intl v4 | Spec'd; off-the-shelf is heavier than the problem |
| Telegram webhook plumbing | Raw long-polling loop / bespoke update parser | webhook + `grammY` (or thin `/start` parser) | Update typing, `setWebhook`, retry semantics handled |
| Realtime sync | Custom WS server / Hermes→browser push | Supabase Realtime on RLS rows | auth/retry/ordering already provided (DEC-0015) |
| OpenAPI client | Bespoke fetch wrappers per endpoint | Generate/pin from `docs/api/openapi.yaml` | single contract source; drift caught at review |
| Scheduling (pairing-code expiry etc.) | Node cron in Hermes | `pg_cron` + `net.http_post` → edge fn | DEC-0019; one schedule system |
| Stripe customer/idempotency | Custom dedup | Stripe SDK + event-id `ON CONFLICT DO NOTHING` table | DEC-0016 pattern |

**Key insight:** Phase 0's value is *freezing correct interfaces*, not building features. Every "don't hand-roll" item above is a place where a custom Phase-0 shortcut would leak into the frozen seam and force a contract-change later. Use the platform primitive so the freeze is durable.

## Common Pitfalls

### Pitfall 1: Self-hosted Supabase ≠ Supabase Cloud (the dominant Phase-0 risk)
**What goes wrong:** Edge Functions don't auto-deploy; Realtime isn't publishing; `pg_cron`/`pg_net`/`vector`/`pg_uuidv7` "don't exist"; JWT verification fails because the self-hosted JWT secret differs from a copied cloud example.
**Why it happens:** Cloud manages the Deno edge-runtime, the Realtime container, extension availability, and key rotation for you. On a Hostinger VPS via the official `docker-compose` you operate all of it; **self-hosted Edge Functions are in beta** [CITED: supabase.com/docs/guides/self-hosting/self-hosted-functions] — served by the `supabase/edge-runtime` image, mounting `./volumes/functions:/home/deno/functions` with `--main-service .../main`; some extensions need installation at the image/OS level, and Realtime requires the table added to the `supabase_realtime` publication with `REPLICA IDENTITY` set.
**How to avoid:** In Phase 0, stand up self-hosted Supabase early; in the first migration, `CREATE EXTENSION IF NOT EXISTS` for every required extension and **fail loudly** if unavailable (have `uuidv7` 1.2.1 npm ready as a UUIDv7 fallback); explicitly `ALTER PUBLICATION supabase_realtime ADD TABLE anchor_user;` (+ related) and set `REPLICA IDENTITY FULL` where needed; pin the `supabase/edge-runtime` image version and a `supabase functions serve`/deploy (scp) step into the VPS deploy script; verify the JWT secret used to sign user/service tokens matches the running `auth` + `rest` + `realtime` containers.
**Warning signs:** Realtime subscription opens but never fires; `uuid_generate_v7()` "function does not exist"; edge fn returns 401 for a valid-looking token; `vector` type unknown.

### Pitfall 2: Drizzle workflow inverted (the second-most-likely mistake)
**What goes wrong:** Someone authors `schema.ts`, runs `drizzle-kit push`, and now two sources of truth diverge from the SQL migrations; RLS/triggers/functions silently dropped because the ORM doesn't model them.
**Why it happens:** It's the *default* Drizzle tutorial flow and contradicts DEC-0013.
**How to avoid:** Make `schema.ts` a generated artifact (header comment "GENERATED — do not edit"); the only DB-mutating command is `pnpm db:migrate` (psql); add a CI check that `schema.ts` is up to date with the migrations (regenerate + `git diff --exit-code`).
**Warning signs:** A PR edits `schema.ts` without a corresponding `supabase/migrations/*.sql`.

### Pitfall 3: Two-tier auth collapse on the seam
**What goes wrong:** A Hermes-only function accepts a user JWT, or a webapp call uses the service-role key; RLS is bypassed without compensating handler authz; cross-account data leak.
**Why it happens:** Copy-pasting one auth helper across all 13 functions without the per-function gate.
**How to avoid:** Pattern 2 above; enumerate per-function which tier(s) may call it in `openapi.yaml` (security schemes) and in the handler; service-role functions MUST re-check `anchor_user_id` scoping in code.
**Warning signs:** Any edge fn without an explicit auth branch; service-role key present in webapp `.env`.

### Pitfall 4: `anchor_user.id = auth.users.id` FK + RLS timing
**What goes wrong:** Inserting `anchor_user` before the `auth.users` row exists, or RLS policies referencing `auth.uid()` that block the very insert that creates the row.
**Why it happens:** The account row is created on magic-link verification; ordering and the `SECURITY DEFINER` boundary matter.
**How to avoid:** Create `anchor_user` from a trusted server context (Edge Function/trigger) keyed on the new `auth.users.id`; write RLS as `auth.uid() = id` for select/update and create the row via a `SECURITY DEFINER` function or service-role insert; FK `references auth.users(id) on delete cascade`.
**Warning signs:** "violates foreign key constraint anchor_user_id_fkey"; insert blocked by RLS during signup.

### Pitfall 5: Pairing-code spec drift / weak redemption
**What goes wrong:** Wrong alphabet (includes I/L/O/U), no TTL/single-use enforcement, race on redeem (double-redeem), or issuance not rate-limited.
**Why it happens:** Treating the code as a generic token.
**How to avoid:** Exact Crockford alphabet `0-9A-HJKMNP-TV-Z`, 8 chars; store `expires_at` (now()+15min) + `consumed_at`; redeem in a single `UPDATE ... WHERE code=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING ...` (atomic burn); rate-limit issuance 5/hour/account; `pairing-code-expire` pg_cron every 5 min.
**Warning signs:** Two `/start` of the same code both succeed; codes containing I/L/O/U.

### Pitfall 6: next-intl v4 + Next 16 `proxy.ts` rename (verified, high-likelihood)
**What goes wrong:** The locale middleware lives in `src/middleware.ts` and is **silently ignored** on Next 16 (the file is now `proxy.ts`); or v3-era tutorials are followed against v4 (the `routing` object + `createMiddleware(routing)` + `getRequestConfig({requestLocale})` API differs from v3); RSC can't read messages; bare `/` doesn't redirect.
**Why it happens:** Next 16 renamed `middleware.ts → proxy.ts` [CITED: nextjs.org/docs/app/guides/upgrading/version-16]; next-intl is on v4 with a changed App-Router API; most tutorials online are v3/Next-15.
**How to avoid:** Use the **verified v4 pattern below** — `src/i18n/routing.ts` (`defineRouting`), `src/proxy.ts` (`createMiddleware(routing)`), `src/i18n/request.ts` (`getRequestConfig` with `requestLocale`/`hasLocale`), `[locale]` segment, `NextIntlClientProvider` in the locale layout, `createNextIntlPlugin('./src/i18n/request.ts')` in `next.config`, `NEXT_LOCALE` cookie. **If the plan holds at Next 15, the file is `middleware.ts` instead** — this is the single biggest scaffold fork (decide Next 15 vs 16 first).
**Warning signs:** locale routing does nothing (middleware ignored), "messages not found", hydration mismatch on locale, `/` 404s instead of redirecting to `/de`.

### Pitfall 7: Lighthouse/first-load-JS budget set too late
**What goes wrong:** The app shell + shadcn + magic-ui + fonts already blow the <90KB landing / <150KB account budget before any feature ships, and it's painful to claw back later.
**Why it happens:** Budgets treated as a Phase-4 concern.
**How to avoid:** Wire `lighthouserc` + `@next/bundle-analyzer` in Phase 0; keep magic-ui to high-impact moments; load Unbounded weight-900 only; verify the shell is under budget at the freeze.
**Warning signs:** First-load JS creeping past budget on the empty shell.

## Code Examples

> next-intl v4 + drizzle-kit pull are CITED from official docs; Supabase/Deno edge-runtime APIs are version-sensitive — verify at build against the pinned `supabase/edge-runtime` image and `@supabase/ssr` 0.10.3.

### Frozen-schema DDL skeleton (the FREEZE artifact — author in SQL)
```sql
-- supabase/migrations/0001_extensions_and_core.sql
create extension if not exists pg_uuidv7;     -- uuid_generate_v7()
create extension if not exists pgcrypto;      -- token envelope encryption
create extension if not exists pg_cron;
create extension if not exists pg_net;        -- net.http_post for cron->edge fn
create extension if not exists vector;        -- memory embeddings (frozen now, used Phase 2)

create table anchor_user (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null,                      -- IANA, browser-autodetected at signup
  locale text not null default 'de' check (locale in ('de','en')),
  telegram_user_id bigint unique,              -- null until paired
  stripe_customer_id text,                     -- created at magic-link verify (DEC-0016)
  birthdate_hash text,                         -- set when first Trusted Person added
  email_bounced_at timestamptz,
  created_at timestamptz not null default now()
);
alter table anchor_user enable row level security;
create policy anchor_user_self on anchor_user
  for select using (auth.uid() = id);
create policy anchor_user_self_upd on anchor_user
  for update using (auth.uid() = id);
-- realtime
alter table anchor_user replica identity full;
alter publication supabase_realtime add table anchor_user;

create table pairing_code (
  code text primary key,                       -- 8-char Crockford Base32
  anchor_user_id uuid not null references anchor_user(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table anchor_user_plan (
  anchor_user_id uuid primary key references anchor_user(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_failed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table app_config (key text primary key, value text, env text);
-- seed placeholder rows so later phases write values, not migrations:
insert into app_config(key,value,env) values
  ('free_daily_minutes','15','all'),
  ('pro_daily_minutes','120','all'),
  ('stripe_price_pro_monthly_de','', 'test')
  on conflict (key) do nothing;

create table stripe_event_log (id text primary key, payload jsonb, processed_at timestamptz default now());

-- memory index single-source CHECK (DEC-0004) — DDL frozen now, logic Phase 2
-- ... memory_index_item(anchor_user_id, source_kind, occurred_at, recall_excluded_at,
--      conversation_transcript_id, diary_entry_id, memory_fact_id, calendar_event_id,
--      embedding vector(...), check (exactly-one-FK-set AND source_kind matches))
```
*(The full FREEZE schema must also include: `auth.users`-linked transcripts/source-evidence, memory entity+relationship tables, `trusted_contact`, `google_connection` with encrypted-token column, `telegram_session`, and the memory-index single-source CHECK. The above is the Phase-0 core + the tables touched by the UJ-002 slice; the plan must enumerate the complete DDL as the freeze deliverable.)*

### Atomic pairing-code redeem (in `pairing-redeem` edge fn, service-role)
```sql
update pairing_code
   set consumed_at = now()
 where code = $1 and consumed_at is null and expires_at > now()
 returning anchor_user_id;
-- if a row returns: update anchor_user set telegram_user_id=$2 where id=anchor_user_id
-- (guard the telegram_user_id uniqueness; Realtime fires the UI flip)
```

### next-intl v4 routing + middleware (Next 16 = `proxy.ts`, CITED pattern)
```ts
// src/i18n/routing.ts  [CITED: next-intl.dev/docs/routing/configuration]
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'always',     // /de /en; bare / -> /de
});

// src/proxy.ts  (was middleware.ts pre-Next-16 — next-intl docs: "proxy.ts was called middleware.ts up until Next.js 16")
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
export default createMiddleware(routing);
export const config = { matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' };

// src/i18n/request.ts  [CITED: next-intl.dev/docs/usage/configuration]
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}/common.json`)).default };
});
```
Wire the plugin in `next.config`: `createNextIntlPlugin('./src/i18n/request.ts')`. **On Next 16 the file MUST be `proxy.ts`, not `middleware.ts`** — a `middleware.ts` will be ignored.

### Magic-link request (Supabase Auth + @supabase/ssr 0.10.3 server context)
```ts
// shape per @supabase/ssr — verify server-client + auth API for 0.10.3 at build
const supabase = createServerClient(/* cookies adapter */);
await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl } });
// On callback Route Handler: exchange code -> session cookie (HttpOnly);
// then ensure anchor_user row + stripe customer exist (server-side).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` (Next ≤15) | **`proxy.ts` (Next 16)** | Next 16, Oct 2025 `[CITED: nextjs.org upgrading/version-16]` | next-intl middleware file MUST be `proxy.ts` on Next 16; a `middleware.ts` is ignored |
| next-intl v3 API | **next-intl v4** (`defineRouting`/`routing` object, `createMiddleware(routing)`, `getRequestConfig({requestLocale})`) | v4 `[VERIFIED: npm 4.13.0]` | Use v4 setup, not v3 tutorials |
| Tailwind 3 `tailwind.config.js` | **Tailwind 4 CSS-first** (`@theme`, no JS config) | Tailwind 4 `[VERIFIED: npm 4.3.0]` | shadcn 4.8.3 init uses the v4 flow |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` (0.10.3) | ~2024 `[VERIFIED: npm 0.10.3 current]` | Use `@supabase/ssr` for App Router cookie sessions; auth-helpers deprecated |
| Pages Router i18n / `next-i18next` | App Router `next-intl` with `[locale]` segment + `proxy.ts` | Next 13+ App Router | Follow App-Router-native next-intl, not Pages-era guides |
| Drizzle TS-schema-first | (this project) SQL-first + `drizzle-kit pull` | n/a (project decision) | Reversed by DEC-0013 |
| UUIDv4 PKs | UUIDv7 (`pg_uuidv7`; `uuidv7` 1.2.1 npm as JS fallback) | adopted here | DEC-0013 |

**Self-hosted Edge Functions note (verified):** Supabase self-host serves Edge Functions via the **`supabase/edge-runtime`** image (Rust + custom Deno), mounting functions from `./volumes/functions:/home/deno/functions` with `--main-service .../main`; local dev uses `supabase functions serve`; VPS deploy copies the function dir (e.g. `scp`) [CITED: supabase.com/docs/guides/self-hosting/self-hosted-functions]. **Supabase explicitly calls self-hosted Edge Functions "in beta" with possible breaking API/config changes** — budget operational time for this in Phase 0.

**Deprecated/outdated to avoid:**
- `middleware.ts` on Next 16 (use `proxy.ts`).
- `@supabase/auth-helpers-nextjs` (use `@supabase/ssr`).
- next-intl v3 setup guides (use v4).
- Tailwind 3 `tailwind.config.js` tutorials (use v4 CSS-first).
- Any Pages-Router patterns / `getServerSideProps`/`getStaticProps` (App Router uses RSC + route segment config).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | **Pin Next 16 (16.2.6), not the ADR-stated "Next 15"** | header / Stack / Pitfall 6 | **DECISION needed** — registry shows 16 current; choice changes the middleware file (`proxy.ts` vs `middleware.ts`) and a few APIs. Recommend Next 16; confirm in discuss-phase. |
| A2 | React 19 is the peer that ships with Next 16 | Stack | Low — verify the exact React peer at install; doesn't change architecture. |
| A3 | `zod` major (v3 vs a newer v4) and `@next/bundle-analyzer` matching version | Stack | Low — verify at install; validation patterns are stable either way. |
| A4 | `drizzle-kit pull` writes `schema.ts` + `relations.ts` + meta snapshots + a sql file (init via `--init`) and the reversed workflow round-trips cleanly with hand-written RLS/triggers (which Drizzle does NOT model — they live only in the SQL migrations; that is expected) | Pattern 1 / Code Examples | Low-Medium — `pull` + `defineConfig` CITED from drizzle docs; confirm exact 0.31.10 config keys at build. |
| A5 | Required pg extensions (`pg_uuidv7`, `pgcrypto`, `pg_cron`, `pg_net`, `vector`) are installable on the self-hosted Supabase VPS image | Pitfall 1 / DDL | **Medium-High** — `pg_uuidv7` and `vector` may need image/OS-level install on a stock VPS Postgres; **`uuidv7` 1.2.1 npm is the verified JS fallback** if the extension is unavailable. Verify on the actual VPS image early. |
| A6 | Self-hosted Supabase Realtime requires `REPLICA IDENTITY` + adding tables to `supabase_realtime` publication | Pitfall 1 / DDL | Medium — exact steps vary by self-host version; verify against the deployed `supabase/realtime` image. |
| A7 | Self-hosted Edge Functions (beta) deploy via `supabase/edge-runtime` image + `./volumes/functions` mount + `supabase functions serve` / scp | State of the Art / Architecture | **Medium** — VERIFIED as the documented path, but Supabase flags it "in beta with possible breaking changes"; budget operational risk + pin the edge-runtime image version. |
| A8 | `grammY` is a reasonable Telegram receiver for Hermes (ADR doesn't pin it) | Stack | Low — discretion; any webhook receiver works. |
| A9 | Vitest integration tests can boot an "ephemeral local Supabase via CLI" in CI even though prod is self-hosted | Validation Architecture | Medium — DEC-0020 states this explicitly; confirm the CLI's local stack matches self-host (incl. edge-runtime beta) enough for the tested edge fns. |
| A10 | Lighthouse CI runs against the Vercel preview deployment per PR (requires Vercel + LHCI integration) | Validation Architecture | Low — DEC-0020 specifies this; standard setup. |

**`/gsd-discuss-phase` should confirm A1 (Next 15 vs 16 — the load-bearing one) and A5/A6/A7 (self-hosted Supabase extension + Realtime + Edge-Functions-beta reality on the actual VPS) before the planner writes scaffold + schema tasks. All package versions are registry-verified — no version is a blocker, but A1 is a one-time pinning decision.**

## Open Questions (RESOLVED)

1. **Pin Next 16 or hold at Next 15? (A1 — the load-bearing version decision).** — **RESOLVED 2026-05-30: Next 16.** User chose Next 16 + ADR-0011 amended; plan 00-02 scaffolds on 16.2.6 (`src/proxy.ts`, next-intl v4, Tailwind v4 CSS-first).
   - What we know: ADRs say "Next.js 15"; registry shows **next 16.2.6 current** (verified 2026-05-30); Next 16 renamed `middleware.ts → proxy.ts` and next-intl is on v4.
   - Recommendation (taken): **pin Next 16** — the v4 next-intl + `proxy.ts` pattern is documented and verified above.

2. **pg extension availability on the Hostinger VPS Supabase image (A5/A6).** — **RESOLVED 2026-05-30: smoke-migration-first.** Plan 00-01 (the FIRST task, `autonomous: false`) runs a `CREATE EXTENSION` + Realtime-publication smoke migration on the real VPS that fails loudly; `uuidv7` 1.2.1 npm is the documented UUIDv7 fallback.
   - What we know: DDL needs `pg_uuidv7`, `pgcrypto`, `pg_cron`, `pg_net`, `vector`.

3. **Hermes deployable scaffolding location.** — **RESOLVED: planner's discretion.** Plan 00-06 keeps the Telegram receiver thin (webhook + `/start` parse + edge-fn client + echo); `hermes/` with its own `hermes/tsconfig.json`.
   - What we know: Hermes is a sibling Docker container on the same VPS, calls edge fns over loopback; ADRs don't pin its internal framework.

4. **OQ-06 (stale ADR-0006 cross-ref to a non-existent local-first/E2E ADR).** — **DEFERRED to Phase 1 (not Phase-0-blocking).** Tracked in PROJECT.md/STATE.md as an open question; magic-link + Supabase Auth works server-side regardless. Confirm before relying on DEC-0006 recovery semantics in Phase 1.
   - What we know: STATE.md + INGEST-CONFLICTS flag ADR-0006 references a missing `0005-local-first...` and an "E2E master key" no ADR defines; current architecture is server-side Supabase.

## Environment Availability

> External dependencies for Phase 0. "Available" = confirmed reachable this session; the **VPS and Supabase containers were not probed** (no access from the research host) and are marked unverified — the first Phase-0 task must smoke-test them.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | webapp build/scaffold, scripts | ✓ | node + npm 11.6.2 `[VERIFIED]` | pnpm/yarn |
| npm registry egress | install deps, version verify | ✓ `[VERIFIED]` (versions pulled this session) | — | — |
| Hostinger VPS (Docker) | Hermes + Supabase containers | ? unverified | — | none — required for the seam |
| Self-hosted Supabase (Postgres+Auth+Edge+Realtime) | schema, edge fns, realtime, auth | ? unverified | — | Supabase Cloud (would violate DEC-0003) |
| `psql` client | `pnpm db:migrate` | ? unverified | — | Supabase CLI `db push` (off critical path) |
| Deno (edge-runtime image) | edge functions (beta self-host) | ? unverified | `supabase/edge-runtime` image | none for the locked design |
| Supabase CLI | local ephemeral DB in CI, optional dev | ? unverified | — | hand-rolled docker-compose |
| pg extensions (pg_uuidv7, pgcrypto, pg_cron, pg_net, vector) | DDL | ? unverified (A5) | — | `uuidv7` 1.2.1 npm for UUIDv7; others per-extension TBD |
| Telegram Bot token (test bot) | pairing slice | ? unverified | — | stub bot for CI (DEC-0020) |
| Resend API key + verified domain | magic-link/pairing email | ? unverified | — | Supabase built-in SMTP for dev only |
| Vercel project + preview deploys | Lighthouse CI, Playwright target | ? unverified | — | none for the locked CI design |

**Missing dependencies with no fallback:** the Hostinger VPS + self-hosted Supabase + Deno edge-runtime are load-bearing for the seam and cannot be substituted without violating locked ADRs. **The first Phase-0 task must verify the VPS/Supabase/extension/edge-runtime environment** before schema-freeze work proceeds.

**Missing dependencies with fallback:** Telegram (stub bot for CI), Resend (Supabase SMTP for dev), Supabase CLI (docker-compose), `pg_uuidv7` (`uuidv7` npm).

## Validation Architecture

> `.planning/config.json` does not exist → `nyquist_validation` treated as **enabled**; this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest **4.1.7** + `@vitest/coverage-v8`; Playwright **1.60.0** (`@playwright/test`); Lighthouse CI **0.15.1** (`@lhci/cli`) — all VERIFIED 2026-05-30, per DEC-0020 |
| Config file | none yet — **Wave 0** (`vitest.config.ts`, `playwright.config.ts`, `lighthouserc.json`, `.github/workflows/ci.yml` all to be created) |
| Quick run command | `pnpm vitest run` (unit) |
| Full suite command | `pnpm test:ci` = lint → typecheck → `i18n-check` → `vitest run --coverage` → `playwright test` → `lhci autorun` (script to author) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-user-journeys / UJ-002 | Login → pairing code shown → `/start CODE` (stub bot) → Hermes redeem → webapp flips "connected" via Realtime | E2E (merge gate) | `playwright test e2e/pairing.spec.ts` | ❌ Wave 0 |
| FR-001 | Anchor Account created on magic-link verify; one User per account; copy says "User" not "Patient" | integration + unit | `vitest run tests/auth/account-create.test.ts` | ❌ Wave 0 |
| FR-002 (adapted) | Magic-link issuance single-use + TTL; session cookie set; no password path | integration | `vitest run tests/auth/magic-link.test.ts` | ❌ Wave 0 |
| FR-010 / DEC-0007 | Pairing code: Crockford alphabet, 8 chars, 15-min TTL, single-use atomic redeem, 5/hour issuance rate-limit | unit + integration | `vitest run tests/pairing/code.test.ts` | ❌ Wave 0 |
| DEC-0010 | Two-tier edge-fn auth: user-JWT path vs service-role+`x-hermes-secret` path; service-role on user-only verb rejected | integration | `vitest run tests/edge/auth-guard.test.ts` | ❌ Wave 0 |
| DEC-0010 / contract | All 13 stubs return shapes matching `docs/api/openapi.yaml` | integration (contract-shape) | `vitest run tests/edge/contract-shape.test.ts` | ❌ Wave 0 |
| DEC-0013 | Migrations apply via psql; `drizzle-kit pull` introspects; RLS scopes `anchor_user` to `auth.uid()`; FK to `auth.users` cascades | integration (ephemeral Supabase) | `vitest run tests/db/schema-rls.test.ts` | ❌ Wave 0 |
| DEC-0015 | Realtime fires on `anchor_user` row change; 30s polling fallback returns same state; UI not optimistic | E2E (within pairing journey) | covered by `e2e/pairing.spec.ts` | ❌ Wave 0 |
| FR-080/081 / DEC-0012 | Locale JSON key-parity (missing/extra key fails); subpath `/de /en`; `/`→`/de`; wordmark not in locale file | CI script + unit | `pnpm tsx scripts/i18n-check.ts` + `vitest run tests/i18n/routing.test.ts` | ❌ Wave 0 |
| DEC-0020 (perf) | Shell under budget: LCP<2.0s, INP<200ms, CLS<0.1, first-load JS <90KB landing/<150KB account | Lighthouse CI | `lhci autorun` (vs Vercel preview) | ❌ Wave 0 |
| FR-070 | `anchor_user_plan` one row per account, `plan=free` at signup, no Stripe call | integration | `vitest run tests/billing/plan-mirror.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run <touched area>` + `pnpm tsx scripts/i18n-check.ts` (fast).
- **Per wave merge:** full `pnpm test:ci` (lint, typecheck, i18n-parity, vitest+coverage, playwright, lhci).
- **Phase gate (freeze):** full suite green **and** the UJ-002 Playwright journey green against a live (stub-bot) run; schema applies cleanly via psql + introspects; `openapi.yaml` matches deployed stubs; coverage ≥70% on the Phase-0 critical paths (pairing lifecycle, magic-link, plan-mirror, edge-fn auth).

### Wave 0 Gaps
- [ ] `vitest.config.ts` + `@vitest/coverage-v8` setup (none exists)
- [ ] `playwright.config.ts` + `e2e/pairing.spec.ts` + **stub Telegram bot** fixture (DEC-0020)
- [ ] `lighthouserc.json` with the four budgets + Vercel-preview wiring
- [ ] `scripts/i18n-check.ts` (key-parity, fails CI) + `scripts/i18n-unused.ts` (warn)
- [ ] `.github/workflows/ci.yml` running lint → typecheck → i18n-parity → vitest → playwright → lhci
- [ ] CI step booting an **ephemeral local Supabase** for edge-fn/db integration tests (Supabase CLI) — verify A9
- [ ] `tests/db/schema-rls.test.ts` harness that applies migrations to the ephemeral DB and asserts RLS
- [ ] Replace the stray `tsconfig.json` / `eslint.config.mjs` (current ones are an unrelated `@ljharb` library config — see Runtime State Inventory) with a Next.js/Vitest-appropriate config

*(All current infrastructure is missing — this is greenfield. Every row above is a Wave 0 deliverable.)*

## Runtime State Inventory

> This is a greenfield scaffold, not a rename/refactor. Included only to flag the two stray files that will collide with the scaffold.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database exists yet (greenfield). | none |
| Live service config | None — VPS/Supabase/Telegram not yet provisioned for Anchor. | none (provision is a Phase-0 task) |
| OS-registered state | None. | none |
| Secrets/env vars | `.env` exists in repo root (gitignored) — contents unknown; confirm it's empty/unrelated before scaffold writes new keys. | inspect before overwriting |
| Build artifacts / stray config | **`tsconfig.json`** and **`eslint.config.mjs`** in repo root are an unrelated **`@ljharb` library config** (references `operations/`, `GetIntrinsic.js`, `commonjs` module, `typeRoots:['types']`) — NOT a Next.js app config. They are leftovers, not Anchor scaffolding. | **Delete/replace** during scaffold; do not extend them. The `create-next-app` scaffold produces correct ones. |

**Verified:** repo root has no `src/`, no `package.json`, no `node_modules` — confirmed greenfield. `landingpage_desktop.jpg`/`landingpage_mobile.jpg` exist as design references; `TODO.md` is the original blocker list (mostly resolved by ADRs); `docs/compliance/` has Impressum/Datenschutz drafts (Phase 4).

## Security Domain

> `.planning/config.json` absent → `security_enforcement` treated as **enabled**; this section is included. Phase 0 is an auth/identity/seam phase — security is central, and `/gsd-secure-phase` is called on it per the build plan.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control (this phase) |
|---------------|---------|-------------------------------|
| V2 Authentication | **yes** | Supabase Auth magic link (single-use, TTL, HttpOnly cookie); no password surface (DEC-0006); magic-link send rate-limit 3/hr (DEC-0017) |
| V3 Session Management | **yes** | `@supabase/ssr` HttpOnly session cookie; session revocation on recovery; device-bound session |
| V4 Access Control | **yes** | RLS `auth.uid() = anchor_user_id` for webapp reads; **two-tier edge-fn authz** for Hermes (service-role + `x-hermes-secret`, explicit handler scoping because RLS bypassed) (DEC-0010) |
| V5 Input Validation | **yes** | `zod` schemas on every edge-fn request body + every form; pairing-code format validation (Crockford, length, TTL) |
| V6 Cryptography | **yes** | `pgcrypto` envelope encryption for Google refresh tokens (module frozen now); master key in Hermes env, half-yearly rotation (DEC-0008); never hand-roll crypto |
| V7 Error/Logging | partial | audit-event table frozen; never log cleartext tokens or magic-link URLs; bounce/email_log without payload bodies (DEC-0017) |
| V13 API/Web Service | **yes** | versioned `/functions/v1/*`; OpenAPI contract security schemes; signature verification posture (Stripe webhook stub uses `constructEvent`) |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service-role key leakage / over-broad use on user verbs | Elevation of Privilege | Service-role + `x-hermes-secret` only in Hermes container env; per-function tier gate; explicit `anchor_user_id` scoping in handlers (DEC-0010) |
| RLS bypass via direct PostgREST/table access | Information Disclosure | RLS on every user-owned table from the first migration; webapp uses anon key + user session, never service-role |
| Pairing-code brute force / takeover from stolen web session | Spoofing / EoP | ~40-bit code + 15-min TTL + single-use atomic burn + 5/hr issuance rate-limit; re-pairing sends farewell + 24h undo email (DEC-0007) |
| Wrong Telegram identity bound to account | Spoofing | code bound to issuing account at mint; redeem writes `telegram_user_id` only for that account; uniqueness constraint |
| Cross-account data leak via Realtime channel | Information Disclosure | Realtime channels scoped to `auth.uid()` rows; no cross-user fan-out (DEC-0015) |
| Cleartext refresh token in logs/backups | Information Disclosure | `pgcrypto` envelope encryption; access tokens never persisted; cleartext never logged (DEC-0008) |
| Stripe webhook forgery (stub now, live later) | Tampering / Spoofing | `stripe.webhooks.constructEvent` signature verification; event-id idempotency table (DEC-0016) — establish the pattern in the Phase-0 stub |
| Magic-link interception/replay | Spoofing | single-use + short TTL + HttpOnly cookie on opening device; send rate-limit + bounce gating (DEC-0006/0017) |
| Injection in edge-fn inputs | Tampering | parameterized queries via Drizzle; `zod` validation; no string-built SQL |

**`/gsd-secure-phase` focus for Phase 0:** verify (1) service-role key is absent from webapp env and present only in Hermes; (2) every user-owned table has RLS from migration 1; (3) the two-tier auth guard rejects mismatched tiers; (4) pairing-code redemption is atomic and rate-limited; (5) no cleartext tokens/magic-links in logs.

## Sources

### Primary (HIGH confidence — read this session)
- `.planning/ROADMAP.md` (Phase 0 section: scope, work items, FREEZE artifacts, success criteria)
- `.planning/PROJECT.md` (locked decisions DEC-0001..0022, constraints, two-deployable scope)
- `.planning/REQUIREMENTS.md` (REQ-mvp-scope, REQ-user-journeys, REQ-functional + traceability)
- `.planning/STATE.md` + `.planning/INGEST-CONFLICTS.md` (blockers BLK-01..05, OQ-06, RISK-07, dangling cross-refs)
- `docs/adr/0002,0003,0004,0005,0006,0007,0008,0009,0010,0011,0012,0013,0015,0016,0017,0019,0020.md`
- `docs/requirements/{mvp-scope,infrastructure-requirements,user-journeys,functional-requirements}.md`
- `docs/contexts/{user-identity,agent-interaction,usage-limits}/CONTEXT.md`
- `docs/styleguide.md` (Floema ref — aesthetic input; branding system in CLAUDE.md/DESIGN.md)
- `C:/Users/Marco/.claude/plans/cached-nibbling-curry.md` (approved spine-then-ribs build plan; Phase 0 + FREEZE + collision rules)
- Repo inspection: confirmed greenfield (no `src/`, no `package.json`; stray `tsconfig.json`/`eslint.config.mjs` are an unrelated `@ljharb` library config; no `.planning/config.json`)

### Secondary (MEDIUM-HIGH confidence — verified this session)
- `npm view <pkg> version` (2026-05-30) for the full stack — VERIFIED versions in the Standard Stack table.
- Context7 `/amannn/next-intl` (949 snippets) + `/websites/next-intl_dev` (resolved this session) — next-intl v4 App-Router setup.
- [next-intl.dev/docs/getting-started/app-router](https://next-intl.dev/docs/getting-started/app-router) + [/docs/routing/middleware](https://next-intl.dev/docs/routing/middleware) + [/docs/usage/configuration](https://next-intl.dev/docs/usage/configuration) — v4 `routing`/`createMiddleware`/`getRequestConfig`; `proxy.ts` rename note.
- [nextjs.org/blog/next-15](https://nextjs.org/blog/next-15) + [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16) — Next 16 current; `middleware.ts → proxy.ts`.
- [orm.drizzle.team/docs/drizzle-kit-pull](https://orm.drizzle.team/docs/drizzle-kit-pull) + [/docs/get-started/postgresql-existing](https://orm.drizzle.team/docs/get-started/postgresql-existing) + [/docs/drizzle-config-file](https://orm.drizzle.team/docs/drizzle-config-file) — `drizzle-kit pull` introspect workflow + `defineConfig`.
- [supabase.com/docs/guides/self-hosting/self-hosted-functions](https://supabase.com/docs/guides/self-hosting/self-hosted-functions) + [supabase.com/blog/edge-runtime-self-hosted-deno-functions](https://supabase.com/blog/edge-runtime-self-hosted-deno-functions) + [supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker) — self-hosted Edge Functions (beta), `supabase/edge-runtime` image, `./volumes/functions` mount.

### Tertiary (LOW confidence — needs validation)
- Self-host operational specifics on the **actual Hostinger VPS image** (extension availability A5, Realtime publication steps A6, edge-runtime beta behavior A7) — documented patterns are cited, but must be smoke-tested on the real VPS in the first Phase-0 task.
- A few small items still `[ASSUMED]`: exact React peer of Next 16, `zod` major, `@next/bundle-analyzer` matching version — verify at install (low risk).

## Metadata

**Confidence breakdown:**
- Architecture / responsibility map: **HIGH** — fully specified by ADRs read this session.
- Standard stack *choices*: **HIGH** (ADR-locked); stack *versions*: **HIGH** (registry-verified `npm view` 2026-05-30).
- Patterns (reversed Drizzle, two-tier auth, Realtime-bound UI, contract stubs): **HIGH** on intent (ADR-derived); next-intl v4 + drizzle-kit pull patterns CITED from official docs.
- Pitfalls: **HIGH** — self-host / Drizzle-inversion / two-tier-auth / pairing risks derived from the ADRs' own rationale; next-intl/Next-16 specifics verified.
- Security domain: **HIGH** — Phase 0 is an auth phase and ADRs specify the controls.
- Self-hosted Supabase operational reality on the actual VPS: **MEDIUM** — documented + cited, but must be smoke-tested in the first Phase-0 task.

**Research date:** 2026-05-30
**Valid until:** versions ~7 days (fast-moving — re-run `npm view` if planning slips); architecture/patterns ~30 days (stable, ADR-locked).
**Note:** versions are registry-verified this session; the only standing version *decision* is Next 15 vs 16 (A1 — recommend 16).

## RESEARCH COMPLETE
