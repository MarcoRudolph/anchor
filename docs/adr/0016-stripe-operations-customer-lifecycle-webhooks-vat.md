---
description: "ADR-0016 — Stripe operational specifics: Customer is created at signup, Price IDs live in an `app_config` table, webhooks are idempotent on Stripe event-id with hourly reconciliation, outbound calls carry composite idempotency keys, and VAT is net-fixed with country-specific markup at Checkout."
paths:
  - "../requirements/billing-and-plans-requirements.md"
  - "../requirements/functional-requirements.md"
  - "./0005-stripe-subscription-for-pro-conversation-minutes.md"
  - "./0010-supabase-edge-functions-as-anchor-hermes-api.md"
---

# Stripe operations: customer lifecycle, webhooks, VAT

Status: Accepted

A Stripe Customer is created at the moment of Magic-Link email verification, before the User ever sees a Checkout page. The signup-side Edge Function calls `stripe.customers.create({ email, metadata: { anchor_user_id } })` and writes the returned `stripe_customer_id` onto the `anchor_user` row. This eliminates the runtime branch "do we have a customer or do we need to create one" at upgrade time, preserves invoice history across cancel/re-subscribe cycles by reusing the same Customer, and makes future tooling (refunds, support lookups) keyable on `anchor_user_id`. The Customer carries no payment method at this point — that is collected at Checkout.

Product and Price IDs are not hard-coded. They live in a single-row `app_config` table with columns `(key text PK, value text, env text)`, queried at startup and on a 60-second TTL. Required keys include `stripe_price_pro_monthly_de` and `stripe_webhook_signing_secret`. A `STRIPE_MODE` environment variable selects the test/live row pair. This keeps Test and Live environments deployable from the same code, surfaces config drift at boot, and avoids the failure mode where a `.env.production` shadow holds the only copy of a critical ID.

Webhooks are idempotent on the Stripe event-id. The webhook handler attempts `INSERT INTO stripe_event_log (id, payload, processed_at) VALUES (...) ON CONFLICT (id) DO NOTHING`; if the insert affects no rows the event is treated as already processed and the handler returns 200 without re-running side effects. Side effects (plan flip, subscription state mutation) run in the same transaction as the insert so partial completion is impossible. The webhook endpoint is `https://anchor.com/api/stripe/webhook`, implemented as a Next.js Route Handler on Vercel, and verifies signatures via `stripe.webhooks.constructEvent` against the signing secret pulled from `app_config`. No IP allowlist is used; signature verification is the sole authentication surface and matches Stripe's documented stance.

Reconciliation runs as a scheduled job every 60 minutes. The job lists all `stripe_subscription` rows that are not cancelled and whose `updated_at` is older than one hour, fetches the canonical state from Stripe, and writes any divergences with the same idempotent-write pattern. This closes the window between a missed or delayed webhook and the User's UI catching up, capping plan-state staleness at one hour even when webhooks are completely failing. Three consecutive webhook delivery failures from Stripe raise an operational alert independent of the reconciliation pass.

Outbound Stripe calls always carry an idempotency key composed of `<anchor_user_id>:<intent>:<utc_minute>`. `intent` is the verb of the call (`checkout_session_create`, `subscription_cancel`, `subscription_resume`). The minute granularity catches accidental double-submissions from impatient clicks while still allowing legitimate retries across minute boundaries. Stripe stores the key for 24 hours and returns the original response on repeat.

VAT handling is net-fixed with country-specific addition at Checkout. The pricing surface displays the German default both ways: `€8,40 zzgl. MwSt., €10,00 inkl. 19% MwSt. (DE)`. Customers in other EU countries see a Checkout total calculated by Stripe Tax against their country's rate; the displayed inclusive figure on the marketing page is qualified `(DE)`. This reverses the literal reading of BPR-005's "VAT-inclusive" wording, which is incompatible with multi-country variability — BPR-005 is updated to state that €10 inclusive is the German baseline and other EU countries see country-specific totals. VAT-ID collection for B2B is not handled in MVP; the assumption is that target Users are private consumers.

Out of scope for MVP: usage-metered billing on top of subscription, plan tiers beyond Free and Pro, refund automation (operator-handled per BPR-010), discount coupons, gift subscriptions, B2B VAT-ID collection, cross-currency invoicing.
