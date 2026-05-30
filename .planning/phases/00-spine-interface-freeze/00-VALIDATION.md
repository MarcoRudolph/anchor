---
phase: 0
slug: spine-interface-freeze
status: draft
nyquist_compliant: false
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
| **Framework** | Vitest (unit/integration) + Playwright (E2E) + Lighthouse CI (perf) — installed in Wave 0 |
| **Config file** | none yet — Wave 0 creates `vitest.config.ts`, `playwright.config.ts`, `.lighthouserc.json` |
| **Quick run command** | `npm run test` (Vitest, changed-related) |
| **Full suite command** | `npm run test:run && npm run test:e2e && npm run i18n:check` |
| **Estimated runtime** | ~60–120 s (Vitest fast; Playwright pairing journey dominates) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test` (Vitest quick)
- **After every plan wave:** Run the full suite (Vitest + Playwright + i18n key-parity)
- **Before `/gsd-verify-work`:** Full suite green + Lighthouse budgets pass on landing/account routes
- **Max feedback latency:** 120 s

---

## Per-Task Verification Map

> Populated by the planner once PLAN.md files exist. Each task maps to a requirement,
> an optional threat ref, and a grep/CLI-verifiable automated command.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | — | REQ-mvp-scope / REQ-user-journeys / REQ-functional | — | — | — | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `CREATE EXTENSION` smoke migration on the real Hostinger VPS Supabase — proves `pg_uuidv7`, `vector`, `pg_cron`, `pg_net` install (JS `uuidv7` fallback if `pg_uuidv7` unavailable)
- [ ] Realtime publication smoke check — `supabase_realtime` publication + `REPLICA IDENTITY` on the rows the pairing slice subscribes to
- [ ] `vitest.config.ts` + first unit test stub
- [ ] `playwright.config.ts` + UJ-002 pairing journey stub (against a stub Telegram bot)
- [ ] `.lighthouserc.json` with ADR-0020 budgets (LCP <2.0s, INP <200ms, CLS <0.1, first-load JS <90KB landing / <150KB account)
- [ ] `scripts/i18n-check.ts` key-parity (DE↔EN) wired into CI

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Telegram deep-link redeem on a real device | REQ-user-journeys (UJ-002) | Real Telegram client + bot interaction not fully reproducible in CI | Pair a real Telegram account end-to-end once on the VPS before declaring the slice done; CI uses a stub bot |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
