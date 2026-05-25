---
description: "ADR-0012 — Anchor uses `next-intl` for webapp i18n with subpath routing, German as the authoritative legal locale, ICU pluralization, per-namespace lazy loading, a custom key-parity CI check, and Hermes pulling a synced subset of strings."
paths:
  - "../requirements/webapp-ui-ux-requirements.md"
  - "../requirements/functional-requirements.md"
  - "./0011-nextjs-on-vercel-with-tailwind-and-shadcn.md"
---

# i18n: next-intl with German as the authoritative locale

Status: Accepted

The Anchor webapp uses `next-intl` for internationalization. German (`de`) is the authoritative locale — all legal copy (Impressum, AGB, Datenschutzerklärung, Widerrufsbelehrung) is drafted in German first and translations are explicitly marked non-binding. English (`en`) is the only other locale for MVP. Routing is subpath-based: `/de/...` and `/en/...`, with the bare `/` redirecting to `/de` and a `NEXT_LOCALE` cookie sticking the User's last choice. Subpath routing gives each language its own crawlable URL tree for SEO and AEO — important because the funnel strategy depends on AI engines and search engines ranking specific landing pages.

`next-intl` was chosen over `react-i18next`, `lingui`, `paraglide`, and FormatJS because it is the App-Router-native option with first-class React Server Components support, ICU plural and select syntax built in, automatic `hreflang` tag generation, and a type-safe message catalog. `react-i18next` is broader but its App-Router story is bolted on, not idiomatic; the other libraries lack either community momentum or Next.js integration tooling.

Message catalogs live under `messages/<locale>/<namespace>.json`, one JSON per logical surface (`common`, `onboarding`, `account`, `legal`, etc.). Each route loads only the namespaces it needs via `getMessages({ messages: { ... } })`, so the landing page does not ship legal strings and account pages do not ship marketing copy. Interpolation uses ICU syntax exclusively; sprintf-style placeholders are rejected because they expose XSS surfaces and cannot express CLDR plurals. Date and number formatting uses `next-intl`'s `useFormatter()` against CLDR locale data.

CI enforces key parity with a custom `scripts/i18n-check.ts` that walks both locale trees and fails the build on missing or extra keys; off-the-shelf tooling is heavier than the problem warrants. A separate `i18n-unused` check (grep for `useTranslations`/`t()` usage) catches keys that no code reads. Unused keys do not fail CI but generate a PR comment.

Hermes (the Telegram orchestrator) has no full i18n library. It carries roughly two dozen static strings (Gentle Limit Notice, Silence Refresh Notice, Telegram Re-Pairing farewell, generic errors) as a simple `locales/de.json` and `locales/en.json` in the Hermes repository. These files are synced from Anchor's authoritative catalog via a `pnpm sync-locales` step in the Hermes deployment pipeline, keeping the webapp the single source of truth. The User's locale is exposed to Hermes through the `auth-resolve-telegram` Edge Function response (per ADR-0010) and persisted in the User row as `users.locale`; default value at signup mirrors the browser-detected `Accept-Language` header.

Legal copy follows German law for the German-targeted MVP. Each English-language legal page carries a header banner reading "This translation is provided for convenience; the German version is legally binding." Convenience translations are not required for launch — legal pages may ship German-only at MVP if English versions are not yet professionally reviewed. The footer surfaces the language switcher on every page.

Out of scope for MVP: locales beyond `de` and `en`, right-to-left layouts, locale-specific images, fully translated marketing funnel pages in English (English funnel pages are a post-MVP growth experiment), runtime locale fallback chains beyond `de → en → key`, machine-translation pipelines.
