---
description: "ADR-0011 — The Anchor webapp is Next.js 15 (App Router) on Vercel with Tailwind CSS and shadcn/ui; backend services remain on the Hostinger VPS per ADR-0003."
paths:
  - "../requirements/webapp-ui-ux-requirements.md"
  - "../requirements/infrastructure-requirements.md"
  - "./0003-hostinger-vps-with-hermes-and-supabase-containers.md"
---

# Next.js on Vercel with Tailwind and shadcn/ui

Status: Accepted

The Anchor webapp is a Next.js 15 application using the App Router, deployed to Vercel. Tailwind CSS provides the styling foundation; shadcn/ui (copy-paste source components, no runtime dependency) supplies primitives; magic-ui supplies motion components where higher-impact animation is wanted. The Unbounded display font is loaded via `next/font/google` with `display: swap` and preload, and the Flower-of-Life icon plus `spin-slow` keyframe (DESIGN.md) live as local components and global CSS. Internationalization is `next-intl`, with German as the authoritative locale (legal copy in particular) and English as a secondary locale; the runtime details of i18n are settled separately.

Next.js was chosen because Anchor's go-to-market depends on Answer Engine Optimization and SEO funnel pages (Marco's FUNNEL.md and AEO.md strategies). Next.js App Router with React Server Components, static rendering, and incremental static regeneration produces extractable, crawlable, fast pages by default. Sitemap and Schema.org helpers, `next/image` performance defaults, and route-level metadata APIs match the AEO requirements without bolting on custom infrastructure. Remix and SvelteKit are technically capable but ship with smaller German developer pools and weaker first-party support for the specific i18n and Stripe integrations Anchor depends on. Plain Vite + React is rejected outright because client-side rendering does not meet the SEO/AEO bar.

Vercel was chosen over deploying the webapp to the Hostinger VPS because the webapp's traffic profile (geographically distributed German-speaking users, image-heavy landing pages, SEO funnel pages targeting search engines and AI crawlers) is exactly what Vercel's CDN is built for, while Hermes and Supabase (per ADR-0003) have the opposite profile (persistent server state, Telegram webhook ingress, database I/O). Splitting deployment surfaces by workload shape gives each service the right runtime. Lock-in is moderate: a Next.js application can be self-hosted via `output: 'standalone'` and a Docker container on the Hostinger VPS if Vercel cost or geography becomes a problem; the migration is mechanical, not architectural. Vercel's free tier accommodates the pilot scale (NFR-009) without recurring cost.

Tailwind is made the official styling system (WUX-013 already uses Tailwind syntax in examples). shadcn/ui is chosen over MUI, Chakra, and Mantine because its source-in-repo model avoids runtime version drift, leaves room for the distinctive design Marco's DESIGN.md mandates (no "AI-slop" generic aesthetic), and integrates with Tailwind natively. magic-ui is the chosen Motion library wrapper for richer animation primitives where shadcn ends.

Webapp build, deploy, and preview environments are Vercel-managed; production deployments are gated on green CI (lint + type check + i18n key-parity + Lighthouse budget once defined). Stripe webhook receivers live in Next.js Route Handlers on Vercel because they are public-facing HTTPS endpoints that benefit from Vercel's signed-deployment URLs; Hermes-side webhooks (Telegram) remain on the Hostinger VPS because Telegram requires a stable, server-pinned endpoint with bot-token authentication, not edge-distributed handlers.

Out of scope for MVP: a native mobile app, an Electron desktop wrapper, server-side rendering on the Hostinger VPS, an alternative non-Vercel CDN, a custom UI component library distinct from shadcn/ui.

## Amendment 2026-05-30 — Next.js 16 (was 15)

Status: Accepted

At Phase 0 scaffold time the current Next.js major was **16.2.6**, not 15. Anchor is greenfield, so it is built on Next.js **16** (App Router) rather than starting a new product on the prior major. This supersedes "Next.js 15" everywhere above; nothing else in the decision changes (Vercel, Tailwind, shadcn/ui, magic-ui, next-intl, AEO rationale, deployment split all stand).

Concrete deltas the implementation must honor:
- **Middleware renamed:** Next 16 uses `src/proxy.ts` (not `middleware.ts`). The next-intl locale middleware lives there.
- **next-intl v4** App-Router API (not v3). Subpath routing `/de`, `/en` per ADR-0012 unchanged.
- **Tailwind v4** (CSS-first config via `@theme` in CSS; no `tailwind.config.js`).
- Version pins are recorded in `.planning/phases/00-spine-interface-freeze/00-RESEARCH.md` (registry-verified 2026-05-30).
