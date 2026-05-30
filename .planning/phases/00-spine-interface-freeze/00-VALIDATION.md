---
phase: 0
slug: spine-interface-freeze
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from
> `00-RESEARCH.md` § Validation Architecture and ADR-0020 (testing strategy + perf budgets).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + Playwright (E2E) + Lighthouse CI (perf) — installed in 00-04 (Wave 2) |
| **Config file** | none yet — 00-04 creates `vitest.config.ts`, `playwright.config.ts`, `lighthouserc.json`, `.github/workflows/ci.yml` |
| **Quick run command** | `npm run test` (Vitest, changed-related) |
| **Full suite command** | `npm run test:run && npm run i18n:check && npx playwright test && npx lhci autorun` |
| **Estimated runtime** | ~60–120 s (Vitest fast; Playwright pairing journey dominates) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test` (Vitest quick) + `npm run i18n:check`
- **After every plan wave:** Run the full suite (Vitest + Playwright + i18n key-parity)
- **Before `/gsd-verify-work`:** Full suite green + Lighthouse budgets pass on landing/account routes
- **Max feedback latency:** 120 s

---

## Per-Task Verification Map

> Populated by the planner from the PLAN.md `<verify>`/`<acceptance_criteria>`. Each task maps to a
> requirement and a grep/CLI-verifiable automated command. Threat refs are from each plan's `<threat_model>`.

| Task | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| psql runner + extensions smoke | 00-01 | 1 | REQ-functional | T-00-02/03 | non-destructive probe, fail-loud | shell syntax + grep | `bash -n scripts/db-migrate.sh && grep -q ON_ERROR_STOP scripts/db-migrate.sh` | ⬜ pending |
| Apply smoke vs real VPS | 00-01 | 1 | REQ-functional | T-00-01 | superuser apply, no creds in repo | manual (checkpoint) | apply via `bash scripts/db-migrate.sh` + record in handoff | ⬜ pending |
| Next 16 + Tailwind v4 + shadcn scaffold | 00-02 | 1 | REQ-functional | T-00-05 | no secrets in webapp bundle | build + grep | `grep -q createNextIntlPlugin next.config.ts && ! test -f tailwind.config.js` | ⬜ pending |
| next-intl v4 proxy.ts + catalogs | 00-02 | 1 | REQ-functional (FR-080/081) | T-00-04 | locale validated | unit + node parity | `grep -q 'createMiddleware(routing)' src/proxy.ts` + inline key-parity node check | ⬜ pending |
| App shell + brand components | 00-02 | 1 | REQ-mvp-scope | T-00-05 | wordmark not in catalog | grep | `grep -q NextIntlClientProvider "src/app/[locale]/layout.tsx" && grep -q currentColor src/components/brand/FlowerIcon.tsx` | ⬜ pending |
| Frozen DDL (4 migrations) + RLS + realtime | 00-03 | 2 | REQ-functional | T-00-06/07/08/10 | RLS on every table, encrypted token col, single-source CHECK | grep (DDL) | `grep -q 'references auth.users(id) on delete cascade' …0001… && grep -q memory_index_item …0002… && grep -q supabase_realtime …0004…` | ⬜ pending |
| drizzle.config + client (query layer) | 00-03 | 2 | REQ-functional | T-00-09 | service-role not browser-importable | grep | `grep -q defineConfig drizzle.config.ts && grep -q GENERATED src/db/schema.ts` | ⬜ pending |
| Apply schema vs real VPS + drizzle-kit pull | 00-03 | 2 | DEC-0013 | T-00-06 | psql apply + introspect | manual (checkpoint) | `bash scripts/db-migrate.sh && pnpm drizzle-kit pull` + RLS/publication psql checks | ⬜ pending |
| Vitest + i18n key-parity gate + routing test | 00-04 | 2 | REQ-functional (FR-080/081) | T-00-12 | drift fails CI | unit + CLI | `npx vitest run tests/i18n/routing.test.ts` ; `tsx scripts/i18n-check.ts` exit-1 on drift | ⬜ pending |
| Playwright + UJ-002 scaffold + stub bot + ephemeral SB | 00-04 | 2 | REQ-user-journeys (UJ-002) | T-00-11/13 | no prod secrets in CI, no watch mode | E2E discovery | `npx playwright test --list e2e/pairing.spec.ts` | ⬜ pending |
| Lighthouse budgets + CI workflow | 00-04 | 2 | DEC-0020 | T-00-11/13 | budgets enforced early | JSON + grep | `node -e "JSON.parse(fs.readFileSync('lighthouserc.json'))" && grep -q i18n .github/workflows/ci.yml` | ⬜ pending |
| OpenAPI + two-tier auth guard + contract types | 00-05 | 3 | DEC-0010 | T-00-14/15 | tier rejection | integration | `npx vitest run tests/edge/auth-guard.test.ts` (4 rejection cases) | ⬜ pending |
| 13 edge-fn stubs + Google-token module | 00-05 | 3 | DEC-0010 / DEC-0008 | T-00-16/17/20 | contract shapes, encrypted token | integration | `npx vitest run tests/edge/contract-shape.test.ts` (13 shapes + token round-trip) | ⬜ pending |
| Magic-link request + callback | 00-05 | 3 | REQ-functional (FR-001/002) | T-00-18/19 | server-side account+customer, RLS-safe, no password | typecheck + grep | `grep -q signInWithOtp src/lib/auth/magic-link.ts && ! grep -iq password src/lib/auth/magic-link.ts && npx tsc --noEmit` | ⬜ pending |
| Hermes skeleton (webhook/redeem/echo) | 00-06 | 4 | REQ-user-journeys (UJ-002) | T-00-21/22/24 | secret-only-in-Hermes, code-format validate | grep + check | `grep -q x-hermes-secret hermes/src/edge-client.ts && grep -q pairing-redeem hermes/src/pairing.ts` | ⬜ pending |
| Pairing UI + Realtime connection hook | 00-06 | 4 | REQ-user-journeys (UJ-002) | T-00-23/25 | non-optimistic, RLS-scoped channel | typecheck + grep | `grep -q channel src/lib/realtime/useConnectionStatus.ts && ! grep -iq optimistic … && npx tsc --noEmit` | ⬜ pending |
| UJ-002 Playwright merge-gate E2E | 00-06 | 4 | REQ-user-journeys (UJ-002) | T-00-21/25 | correct-account binding, realtime flip | E2E (merge gate) | `npx playwright test e2e/pairing.spec.ts` (no test.fixme) | ⬜ pending |
| Real-device Telegram pairing | 00-06 | 4 | REQ-user-journeys (UJ-002) | T-00-21/22 | single-use, TTL, no cross-account | manual (checkpoint) | real bot + VPS: /start CODE → connected via Realtime | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> "Wave 0" infra is delivered by 00-01 (env smoke) and 00-04 (test gates) before the dependent feature tasks run.

- [ ] `CREATE EXTENSION` smoke migration on the real Hostinger VPS Supabase — proves `pg_uuidv7`, `vector`, `pg_cron`, `pg_net`, `pgcrypto` install (JS `uuidv7` fallback if `pg_uuidv7` unavailable) — **00-01**
- [ ] Realtime publication smoke check — `supabase_realtime` publication + `REPLICA IDENTITY` on the pairing-slice rows — **00-01**
- [ ] `vitest.config.ts` + first unit test (`tests/i18n/routing.test.ts`) — **00-04**
- [ ] `playwright.config.ts` + UJ-002 pairing journey (against a stub Telegram bot) — scaffolded **00-04**, completed **00-06**
- [ ] `lighthouserc.json` with ADR-0020 budgets (LCP <2.0s, INP <200ms, CLS <0.1, first-load JS <90KB landing / <150KB account) — **00-04**
- [ ] `scripts/i18n-check.ts` key-parity (DE↔EN) wired into CI (fails build on drift) — **00-04**
- [ ] `tests/_setup/supabase-ephemeral.ts` ephemeral local Supabase harness for edge-fn/db integration tests — **00-04**
- [ ] `tests/edge/auth-guard.test.ts` + `tests/edge/contract-shape.test.ts` — **00-05**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Extensions + Realtime on the real VPS | REQ-functional | VPS not reachable from CI; needs superuser psql | 00-01 checkpoint: apply smoke migration against the real VPS, record extension/uuidv7/realtime result in `docs/handoff.md` |
| Schema apply + drizzle-kit pull on the real VPS | DEC-0013 | Schema-push gate against the real DB | 00-03 checkpoint: `bash scripts/db-migrate.sh` then `pnpm drizzle-kit pull`; confirm RLS + publication via psql |
| Telegram deep-link redeem on a real device | REQ-user-journeys (UJ-002) | Real Telegram client + bot not fully reproducible in CI | 00-06 checkpoint: pair a real Telegram account end-to-end once on the VPS; CI uses the stub bot |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are explicit checkpoint/manual tasks with recorded instructions
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (checkpoints are bracketed by automated tasks)
- [x] Wave 0 covers all MISSING references (00-01 env smoke, 00-04 gates, 00-05 edge tests)
- [x] No watch-mode flags (CI uses `vitest run` / `playwright test`)
- [x] Feedback latency < 120 s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-populated 2026-05-30; pending execution.
