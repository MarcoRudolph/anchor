# Anchor Webapp UI/UX Requirements

## Purpose

The MVP webapp is a setup, settings, and recovery surface. It must help the User complete a small number of account and connection tasks with low cognitive load. It is not the primary diary, memory, or conversation surface.

Visual direction may reference `docs/styleguide.md`, but Anchor usability, accessibility, privacy, and safety requirements override the styleguide.

## Scope

MVP webapp screens include:

- Public landing page.
- Registration and login.
- Onboarding setup wizard.
- Telegram pairing.
- Google Connection.
- Agent Settings.
- Trusted Contact setup for account recovery.
- Assisted Password Reset.
- Account and connection status.
- Plan view and upgrade (Stripe Checkout / Customer Portal handoff).

MVP webapp screens do not include:

- Diary browsing or editing.
- Memory browsing or editing.
- Context Map visualization.
- Raw transcript browsing.
- Non-response Escalation setup.

## WUX-001 Setup-first information architecture

**Requirement:** The webapp must be organized around setup and account tasks, not a dashboard of memory data.

**Acceptance criteria:**
- Primary navigation exposes setup, settings, recovery, and account areas only.
- The first logged-in experience shows setup progress for Telegram pairing, Google Connection, and Agent Settings.
- The UI does not imply that diary or memory management happens in the webapp.

## WUX-002 Plain, respectful language

**Requirement:** Webapp copy must use plain, respectful, non-clinical language.

**Acceptance criteria:**
- Product copy uses User, not Patient.
- Copy uses "older adults with memory difficulties" only where target-audience context is needed.
- In-app labels avoid dementia, diagnosis, treatment, monitoring, caregiver, and emergency language unless required by legal/help/safety context.
- Instructions are short and action-oriented.

## WUX-003 Low cognitive load forms

**Requirement:** Forms must be short, staged, and forgiving.

**Acceptance criteria:**
- Each setup step asks only for information needed at that moment.
- Long forms are split into clear steps.
- Field labels remain visible while entering data.
- Validation errors explain how to fix the problem without technical jargon.
- Successful completion produces a clear next step.

## WUX-004 Accessibility for older adults

**Requirement:** The webapp must be comfortable for older adults with memory difficulties.

**Acceptance criteria:**
- Text and controls meet WCAG AA contrast at minimum.
- Primary body text is readable on mobile and desktop without relying on tiny microcopy.
- Interactive targets are at least 44x44 CSS pixels.
- Keyboard navigation and visible focus states are supported.
- Error, loading, success, disconnected, and expired states are visible without relying only on color.
- Motion respects reduced-motion preferences.

## WUX-005 Styleguide adaptation

**Requirement:** The Floema-inspired styleguide is adapted for Anchor rather than copied literally.

**Acceptance criteria:**
- Warm off-white, near-black, and restrained yellow accents may be used.
- Yellow is not used for essential low-contrast text.
- Layout may feel calm, spacious, and editorial, but task screens remain direct and scannable.
- Heavy WebGL, scroll-bound storytelling, large route transitions, and decorative motion are not used in MVP setup flows.
- Photography, if used, must support trust and orientation; it must not obscure form tasks or safety copy.

## WUX-006 Connection status clarity

**Requirement:** The User must always understand whether Telegram and Google Calendar are connected.

**Acceptance criteria:**
- Telegram pairing status is visible after onboarding and in settings.
- Google Connection status is visible after onboarding and in settings.
- Disconnected, expired, failed, and reconnect-needed states are distinguishable.
- Reconnection actions are clear and do not expose OAuth or API jargon.

## WUX-007 Agent Settings ergonomics

**Requirement:** Agent Settings must be simple, constrained, and mobile-friendly.

**Acceptance criteria:**
- Daily Check-in Time Setting uses a simple time picker.
- Wellbeing Check-in Setting uses a clear on/off control.
- Reminder Pattern Setting uses a small fixed list, not arbitrary cron-style or numeric scheduling.
- Settings changes confirm what changed and when the Anchor Agent will use the change.

## WUX-008 Recovery and Trusted Contact safety

**Requirement:** Recovery and Trusted Contact flows must be explicit about authority and limits.

**Acceptance criteria:**
- Trusted Contact setup explains that contacts help with recovery only in the MVP.
- Trusted Contacts are not described as caregivers, admins, account members, or emergency contacts.
- Assisted Password Reset explains that it creates a new password and never reveals the old password.
- Recovery success revokes active web sessions and clearly communicates what remains connected.
- Recovery revokes web sessions but, by default, leaves Telegram pairing and Google Connection intact; the UI states this explicitly (mirrors UJ-010 step 6 / ADR-0006).

## WUX-009 Privacy-preserving UI

**Requirement:** The webapp must avoid exposing sensitive diary, memory, transcript, or calendar content unless it is required for the current setup/recovery task.

**Acceptance criteria:**
- Setup pages do not show diary or transcript previews.
- Logs, IDs, embeddings, confidence scores, graph metadata, OAuth token language, and provider quota language are not shown to the User.
- Calendar connection pages explain access in plain terms.
- Any sensitive recovery data collection explains why it is needed.

## WUX-010 Mobile-first completion

**Requirement:** All MVP webapp flows must be completable on a phone.

**Acceptance criteria:**
- Registration, login, Telegram pairing, Google Connection, Agent Settings, Trusted Contact setup, and Assisted Password Reset work on mobile viewports.
- The design avoids hover-only interactions.
- Important actions remain reachable without horizontal scrolling.
- Text does not overlap, truncate critical information, or depend on viewport-scaled font sizes.

## WUX-011 State and failure handling

**Requirement:** Every external dependency flow must have clear user-facing states.

**Acceptance criteria:**
- Telegram pairing includes not-started, pending, connected, failed, and recovery/re-pair states.
- Google Connection includes not-connected, connected, expired, failed, and disconnected states.
- Email invitation includes unsent, sent, accepted, expired, declined, and removed states.
- Failures use plain-language recovery actions.

## WUX-012 No operational dashboard in MVP

**Requirement:** The MVP webapp must not become an operator or caregiver dashboard.

**Acceptance criteria:**
- The User cannot browse raw memory retrieval internals.
- Trusted Contacts cannot access diary, calendar, memory, or setup dashboards.
- Operational metrics and logs are not part of the User webapp.

## WUX-013 Landing page hero

**Requirement:** The public landing page introduces Anchor in a single calm hero block with one primary CTA.

**Acceptance criteria:**
- The hero displays the Rudolpho-AI brand mark: the rotating **Flower-of-Life** icon (per `~/.claude/rules/DESIGN.md`) next to the lowercase wordmark **`anchor`** set in **Unbounded weight 900**, `tracking-tight`, color following the brand-system rule (`text-neutral-900` on light backgrounds, `text-white` on dark). Icon and wordmark share the same `gap-2.5`, `size-7` layout used by Empatify, Rudolpho-Chat, and Date-Talk.
- Directly under the wordmark sit two subheading lines:
  - Line 1: **"your second brain"** — primary subhead, larger weight.
  - Line 2: **"keep track of your daily life"** — supporting line, lighter weight.
  - Both lines pull their strings from the active locale JSON file (see WUX-020); the English text above is the canonical key value. German equivalents live in `de.json`.
- Desktop hero uses `landingpage_desktop.jpg` as a full-bleed background image. The wordmark block (icon + "anchor" + two subhead lines + primary CTA) sits in the **soft-focus left zone**, vertically centered, max-width ~480px. No additional overlay is applied; the image's natural blur is the contrast surface. Text color is near-black on the warm tones, or warm off-white if accessibility contrast on the chosen crop falls below WCAG AA.
- Mobile hero uses `landingpage_mobile.jpg`. Because the elderly couple dominates the frame, the wordmark block sits inside a translucent white card (`bg-white/85` with light backdrop blur) anchored in the **lower third** of the image, with at least 16px outer margin. Card padding is generous; minimum 24px on all sides.
- Primary CTA: localized "Kostenlos starten" / "Start free" linking to `/register`.
- Secondary text link "So funktioniert's" / "How it works" smooth-scrolls to an explainer section below the hero. No second button-style CTA.
- The Flower-of-Life icon uses the `spin-slow` 10s linear infinite animation defined in `~/.claude/rules/DESIGN.md`, and respects `prefers-reduced-motion` per WUX-004.
- The hero respects WUX-002 (plain language), WUX-004 (accessibility), and WUX-010 (mobile-first).

## WUX-014 Pricing section on landing

**Requirement:** The landing page contains a single, simple pricing section below the explainer.

**Acceptance criteria:**
- Two cards side-by-side on desktop and stacked on mobile: **Free** and **Pro €10/Monat**.
- Each card lists at most four bullets focused on Daily Conversation Minutes.
- Card copy never names tokens, credits, quotas, or "tiers".
- "Jederzeit kündbar" is shown adjacent to the Pro price, per BPR-005.
- The Pro card CTA is "Auf Pro upgraden" and routes to `/register?next=/account/plan?intent=upgrade` for unauthenticated visitors and to `/account/plan` for logged-in Users.

## WUX-015 Three-step setup wizard

**Requirement:** Post-registration, the User completes a three-step setup wizard.

**Acceptance criteria:**
- Steps: (1) Verify email, (2) Pair Telegram, (3) Connect Google Calendar.
- Progress is shown as "1 / 3", "2 / 3", "3 / 3" — never as a percentage.
- Telegram step exposes one large "Telegram öffnen" deep-link button with the pairing code prefilled, plus the pairing code in 24pt monospace as a manual-paste fallback.
- After step 2 completes, the wizard shows the message "Du kannst jetzt schon mit deinem Agenten sprechen." Step 3 is **skippable** from this point on without exiting the wizard.
- Each step uses at most one form or one action; per WUX-003.
- The wizard runs on Free; no payment step appears in setup.

## WUX-016 Plan view

**Requirement:** `/account/plan` is the single place the User sees and changes their plan.

**Acceptance criteria:**
- Page shows current plan name ("Free" or "Pro"), today's remaining Daily Conversation Minutes in plain language (e.g., "Heute noch 47 Minuten"), and the User-local reset time ("Erneuert um 00:00").
- If plan is Free: a single primary button "Auf Pro upgraden" routes to Stripe Checkout (BPR-005 price block displayed next to it).
- If plan is Pro: a single primary button "Abo verwalten" opens the Stripe Customer Portal; under it shows `current_period_end` in plain language ("Verlängert am 12. Juni 2026") and, if `cancel_at_period_end` is true, a "Wird gekündigt am …" notice.
- No graphs, no minute-by-minute history, no transcripts.
- Page respects WUX-009 (privacy-preserving UI).

## WUX-017 In-context upgrade prompt

**Requirement:** When the User has exhausted their Daily Conversation Minutes, the webapp may surface a single, dismissible non-modal banner on their next login.

**Acceptance criteria:**
- Banner copy: "Heute war's viel — magst du mehr Zeit pro Tag?" with a single button "Pro ansehen" → `/account/plan`.
- Banner is shown at most once per 7 days regardless of repeated exhaustion.
- Banner is never modal, never inside the Telegram conversation, and never inserted via the Anchor Agent's voice.
- Dismissal is persisted server-side; per BPR-009 (no surprises).

## WUX-018 Upgrade flow

**Requirement:** The upgrade flow must complete in one Stripe-hosted screen, then return the User to a clear confirmation.

**Acceptance criteria:**
- Trigger: clicking "Auf Pro upgraden" anywhere in the webapp.
- The User is redirected to Stripe Checkout in the same tab.
- On success, Stripe redirects back to `/account/plan?upgraded=1`.
- The page shows a one-line success toast: "Pro ist aktiv. Vielen Dank!" and the plan badge updates immediately.
- The webapp never renders a card form, CVC field, or address form itself.
- Failure or cancellation returns the User to `/account/plan` without any error toast more technical than "Upgrade abgebrochen".

## WUX-019 Visible plan badge

**Requirement:** The User's current plan is visible only in the account-menu area of the webapp, never in chat or in the Anchor Agent's messages.

**Acceptance criteria:**
- The top-right account menu shows a small "Free" or "Pro" badge.
- The badge is never overlaid on diary, memory, or setup content.
- The Anchor Agent never names the plan, never says "Pro", and never references the price.

## WUX-020 Internationalization (English and German)

**Requirement:** The webapp supports **English (`en`)** and **German (`de`)** in MVP. Every user-facing string — including landing copy, setup wizard, plan view, Gentle Limit notices rendered in the webapp, error messages, and toasts — is sourced from per-locale JSON files. No hard-coded display strings in components.

**Acceptance criteria:**
- Locale files live at a single conventional path (`/locales/en.json`, `/locales/de.json`) with a nested key namespace that mirrors view structure (e.g., `hero.subhead_primary`, `hero.cta_primary`, `plan.minutes_remaining`, `wizard.step_telegram.title`).
- Both locales must define the same set of keys; CI fails the build if a key is missing on either side.
- Default locale is German (`de`). Anonymous visitors are served the locale matching `Accept-Language` if it is `en` or `de`; otherwise `de`.
- Logged-in Users have a `locale` field on their profile, settable from Agent Settings; this value overrides browser detection.
- Locale switch is reflected in the URL via a `/en` or `/de` prefix so that shared links open in the same language.
- The brand wordmark `anchor` is **not** translated and never appears in the locale files.
- Anchor Agent (Telegram) messages are out of scope for this requirement; they are handled by Hermes with its own localization rules and must match the User's webapp `locale`.
- Date, time, currency, and number formatting follows the active locale (`Intl` APIs); the price block always shows `€` regardless of locale per BPR-005.
- The plan badge ("Free" / "Pro") is treated as a brand label and is identical across locales.

**Acceptance criteria — canonical hero copy keys:**

| Key | `en` | `de` |
|-----|------|------|
| `hero.subhead_primary` | "your second brain" | "dein zweites Gedächtnis" |
| `hero.subhead_secondary` | "keep track of your daily life" | "behalte deinen Alltag im Blick" |
| `hero.cta_primary` | "Start free" | "Kostenlos starten" |
| `hero.cta_secondary` | "How it works" | "So funktioniert's" |

These exact strings are the canonical defaults; copy may be refined later but always lives in the JSON files, never in JSX.

## WUX-021 Landing trust and reassurance block

**Requirement:** A trust/reassurance block sits below the hero and above pricing, carrying plain-language safety and privacy reassurance for a scam-wary, elderly-and-family audience. (Source ADR: `docs/adr/0022-landing-page-trust-signals-and-aeo.md`.)

**Acceptance criteria:**
- Four scannable items (icon + one line), strings from locale JSON (WUX-020): (1) not a medical device / no substitute for care, doctor, or emergency services; (2) data is encrypted and belongs to the User; (3) cancellable anytime, no hidden costs; (4) data is never sold.
- Item (1) medical-device disclaimer is mandatory copy, not optional marketing.
- No fear-based copy; respects WUX-002 and WUX-004 (contrast, not color-only).
- Testimonials/social proof slot is reserved but ships empty until real consented pilot quotes exist; no fabricated reviews.
- An optional product-demo clip (no real user data) MAY occupy this zone later; not an MVP blocker.

## WUX-022 Legal and trust footer

**Requirement:** A persistent footer on every page, including the landing page, exposes the legal surfaces and operator identity. (Satisfies CR-001; source ADR-0022.)

**Acceptance criteria:**
- Footer links `/impressum`, `/datenschutz`, `/agb`, `/widerruf`, a `kontakt` mailto, and shows operator name "Rudolpho AI".
- Footer is present on the landing page and all webapp pages (§5 DDG reachability).
- Links are always visible, never color-only (WUX-004).

## WUX-023 AEO-structured landing content

**Requirement:** The landing page renders crawlable, answer-engine-extractable content so Anchor can be cited by ChatGPT/Perplexity. (Source ADR-0022; aligns with global AEO rules.)

**Acceptance criteria:**
- A server-rendered FAQ section below pricing answers real buyer questions; each answer leads with the direct answer in sentence one, then one short supporting paragraph.
- The same Q&A pairs are emitted as `FAQPage` JSON-LD; organization identity as `Organization` JSON-LD.
- A one-paragraph definition block describes Anchor in plain terms for extraction.
- FAQ, definition, and reassurance strings live in locale JSON (WUX-020), German authoritative.
- Sections are statically rendered (not client-only), reachable without auth, with sane `<title>`, meta description, canonical URL, and Open Graph tags.

## WUX-024 Empty and edge-state content

**Requirement:** Webapp screens define explicit content for the in-between and never-configured states, not just the happy path.

**Acceptance criteria:**
- **Plan activation window:** between Stripe Checkout success and webhook arrival, `/account/plan` shows a transient "Pro wird aktiviert …" state, not a stale "Free" badge; the badge flips to "Pro" on the Supabase Realtime plan-state event (ADR-0015), with reconciliation (ADR-0016) as the fallback. No client polling and no false-immediate claim.
- **Google never connected:** account/connection screens distinguish "noch nicht verbunden" (never connected) from "expired/failed/disconnected" (WUX-006/WUX-011); copy explains the morning check-in works without calendar but is richer with it.
- **Abandoned setup:** a User who registers but never pairs Telegram is handled by a scheduled reminder/cleanup job (ADR-0019), not left as a silent dead account; reminder and deletion timing are operator-configurable.
- States use plain language (WUX-002) and never expose webhook, polling, or provider internals (WUX-009).
