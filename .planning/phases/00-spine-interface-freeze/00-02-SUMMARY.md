---
description: "Phase 00 Plan 02 execution summary — Next.js 16 scaffold with Tailwind v4, next-intl v4, shadcn, and Rudolpho-AI brand shell"
phase: 00-spine-interface-freeze
plan: "02"
subsystem: webapp-scaffold
tags: [next16, tailwind4, next-intl4, shadcn, brand, i18n, scaffold]
dependency_graph:
  requires: []
  provides:
    - Next.js 16 app scaffold at repo root
    - Tailwind v4 CSS-first config with brand primary token
    - next-intl v4 subpath routing (DE authoritative, EN secondary)
    - proxy.ts middleware (Next 16 filename)
    - FlowerIcon + Wordmark brand components
    - DE/EN message catalogs with key parity
  affects:
    - All subsequent Anchor webapp plans (build on this scaffold)
    - 00-05 (imports stripe + resend — installed here)
tech_stack:
  added:
    - next@16.2.6
    - next-intl@4.13.0
    - tailwindcss@4.3.0
    - react@19.2.6 / react-dom@19.2.6
    - "@supabase/supabase-js@2.106.2"
    - "@supabase/ssr@0.10.3"
    - drizzle-orm@0.45.2
    - drizzle-kit@0.31.10
    - stripe@22.2.0
    - resend@6.12.4
    - "@react-email/components@1.0.12 (deprecated latest — pinned to last available)"
    - clsx@2.1.1
    - tailwind-merge@3.6.0
    - zod@3.25.76
    - vitest@4.1.7
    - "@playwright/test@1.60.0"
    - "@lhci/cli@0.15.1"
    - tsx@4.22.3
  patterns:
    - Tailwind v4 CSS-first @theme (no tailwind.config.js)
    - next-intl v4 defineRouting + createMiddleware(routing) + getRequestConfig({requestLocale})
    - Next 16 proxy.ts middleware (replaces middleware.ts)
    - Unbounded font via next/font/google with CSS variable --font-unbounded
    - FlowerIcon currentColor + spin-slow keyframe (DESIGN.md brand spec)
key_files:
  created:
    - package.json
    - next.config.ts
    - components.json
    - src/app/globals.css
    - src/lib/utils.ts
    - src/proxy.ts
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/components/brand/FlowerIcon.tsx
    - src/components/brand/Wordmark.tsx
    - messages/de/common.json
    - messages/en/common.json
    - scripts/db-migrate.sh
    - scripts/i18n-check.ts
  modified:
    - tsconfig.json (replaced @ljharb CommonJS config with Next.js config; Next auto-updated jsx to react-jsx)
    - eslint.config.mjs (replaced @ljharb flat config with eslint-config-next flat config)
decisions:
  - "proxy.ts used for middleware (not middleware.ts) — Next 16 renames the file; middleware.ts is silently ignored"
  - "@react-email/components pinned to latest (1.0.12) — package shows deprecated warning but is the last available version; downstream 00-05 owns the email path"
  - "jsx set to react-jsx by Next.js TypeScript plugin (was preserve in authored tsconfig) — this is correct Next 16 behavior"
  - "turbopack.root added to next.config.ts to silence workspace-root detection warning (parent repo has its own lockfile)"
metrics:
  duration: "~35 minutes"
  completed: "2026-05-31"
  tasks_completed: 3
  tasks_total: 3
  files_created: 16
  files_modified: 2
---

# Phase 00 Plan 02: Next.js 16 Scaffold Summary

**One-liner:** Next.js 16.2.6 app scaffold with Tailwind v4 CSS-first `@theme`, next-intl v4 `proxy.ts` middleware, DE/EN key-parity catalogs, and the Rudolpho-AI Flower-of-Life + Unbounded brand shell.

## What Was Built

### Task 1: Scaffold + Dependencies
Authored `package.json` from scratch with all pinned versions (next 16.2.6, next-intl 4.13.0, tailwindcss 4.3.0, stripe 22.2.0, resend 6.12.4, drizzle-orm 0.45.2, drizzle-kit 0.31.10). Created `next.config.ts` with `createNextIntlPlugin('./src/i18n/request.ts')`. Replaced stray `@ljharb` `tsconfig.json` with Next.js config (`jsx:preserve`→`react-jsx` by Next plugin, `moduleResolution:bundler`, `plugins:[{name:next}]`). Replaced stray `@ljharb` `eslint.config.mjs` with `eslint-config-next` flat config. Created `components.json` for shadcn (new-york style, Tailwind-4 CSS, no config file). Created `src/app/globals.css` with Tailwind v4 `@theme` block (`--color-primary-500: #FF6B00`) and `.spin-slow` keyframe (10s linear infinite per DESIGN.md).

### Task 2: next-intl v4 Routing
Created `src/i18n/routing.ts` with `defineRouting({ locales: ['de','en'], defaultLocale: 'de', localePrefix: 'always' })`. Created `src/proxy.ts` (Next 16 filename) with `createMiddleware(routing)` and the matcher. Created `src/i18n/request.ts` with `getRequestConfig({ requestLocale })` + `hasLocale` fallback to `defaultLocale`. Created `messages/de/common.json` and `messages/en/common.json` with 10 identical flattened keys; wordmark `anchor` absent from both catalogs.

### Task 3: App Shell + Brand Components
`FlowerIcon.tsx`: 7-circle sacred geometry SVG, stroke-only, `currentColor`, verbatim from DESIGN.md spec. `Wordmark.tsx`: `.spin-slow` + `text-primary-500 size-7` FlowerIcon + Unbounded `font-black tracking-tight lowercase` wordmark literal `anchor` (not a locale string). `src/app/[locale]/layout.tsx`: Unbounded weight-900 via `next/font/google` (CSS var `--font-unbounded`), `hasLocale` → `notFound()` for invalid locales (T-00-04 mitigation), `NextIntlClientProvider`, `Wordmark` in shell header. `src/app/[locale]/page.tsx`: RSC renders `appShell.tagline` translation, no feature logic.

## Build Result

`pnpm next build` compiles cleanly:
- Route `/[locale]` — dynamic (server-rendered)
- `ƒ Proxy (Middleware)` — `src/proxy.ts` active
- TypeScript check passes

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `9d2ef70` | feat(00-02): scaffold Next 16 + Tailwind v4 + next-intl + deps |
| Task 2 | `d694936` | feat(00-02): next-intl v4 routing, proxy.ts middleware, DE/EN catalogs |
| Task 3 | `bbd3f9a` | feat(00-02): app shell layout + FlowerIcon + Unbounded Wordmark brand components |

## Deviations from Plan

### Auto-added: clsx + tailwind-merge dependencies
- **Found during:** Task 1
- **Issue:** `src/lib/utils.ts` (required by shadcn component pattern) imports `clsx` and `tailwind-merge` which were not in the plan's dependency list.
- **Fix:** Added both as runtime dependencies via `pnpm add clsx tailwind-merge`.
- **Rule:** Rule 2 (missing critical functionality — shadcn utils.ts is a standard shadcn requirement).

### Auto-fixed: turbopack.root in next.config.ts
- **Found during:** Task 3 (build verification)
- **Issue:** Build warned about workspace-root detection — a parent directory `E:/Users/Marco/DokumenteAlt/repo/` has its own `package-lock.json`, causing Next.js Turbopack to infer the wrong root.
- **Fix:** Added `turbopack: { root: __dirname }` to `next.config.ts`.
- **Rule:** Rule 3 (blocking issue — warning would repeat on every build).

### Auto-fixed: jsx set to react-jsx by Next.js plugin
- **Found during:** Task 3 (build)
- **Issue:** Next.js TypeScript plugin auto-updated `tsconfig.json` changing `jsx: "preserve"` to `jsx: "react-jsx"` (the mandatory setting for Next.js App Router RSC). Also added `.next/dev/types/**/*.ts` to `include`.
- **Fix:** Accepted the auto-update (this is correct Next.js behavior, not a deviation from the intent).

## Known Stubs

None. The scaffold is intentionally minimal — no features, no data sources to wire.

## Threat Surface Scan

The plan's threat register covers all new surface introduced:
- T-00-04: `hasLocale` + `notFound()` in `layout.tsx` — mitigated as specified.
- T-00-05: No secrets introduced; only anon-key-safe surface scaffolded.

No new unregistered threat surface found.

## Self-Check: PASSED

Files exist:
- [x] `package.json` — FOUND
- [x] `next.config.ts` — FOUND
- [x] `src/proxy.ts` — FOUND
- [x] `src/i18n/routing.ts` — FOUND
- [x] `src/i18n/request.ts` — FOUND
- [x] `src/app/[locale]/layout.tsx` — FOUND
- [x] `src/app/[locale]/page.tsx` — FOUND
- [x] `src/components/brand/FlowerIcon.tsx` — FOUND
- [x] `src/components/brand/Wordmark.tsx` — FOUND
- [x] `messages/de/common.json` — FOUND
- [x] `messages/en/common.json` — FOUND

Commits exist:
- [x] `9d2ef70` — Task 1
- [x] `d694936` — Task 2
- [x] `bbd3f9a` — Task 3

Build: `pnpm next build` — PASSED (compiled successfully, proxy middleware active, /[locale] dynamic route)

All acceptance criteria met:
- [x] `package.json` has next 16.x, next-intl 4.x, stripe 22.x, resend 6.x, drizzle-orm, drizzle-kit, zod, `db:migrate` script
- [x] `next.config.ts` wires `createNextIntlPlugin('./src/i18n/request.ts')`
- [x] `src/app/globals.css` has `@theme` with `--color-primary-500: #FF6B00` and `.spin-slow` keyframe; no `tailwind.config.js`
- [x] `tsconfig.json` is Next.js config (jsx:react-jsx, plugins:[next], moduleResolution:bundler)
- [x] `src/proxy.ts` exports `createMiddleware(routing)` with matcher; no `src/middleware.ts`
- [x] `src/i18n/routing.ts` uses `defineRouting` with locales `['de','en']`, defaultLocale `de`, localePrefix `always`
- [x] DE/EN catalogs have identical 10 flattened keys; wordmark `anchor` absent from both
- [x] `FlowerIcon.tsx` is 7-circle SVG using `currentColor`, stroke-only
- [x] `Wordmark.tsx` renders spin-slow FlowerIcon + Unbounded `anchor` literal (not locale string)
- [x] `layout.tsx` loads Unbounded w900, validates locale, wraps in `NextIntlClientProvider`, renders `Wordmark`
- [x] `page.tsx` renders translated tagline, no feature logic
