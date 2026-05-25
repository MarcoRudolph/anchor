🟥 Blockers — you cannot start coding without these

  1. Authentication is undefined

  - FR-002 says "valid credentials create a web session." Nothing says what credentials — email + password? Magic link?
  Google OAuth (same provider as Calendar)? Anchor's target is elderly: passwords are a UX hazard, but no decision is on
   file.
  - Password strength rules, breach-check (HIBP), hashing algorithm — none mentioned.
  - Email verification flow is referenced in WUX-015 step 1, but token TTL, resend, and what happens on stale link are
  unspecified.
  - Session mechanism (HttpOnly cookie? rotating refresh? JWT?), duration, idle timeout, and revocation surface (NFR-003
   says "sessions can be revoked" — by whom, where?) — all open.
  - 2FA / MFA: absent. For an account that's billed via Stripe and connected to Google Calendar + Telegram, this is not
  a "later" item.
  - Login rate-limit / account-lockout policy: absent.

  2. Telegram pairing mechanics

  - WUX-015 says "deep-link button with the pairing code prefilled." But:
    - Code format (length, alphabet, single-use, TTL) is undefined.
    - One bot for all users vs. per-user bot is undefined. ADR-0002 says "Hermes orchestrates" — that strongly implies
  one bot, but the requirements never say so. This is irreversible architecture if you pick wrong.
    - What if the user has no Telegram? Anchor depends on it; there's no failure copy and no fallback.
    - Re-pairing flow (UJ-002 + FR-010 mention "lost Telegram access is handled as a Recovery Flow" — but no requirement
   defines it).
    - Multi-device Telegram: irrelevant for the bot, but the linkage is per-Telegram-user not per-device; this needs to
  be said somewhere.

  3. Google OAuth lifecycle

  - "Encrypted OAuth token material" appears in NFR-002, PSR-009, INF-003. But:
    - Refresh-token handling (Google offline access, refresh failures, re-consent UX) — undefined.
    - Disconnect from Google's side (user revokes from myaccount.google.com) — Anchor has no detection requirement.
    - Scopes: PSR-009 says "scoped to required calendar permissions" but the minimal scope list is not specified
  (calendar.events vs calendar.readonly vs calendar).
    - Google verification / OAuth consent screen approval: Google now requires app verification for sensitive scopes.
  This is a months-long process and not mentioned anywhere.

  4. Conversation-Minute counting is unimplementable as written

  - BPR-003 + FR-072: "active turn = from agent reply composition start to delivery." Fine for a single LLM call. But:
    - Where does the counter live? Postgres? Redis? In-memory in Hermes? Race-condition policy on concurrent updates is
  undefined.
    - User-local midnight requires a known timezone. Where does the timezone come from? Browser? IP? Telegram profile?
  Asked at signup? Never specified. CAL-009 says "User timezone" but never defines how it's set.
    - What if the agent fails mid-turn — does the partial time count? Refunded?
    - Streaming responses: when is "delivery"?
    - Plan downgrade mid-day: Pro user cancels at noon, downgrade fires at period end. If period end falls
  mid-conversation, what's the budget for the rest of the day? No rule.

  5. The legal layer is entirely missing — ✅ RESOLVED by ADR-0021 + compliance-requirements.md (CR-001..011) + docs/compliance/subprocessors.md (Impressum/DSE/AGB/Widerruf, cookie-consent-free posture, sub-processor register, Widerruf consent at Checkout). Remaining: actual legal prose drafted/reviewed against real company data (CR-011).

  - Anchor is German-targeted (EUR, "Kostenlos starten", DE default per FR-080).
  - Missing: Impressum (mandatory under §5 TMG), Datenschutzerklärung, AGB, Widerrufsbelehrung for the subscription
  (14-day right of withdrawal — Stripe alone doesn't handle this), Cookie/Consent banner (TTDSG), AVV/DPA with Stripe,
  Google, Telegram, OpenAI/Anthropic, Hostinger.
  - PSD2 SCA / 3DS2: BPR-011 just says "Stripe Checkout"; that's enough technically, but no requirement says the product
   commits to SCA-compatible flows (subscription updates that change amount may re-trigger SCA — must be documented).
  - GDPR right-to-erasure: NFR-008 says "documented before production launch" — that's not done.
  - GDPR right-to-export (data portability, art. 20): not mentioned at all.
  - DPA/AVV obligations cascade down to every sub-processor. The list of sub-processors isn't even compiled.

  6. The Anchor↔Hermes API contract does not exist

  - ADR-0002 declares the split. INF-002 lists Hermes' responsibilities. Nothing says how Hermes calls Anchor:
    - REST? gRPC? Supabase Edge Functions?
    - Auth between Hermes and Anchor (service-token? signed request?)
    - Plan-state read: cache-with-TTL, push, pull?
    - Minute increment: who writes? Hermes? Anchor backend?
  - Without this contract, two teams can't work in parallel. With one team it still slows you down.

  ---
  🟧 High — will block a clean shipped MVP

  7. No frontend stack decision

  - Next.js? Remix? plain Vite + React? SvelteKit?
  - Hosting target for the webapp itself is unspecified (Hostinger VPS hosts Hermes + Supabase per ADR-0003; webapp is
  silent). Vercel? Cloudflare Pages? Same VPS?
  - Font loading strategy for Unbounded (FOIT/FOUT, preconnect, weight 900 only).
  - No component library / design-token foundation. The styleguide mentions Floema-inspired aesthetics; the design rules
   in ~/.claude/rules/DESIGN.md define brand identity. But no Tailwind config, no token names, no MUI/shadcn choice.
  - WUX-013 references bg-white/85 backdrop-blur-sm — that's Tailwind syntax; picking Tailwind is now implicit but not
  codified. Make it an ADR.

  8. i18n library choice and runtime mechanics (FR-080, FR-081, WUX-020)

  - Library is unpicked: next-intl, react-i18next, lingui, paraglide, FormatJS?
  - Pluralization (CLDR rules differ for de "kein/ein/zwei" — minute count strings will need this).
  - Interpolation (e.g., "Heute noch {count} Minuten" — no rule about safe interpolation syntax).
  - Loading strategy: bundled per locale, split per route, lazy?
  - CI key-parity check: declared but no tool nominated (i18n-unused, lokalise, custom script).
  - Hermes locale sync (FR-081): "shared with Hermes" — via what? Same gap as #6.
  - Locale of authoritative copy for legal text — German is normally authoritative under EU law; this needs to be said
  somewhere.

  9. Database schema does not exist

  - Tables hinted at: anchor_user_plan, Anchor Account, User profile, Telegram identity mapping, Google Connection,
  Trusted Contacts, Conversation Transcripts, Diary Entries, Memory Facts, Memory Index Items, Calendar Events, Calendar
   Additions, Audit events, Usage counters, Recall Exclusion.
  - Anchor sits on Supabase. Supabase RLS policies are the canonical isolation mechanism — none specified. NFR-002 says
  "isolated per User"; that's a wish, not a policy.
  - The memory-index CHECK constraint (OQ-026) is well-specified at the conceptual level but no DDL.
  - Migration tooling (Supabase migrations? Drizzle? Prisma?) — undecided.
  - anchor_user_id vs auth.users.id (Supabase Auth): are they the same or separate? Big decision, not made.

  10. Stripe operational details

  - Stripe Product / Price IDs: test vs live environment separation, where they live (env vars? a config table?).
  - Stripe Customer creation: at signup? at first Checkout? With what email?
  - Re-subscription after cancellation: same stripe_customer_id or new? Affects metrics + invoice history.
  - VAT ID collection for B2B: not handled. Some elderly users have one. Probably not worth it for MVP; just
  acknowledge.
  - Failed-webhook alerting: FR-071 mentions reconciliation; no SLA on it. If a webhook is missed and reconciliation
  runs hourly, a paying user waits an hour for Pro to activate after Checkout. That's bad UX and not specified.
  - Idempotency keys on Checkout creation (mentioned only for webhook receipt, not for outbound Stripe API calls).
  - Webhook endpoint URL stability: subdomain, path, IP allowlist (Stripe doesn't publish IPs, so signature-only — fine,
   but say so).

  11. Voice transcription is an unsourced dependency

  - FR-012, MR-001 mention voice transcription. INF-006 lists "Speech-to-text" as required.
  - No provider picked (Whisper API, Deepgram, AssemblyAI, Gemini live).
  - No cost model. Per-second pricing × number of users × average voice minutes/day vs. €10/month Pro. At Whisper API
  rates, a chatty Pro user can easily wipe the gross margin — needs a back-of-envelope in docs/contexts/usage-limits/ or
   NFR-006.
  - Latency budget: NFR-005 says "under 20s." Whisper API is fine; Deepgram nova-2 is faster; this drives the choice and
   is not addressed.
  - PII / data residency: voice transcripts contain extremely sensitive content. Provider DPA, EU data processing,
  retention by provider — all open.

  12. The "Anchor Agent stops responding" contradiction (ABR-051 / FR-073 / BPR-009) — ✅ RESOLVED by ABR-052 (inbound-after-exhaustion: stay silent; one scripted plain-language reply if the User asks why, no Pro/price/quota language; exempt from ABR-051's one-message rule but at most once/day).

  - ABR-051 says the agent sends one Gentle Limit Notice and stops responding until reset.
  - BPR-009 says no surprises, no badges, no mid-conversation gating.
  - What if the user replies to the limit notice ("ok") — does the agent stay silent? Reply once with the same notice?
  The behavior on inbound after exhaustion is undefined and the User will perceive it as a broken bot.
  - Also: ABR-051 forbids naming Pro in chat, but the user might reasonably ask "warum redest du nicht mehr?" — Anchor
  needs a scripted answer here.

  13. Onboarding journey contradicts itself

  - WUX-015 (3-step wizard): email verify → Telegram → Google. After step 2 the user is "unblocked."
  - But UJ-002 step 4 says "Webapp confirms the Anchor Agent is connected" — and Hermes lives on a separate VPS. How
  does the webapp learn pairing happened? Webhook from Hermes? Polling? Unspecified.
  - WUX-006 says all connection states must be visible and distinguishable; that requires Anchor to know the states in
  real time. No mechanism.

  14. There is no admin / operator surface

  - BPR-010 says "refund handled by an operator via Stripe dashboard." Fine for billing.
  - But: How does an operator provision a pilot user, investigate a stuck pairing, delete a user's data on GDPR request
  (NFR-008 / PSR-007), view audit logs (PSR-012)?
  - No "admin webapp" or even a "psql access policy" is specified. For a 10-user pilot this is fine; for "tens to
  hundreds" (NFR-009) it's not.

  15. Trust signals on the landing page — ✅ RESOLVED by ADR-0022 + WUX-021 (trust/reassurance block: not-a-medical-device, encrypted, cancel anytime, no data sold), WUX-022 (legal/trust footer with Impressum/DSE/AGB/Widerruf links), WUX-023 (AEO: server-rendered FAQ + FAQPage/Organization JSON-LD + definition block). Testimonials deferred (none at pilot; no fabrication).

  The current landing brief is one hero + pricing + explainer. For elderly conversion, that's thin:
  - No testimonials / social proof requirement.
  - No safety/privacy reassurance above the fold (this audience worries about scams; "we are not a medical device, your
  data is encrypted, you can cancel anytime" needs explicit copy slots).
  - No demo / video spec.
  - No Impressum / Datenschutz footer (overlaps with #5).
  - No AEO-friendly structured content (your global rules push AEO hard — landing should have FAQ schema, definition
  blocks). None of that is in WUX-013/014.

  ---
  🟨 Medium — fill before public launch

  16. Email is a hidden dependency

  - Email delivery (INF-006) is listed but no provider chosen (Resend, Postmark, AWS SES).
  - Anchor sends: email verification, trusted-contact invitations, password reset, possibly Stripe-triggered receipts.
  - Bounce / spam handling, DKIM/SPF/DMARC setup, transactional template management — all silent.

  17. Webhook + scheduler reliability

  - INF-005 lists scheduled jobs. Tech is unchosen (pg_cron? Supabase scheduled functions? a worker queue in Hermes?
  cron on the VPS?).
  - "Idempotent webhooks" (FR-071) doesn't say how (event-id store with TTL).
  - Cold-start of the scheduler after a VPS reboot — no behavior specified for missed Morning Check-ins.

  18. Observability is a wishlist

  - NFR-007 / INF-008 enumerate what to log; nothing says where: Sentry? Logtail? OpenTelemetry → Grafana? Tail-only on
  the VPS?
  - No alerting policy (who gets paged for webhook failure, transcription failure, scheduler hang).
  - No uptime / status page plan.
  - No log retention in days. NFR-008 says "documented before production launch" — same gap as #5.

  19. Testing strategy is absent

  - NFR-012 says "requirements should map to tests" but no test framework is named, no agent-evaluation harness (the
  rubrics for ABR-040 recall quality are open in OQ-022), no manual UAT plan, no CI matrix.
  - Anchor's central value (memory recall quality) is uniquely hard to test; the docs admit this in OQ-022 and then move
   on.

  20. Performance budgets and Core Web Vitals

  - NFR-005 covers Telegram latency. Webapp side: no LCP/INP/CLS budget, no bundle size cap, no Lighthouse target.
  - Mobile-first (WUX-010) without a perf budget is wishful for elderly users on older Androids.

  21. Empty states and edge content — ✅ RESOLVED by WUX-024 (plan-activation window via Realtime ADR-0015, never-connected vs expired calendar states, abandoned-setup cleanup via ADR-0019) + ABR-013 (inbound before pairing), ABR-023 (morning check-in with no calendar connected).

  - What does /account/plan show during the brief window between Checkout success and webhook arrival? Spec says "badge
  updates immediately" — that's not actually possible without polling.
  - What does the morning check-in say when Google Calendar is disconnected? CAL-002 covers retrieval failure, not "user
   never connected."
  - What does the Telegram agent do before pairing is complete if the user happens to message the bot first? (Discovery
  vs. spam path.)
  - What happens when the user joins, never pairs Telegram, and abandons? Cleanup, reminder emails, deletion after N
  days — undefined.

  22. Trusted Contact recovery has a real-world hole

  - UJ-010 / FR-051: recovery uses Trusted Contact Email + User Birthdate + User Recovery Identifier (+ optional
  Zipcode).
  - What is User Recovery Identifier? Not defined anywhere. Username? Account-creation date? A code mailed at signup?
  This is a load-bearing concept defined only by its name.
  - The flow trusts the Trusted Contact's email as a factor — if their email is compromised, account is
  takeover-vulnerable. No mention of a notification to the User when recovery is initiated.

  23. Data export & account deletion — ✅ RESOLVED by ADR-0021 (CR-009 Art. 17 erasure: /account/delete, 7-day grace, cascade purge; CR-010 Art. 20 export: /account/export async bundle).

  - Nothing about exporting diary/memory (GDPR art. 20).
  - Account deletion: not specified as a user-facing flow. PSR-007 covers memory deletion; account deletion is broader.

  24. Pricing rounding & VAT display

  - BPR-005: "€10/month, VAT-inclusive." In Germany B2C, that's correct. But:
    - Different EU countries have different VAT rates → Stripe Tax computes net + VAT, the displayed €10 may not always
  equal net+VAT. Rules for rounding and currency display under different VAT regimes are open.
    - "Inclusive" implies a fixed bottom-line, which conflicts with Stripe Tax's per-country variability. Decide:
  gross-fixed (rare, hurts margin in high-VAT countries) vs. net-fixed with VAT added at Checkout (standard SaaS).

  ---
  🟩 Low / housekeeping

  - OQ open-question density is high — OQ-001, OQ-011, OQ-013, OQ-020, OQ-022, OQ-030, OQ-031, OQ-040, OQ-041 are still
  "recommendations." Many will block ship; mark them. — ✅ RESOLVED: OQ doc now tags Decision vs Recommendation; OQ-030/OQ-031 promoted to Decision (ADR-0021); ship-blockers flagged ⛔ (OQ-011 scale, OQ-022 recall quality, OQ-040 minute caps).
  - Webapp-only screens like /account/locale-test — not needed, but should there be an in-app debug page hidden behind
  an env flag? Not required, just flag as a decision.
  - Cross-references: BPR doc links to WUX-013..019, but UJ-001..UJ-010 do not back-reference BPR. Add cross-links for
  graph completeness.
  - WUX-008 vs. UJ-010: WUX says recovery revokes web sessions; UJ-010 says the same — good. But neither says Telegram
  session stays paired by default in normal UI (it's only in UJ-010's step 6). Should appear in WUX too. [RESOLVED: added to WUX-008]
  - Diary has no dedicated requirements file even though MR-002 + FR-041 mention Diary Entries as a first-class object.
  Consider a diary-requirements.md leaf to mirror calendar/memory parity. — ✅ RESOLVED: created docs/requirements/diary-requirements.md (DR-001..008), linked in README.
  - Open Questions doc lacks an "Auth" section, which is conspicuous given how many auth gaps exist. — ✅ RESOLVED: added Authentication section with OQ-005 (Decision, ADR-0006).
  - Styleguide.md isn't loaded into the requirement web — it's referenced but unread by most readers. Consider
  summarizing its load-bearing constraints into WUX-005.

  ---