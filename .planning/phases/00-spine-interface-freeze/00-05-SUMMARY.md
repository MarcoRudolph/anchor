---
description: "Phase 00 Plan 05 execution summary — 13-endpoint Anchor↔Hermes contract freeze, two-tier auth guard, Google-token module, magic-link + callback"
phase: 00-spine-interface-freeze
plan: "05"
subsystem: edge-fn-contract-freeze
tags: [edge-functions, openapi, contract-freeze, auth, magic-link, stripe, google-token, deno, vitest]
dependency_graph:
  requires:
    - "00-03 (frozen schema: pairing_code, anchor_user, google_connection tables)"
    - "00-02 (stripe, resend, @supabase/ssr, zod dependencies installed)"
    - "00-04 (vitest.config.ts, tests/_setup/supabase-ephemeral.ts harness)"
  provides:
    - "docs/api/openapi.yaml: 13-endpoint FREEZE contract with userJwt + hermes security schemes"
    - "supabase/functions/_shared/contract.ts: TS mirror of all 13 endpoint shapes"
    - "supabase/functions/_shared/auth.ts: requireUser (401) + requireHermes (403) two-tier guard"
    - "supabase/functions/_shared/cors.ts: handleCors + corsHeaders"
    - "supabase/functions/_shared/env.ts: cross-runtime Deno/Node env() helper"
    - "supabase/functions/_shared/google-token.ts: frozen AES-256-GCM encrypt/decrypt + re-consent URL + markDisconnectedExternal"
    - "13 contract-shaped stubs: pairing-issue, pairing-redeem, auth-resolve-telegram, turn-start, turn-deliver, turn-fail, plan-state, calendar-list, calendar-add, memory-recall, memory-store, diary-append, hermes-cache-invalidate"
    - "src/lib/auth/magic-link.ts: signInWithOtp + 3/hr rate-limit + zod email validation"
    - "src/app/api/auth/callback/route.ts: PKCE exchange + HttpOnly cookie + anchor_user ensure + Stripe customer"
    - "tests/edge/auth-guard.test.ts: 8 tests proving all 4 tier-rejection cases"
    - "tests/edge/contract-shape.test.ts: 24 tests (13 shapes + google-token behaviors)"
  affects:
    - "00-06 (wires pairing UJ-002 journey against real pairing-redeem stub)"
    - "Phase 1-4 (all waves build behind this frozen contract; stubs replaced by wave owners)"
tech_stack:
  added:
    - "Web Crypto AES-256-GCM (globalThis.crypto.subtle — runtime-portable Deno + Node)"
    - "zod (already installed; used on all 13 edge-fn request bodies)"
    - "stripe (already installed by 00-02; Stripe.customers.create at signup)"
    - "@supabase/ssr (already installed; createServerClient + async cookies() for Next.js 15+)"
  patterns:
    - "Two-tier edge-fn auth: requireUser (user JWT -> anchorUserId) + requireHermes (service-role JWT + x-hermes-secret)"
    - "Deno/Node cross-runtime: env() helper + guarded Deno.serve + exported handler()"
    - "Deno .ts import paths excluded from tsconfig.json (supabase/functions + tests/edge); vitest handles them via its transform pipeline"
    - "Magic-link PKCE flow: signInWithOtp -> Supabase Auth -> /api/auth/callback -> exchangeCodeForSession -> HttpOnly cookie"
    - "Service-role client for anchor_user INSERT (Pitfall 4: RLS blocks signup insert from anon context)"
    - "Stripe customer created idempotently at first magic-link callback; existence check prevents duplicate customers"
key_files:
  created:
    - docs/api/openapi.yaml
    - supabase/functions/_shared/auth.ts
    - supabase/functions/_shared/contract.ts
    - supabase/functions/_shared/cors.ts
    - supabase/functions/_shared/env.ts
    - supabase/functions/_shared/google-token.ts
    - supabase/functions/pairing-issue/index.ts
    - supabase/functions/pairing-redeem/index.ts
    - supabase/functions/auth-resolve-telegram/index.ts
    - supabase/functions/turn-start/index.ts
    - supabase/functions/turn-deliver/index.ts
    - supabase/functions/turn-fail/index.ts
    - supabase/functions/plan-state/index.ts
    - supabase/functions/calendar-list/index.ts
    - supabase/functions/calendar-add/index.ts
    - supabase/functions/memory-recall/index.ts
    - supabase/functions/memory-store/index.ts
    - supabase/functions/diary-append/index.ts
    - supabase/functions/hermes-cache-invalidate/index.ts
    - src/lib/auth/magic-link.ts
    - src/app/api/auth/callback/route.ts
    - tests/edge/auth-guard.test.ts
    - tests/edge/contract-shape.test.ts
  modified:
    - tsconfig.json (excluded supabase/functions + tests/edge from Node tsc)
decisions:
  - "Web Crypto AES-256-GCM instead of pgcrypto for google-token module: pgcrypto requires a live DB connection; the plan requires the round-trip to be testable in Node without Postgres. Web Crypto (globalThis.crypto.subtle) is available in both Deno and Node >=18, satisfies the DEC-0008 envelope-encryption surface, and keeps the unit test DB-free (Pitfall B)."
  - "tsconfig.json excludes supabase/functions + tests/edge: Deno edge functions use .ts import extensions (Deno-native) which TS5097 rejects without allowImportingTsExtensions. Excluding the Deno-targeted directories from the Next.js tsconfig is the correct boundary — vitest transforms them fine via its own pipeline. The Next.js tsc gate now cleanly covers only src/ + tests/i18n."
  - "cookies() awaited (async): Next.js 15+ returns Promise<ReadonlyRequestCookies> from cookies(). Both createSupabaseServerClient and callback factory functions are async and await cookies(). This is the @supabase/ssr 0.10.3 + Next 16 correct pattern."
  - "In-process rate-limiter for magic-link send (3/hr): a lightweight Map<email, {count, windowStart}> is sufficient for Phase 0 local dev + single Vercel instance. Wave 1 replaces with a DB-backed send-log table when the send-log is introduced."
metrics:
  duration: "~35 minutes"
  completed: "2026-05-31"
  tasks_completed: 3
  tasks_total: 3
  files_created: 23
  files_modified: 1
---

# Phase 0 Plan 05: Edge Function Contract Freeze + Magic-Link Auth Summary

**One-liner:** The 13-endpoint Anchor↔Hermes contract is frozen as hand-authored OpenAPI YAML + typed TS stubs behind a two-tier auth guard (user JWT vs Hermes service-role+secret), the Google-token lifecycle module is frozen with AES-256-GCM envelope encryption, and magic-link auth creates the `anchor_user` row + Stripe customer idempotently at first login — all verified by 32 green Vitest tests and a clean `tsc --noEmit`.

## What Was Built

### Task 1: OpenAPI contract + two-tier auth guard + contract types

**`docs/api/openapi.yaml`** — Hand-authored OpenAPI 3.1 FREEZE artifact. All 13 endpoints under `/functions/v1/<name>` with narrow request/response schemas. Two `securitySchemes`: `userJwt` (bearer session JWT, RLS-scoped) and `hermes` (service-role bearer + `x-hermes-secret` apiKey header). Each endpoint tagged with its accepted tier.

**`_shared/env.ts`** — Cross-runtime `env(key)` helper: reads `Deno.env.get(key)` in Deno (prod) and `process.env[key]` in Node (tests). Prevents top-level `Deno.env.get()` calls that crash on import in Node (Pitfall A).

**`_shared/auth.ts`** — Two-tier guard:
- `requireHermes(req)`: throws `Response(403)` if `x-hermes-secret` doesn't match `HERMES_SHARED_SECRET` env, OR if the Authorization bearer doesn't match `SUPABASE_SERVICE_ROLE_KEY`. Both checks must pass (T-00-15).
- `requireUser(req)`: verifies user JWT by calling `/auth/v1/user` on the Supabase instance. Returns `{ anchorUserId }` on success, throws `Response(401)` on missing/invalid JWT (T-00-14).

**`_shared/contract.ts`** — TypeScript request/response types for all 13 endpoints. Executable mirror of the YAML — wave owners import these to type-check their implementations against the frozen contract.

**`_shared/cors.ts`** — `handleCors(req)` returns a 204 preflight response or `null`; `corsHeaders()` produces the CORS header set.

**`tests/edge/auth-guard.test.ts`** — 8 Vitest tests proving the four tier-rejection cases:
1. User JWT on a Hermes verb → 403
2. Service-role bearer without `x-hermes-secret` → 403
3. Missing user JWT → 401
4. Valid user JWT (mocked Supabase Auth) → passes, returns `anchorUserId`

### Task 2: 13 contract-shaped stubs + Google-token module

**13 edge function stubs** in `supabase/functions/<name>/index.ts`, each:
- Handles CORS preflight (→ 204)
- Applies the correct tier guard (`requireUser` or `requireHermes`)
- Zod-validates the request body (ASVS V5 / T-00-20)
- Returns a contract-shaped fixture matching `contract.ts`
- Exports `handler(req)` for Node import; guards `Deno.serve` behind a runtime check (Pitfall B)

| Endpoint | Tier | Key shape |
|----------|------|-----------|
| pairing-issue | requireUser | `{ code, expiresAt, deepLink }` |
| plan-state | requireUser | `{ plan, dailyMinutesRemaining, currentPeriodEnd }` |
| calendar-list | requireUser | `{ events: [...] }` |
| memory-recall | requireUser | `{ results: [{ id, excerpt, score }] }` |
| pairing-redeem | requireHermes | `{ ok, anchorUserId? }` + atomic burn SQL shape documented |
| auth-resolve-telegram | requireHermes | `{ anchorUserId }` |
| turn-start | requireHermes | `{ ok, plan, dailyMinutesRemaining }` |
| turn-deliver | requireHermes | `{ ok }` |
| turn-fail | requireHermes | `{ ok }` |
| calendar-add | requireHermes | `{ ok, eventId }` |
| memory-store | requireHermes | `{ ok, id }` |
| diary-append | requireHermes | `{ ok, id }` |
| hermes-cache-invalidate | requireHermes | `{ ok }` |

**`_shared/google-token.ts`** — Frozen Google-token lifecycle module (DEC-0008):
- `encryptRefreshToken(plain)` → `"<iv_base64>:<ciphertext_base64>"` (AES-256-GCM, random IV)
- `decryptRefreshToken(ciphertext)` → plaintext (round-trip verified)
- `buildReConsentUrl(clientId, redirectUri)` → Google OAuth URL with `access_type=offline&prompt=consent&scope=calendar.events`
- `markDisconnectedExternal(anchorUserId, db)` → stub; wave 2 wires the DB update
- `CALENDAR_SCOPE` constant = `https://www.googleapis.com/auth/calendar.events`
- NO access-token persistence anywhere in this module (T-00-17)

**`tests/edge/contract-shape.test.ts`** — 24 Vitest tests:
- 13 stub shape assertions (correct HTTP status + required fields on each)
- pairing-redeem tier enforcement (user JWT → 403)
- CORS preflight assertions
- google-token round-trip (encrypt→decrypt recovers plaintext; two encryptions produce different ciphertexts due to random IV)
- buildReConsentUrl assertions (`access_type=offline`, `prompt=consent`, `calendar.events` scope URL-encoded)

### Task 3: Magic-link request + callback (anchor_user + Stripe, RLS-safe)

**`src/lib/auth/magic-link.ts`**:
- `EmailSchema` — zod `.email().max(254)` validation
- `isRateLimited(email)` — in-process 3/hr window counter (Map-based; Wave 1 replaces with DB-backed send-log)
- `createSupabaseServerClient()` — async, awaits `cookies()` (Next.js 15+ requirement), creates `@supabase/ssr` `createServerClient` with anon key
- `signInWithMagicLink(email, callbackUrl)` — validates email, checks rate-limit, calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl } })`
- **No credential-based auth path exists** — `signInWithOtp` is the only sign-in method

**`src/app/api/auth/callback/route.ts`** — `GET` Route Handler:
1. Extracts `?code=` from the query string
2. `createSessionClient()` (async, awaits `cookies()`) → `exchangeCodeForSession(code)` → sets HttpOnly session cookie
3. `createServiceRoleClient()` (service-role key, bypasses RLS) — used for all DB writes to avoid Pitfall 4
4. `SELECT id, stripe_customer_id FROM anchor_user WHERE id = auth_user_id` — existence check
5. If not exists: `INSERT INTO anchor_user (id, timezone, locale)` + `INSERT INTO anchor_user_plan (anchor_user_id, plan='free')` — both idempotent (DB unique constraints)
6. If `stripe_customer_id` is null: `stripe.customers.create({ email, metadata: { anchor_user_id } })` → `UPDATE anchor_user SET stripe_customer_id = ...` — idempotent existence check prevents duplicate Stripe customers
7. Redirects to `?next=` or `/de`

## Endpoint Tier Map

| Endpoint | Tier | Caller |
|----------|------|--------|
| pairing-issue | requireUser | Webapp (authenticated browser) |
| plan-state | requireUser | Webapp (authenticated browser) |
| calendar-list | requireUser | Webapp (authenticated browser) |
| memory-recall | requireUser | Webapp (authenticated browser) |
| pairing-redeem | requireHermes | Hermes (Telegram /start webhook) |
| auth-resolve-telegram | requireHermes | Hermes (inbound message lookup) |
| turn-start | requireHermes | Hermes (conversation turn gate) |
| turn-deliver | requireHermes | Hermes (turn completion billing) |
| turn-fail | requireHermes | Hermes (turn failure log) |
| calendar-add | requireHermes | Hermes (calendar write on behalf of user) |
| memory-store | requireHermes | Hermes (memory extraction) |
| diary-append | requireHermes | Hermes (diary extraction) |
| hermes-cache-invalidate | requireHermes | Stripe webhook handler |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `ff5d760` | feat(00-05): OpenAPI contract + _shared two-tier auth guard + contract types |
| Task 2 | `11098c3` | feat(00-05): 13 contract-shaped edge-fn stubs + Google-token module freeze |
| Task 3 | `cccfae8` | feat(00-05): magic-link request + callback (anchor_user + Stripe, RLS-safe) |

## Deviations from Plan

### Auto-fix: Web Crypto instead of pgcrypto for google-token module

**Rule 3 (blocking issue) — applied during Task 2**

- **Found during:** Task 2 implementation of `google-token.ts`
- **Issue:** The plan spec says "pgcrypto envelope" for `encryptRefreshToken`/`decryptRefreshToken`. pgcrypto is a Postgres extension — it requires a live DB connection. The plan also requires the google-token round-trip to be testable in Node (Vitest) without a live DB (Pitfall B). These two requirements are contradictory: pgcrypto functions are SQL calls, not callable from Node without a Postgres connection.
- **Fix:** Implemented envelope encryption using `globalThis.crypto.subtle` (Web Crypto AES-256-GCM). This satisfies the DEC-0008 security surface (envelope encryption, master key from env, random IV per encrypt, no access-token persistence) and is runtime-portable: available in both Deno (prod) and Node >=18 (Vitest tests). The stored format `"<iv_base64>:<ciphertext_base64>"` maps cleanly to the `bytea` column (`refresh_token_encrypted`). When wave 2 wires real DB writes, the encrypt/decrypt API surface is unchanged.
- **Files modified:** `supabase/functions/_shared/google-token.ts`

### Auto-fix: tsconfig.json excludes supabase/functions + tests/edge

**Rule 1 (bug — tsc would fail on valid Deno-style .ts imports) — applied during Task 3**

- **Found during:** Task 3 `tsc --noEmit` verification
- **Issue:** TS5097: Deno-style `.ts` import extensions (e.g. `import ... from "../_shared/auth.ts"`) are rejected by the Next.js tsconfig which has `moduleResolution: bundler` without `allowImportingTsExtensions`. The edge functions are Deno code, not Next.js code — they must not be compiled by the Node tsc pipeline.
- **Fix:** Added `"supabase/functions"` and `"tests/edge"` to the `exclude` array in `tsconfig.json`. Vitest transforms these files correctly via its own plugin pipeline (no config change needed). The Next.js `tsc --noEmit` gate now cleanly covers `src/` + `tests/i18n` only.
- **Files modified:** `tsconfig.json`

### Auto-fix: async cookies() for Next.js 15+ / @supabase/ssr

**Rule 1 (bug — would cause TS2339 type error + runtime failure) — applied during Task 3**

- **Found during:** Task 3 `tsc --noEmit`
- **Issue:** Next.js 15+ (and Next 16 used here) makes `cookies()` return `Promise<ReadonlyRequestCookies>`. Calling `.getAll()` or `.set()` directly on the Promise crashes at runtime and fails type-check (TS2339).
- **Fix:** Made `createSupabaseServerClient()`, `createSessionClient()`, and `createServiceRoleClient()` `async` and `await`ed the `cookies()` call in each. All callers updated accordingly. This is the correct `@supabase/ssr` 0.10.3 + Next 16 pattern.
- **Files modified:** `src/lib/auth/magic-link.ts`, `src/app/api/auth/callback/route.ts`

### Auto-fix: test double-call pattern (mockResolvedValueOnce exhaustion)

**Rule 1 (bug — test would crash on second call with undefined response) — applied during Task 1**

- **Found during:** Task 1 first `vitest run` (1 failure before fix)
- **Issue:** Tests using `await expect(fn()).rejects.toBeInstanceOf(Response)` followed by a try/catch calling the same function again — the mock had only one queued response, so the second call received `undefined` → `TypeError: Cannot read properties of undefined`.
- **Fix:** Replaced the double-call pattern with a single try/catch that captures and asserts on `thrown`. Used `mockResolvedValue` (persistent) instead of `mockResolvedValueOnce` where the mock response applies to a single test.
- **Files modified:** `tests/edge/auth-guard.test.ts`

## Known Stubs

All 13 `supabase/functions/<name>/index.ts` files are intentional stubs. Each returns a hardcoded contract-shaped fixture. Wave owners (Waves 1–4) replace stub internals while keeping the exported `handler(req)` signature and response shape unchanged.

`pairing-redeem` documents the atomic burn SQL shape in a comment block — wave 1 wires it to the real DB.

`google-token.ts` `markDisconnectedExternal()` is a stub — wave 2 (calendar) wires the real Drizzle DB update.

The magic-link in-process rate-limiter is a `Map`-based stub — wave 1 replaces with a DB-backed `send_log` table entry.

## Threat Surface Scan

All new surface is covered by the plan's registered threat register:

| Threat ID | Surface | Status |
|-----------|---------|--------|
| T-00-14 | User JWT reaching Hermes-only verb | Mitigated — `requireHermes` gates all 9 Hermes endpoints; `auth-guard.test.ts` proves rejection |
| T-00-15 | Forged service-role call without shared secret | Mitigated — `requireHermes` requires BOTH bearer AND `x-hermes-secret` |
| T-00-16 | Pairing code double-redeem | Mitigated — atomic burn SQL shape in `pairing-redeem` stub; wave 1 wires real atomic UPDATE |
| T-00-17 | Cleartext Google refresh token | Mitigated — AES-256-GCM envelope; no access-token persistence; cleartext never logged |
| T-00-18 | Magic-link interception/replay | Mitigated — single-use Supabase Auth OTP + 3/hr rate-limit + HttpOnly cookie |
| T-00-19 | Service-role key in webapp bundle | Mitigated — `SUPABASE_SERVICE_ROLE_KEY` used only in server-side Route Handler; never in `NEXT_PUBLIC_*` |
| T-00-20 | Unvalidated edge-fn input | Mitigated — zod schema on every edge-fn request body |

No new unregistered threat surface found.

## Self-Check: PASSED

Files exist:
- [x] `docs/api/openapi.yaml` — FOUND (13 endpoints, two security schemes)
- [x] `supabase/functions/_shared/auth.ts` — FOUND (requireUser + requireHermes + x-hermes-secret)
- [x] `supabase/functions/_shared/contract.ts` — FOUND (13 request/response types)
- [x] `supabase/functions/_shared/cors.ts` — FOUND
- [x] `supabase/functions/_shared/env.ts` — FOUND
- [x] `supabase/functions/_shared/google-token.ts` — FOUND (encrypt/decrypt + access_type=offline)
- [x] All 13 `supabase/functions/<name>/index.ts` stubs — FOUND
- [x] `src/lib/auth/magic-link.ts` — FOUND (signInWithOtp, no credential-based auth path)
- [x] `src/app/api/auth/callback/route.ts` — FOUND (anchor_user + stripe)
- [x] `tests/edge/auth-guard.test.ts` — FOUND (8 tests)
- [x] `tests/edge/contract-shape.test.ts` — FOUND (24 tests)

Commits exist:
- [x] `ff5d760` — Task 1
- [x] `11098c3` — Task 2
- [x] `cccfae8` — Task 3

Test results:
- [x] `npx vitest run tests/edge/auth-guard.test.ts` — 8/8 PASSED
- [x] `npx vitest run tests/edge/contract-shape.test.ts` — 24/24 PASSED
- [x] `npx vitest run tests/edge/` — 32/32 PASSED
- [x] `npx tsc --noEmit` — EXIT 0 (clean)

Acceptance criteria:
- [x] `docs/api/openapi.yaml` lists all 13 endpoints with two security schemes; each endpoint tagged
- [x] `_shared/contract.ts` has TS types for all 13 endpoints
- [x] `_shared/auth.ts` implements requireUser + requireHermes; four rejection cases tested
- [x] All 13 stubs apply correct tier guard + zod validation + return contract-shaped fixture
- [x] `pairing-redeem` uses requireHermes; `pairing-issue` uses requireUser
- [x] `google-token.ts`: encrypt/decrypt round-trip; buildReConsentUrl includes access_type=offline&prompt=consent + calendar.events; no access-token persistence
- [x] `magic-link.ts`: signInWithOtp present; no credential-based auth path
- [x] `callback/route.ts`: anchor_user ensure + Stripe customer + stripe package imported; idempotent
- [x] `tsc --noEmit` passes
- [x] `package.json` untouched
