---
description: "Anchor Free vs Pro plan rules, Stripe subscription lifecycle, and daily Conversation Minute enforcement."
paths:
  - "./README.md"
  - "./agent-behavior-requirements.md"
  - "./webapp-ui-ux-requirements.md"
  - "./functional-requirements.md"
  - "../adr/0005-stripe-subscription-for-pro-conversation-minutes.md"
  - "../contexts/usage-limits/CONTEXT.md"
---

# Anchor Billing and Plans Requirements

## Purpose

Anchor monetizes by offering one paid plan, **Pro**, that lifts the User's daily talk time with the Anchor Agent. The default plan is **Free**. Billing language stays out of the agent surface; the webapp owns plan management and upgrade.

These requirements define which behaviors are billable, what is shown to the User, and how subscription state is mirrored in Anchor's own database.

## Scope

In scope (MVP):

- Two plans: Free and Pro.
- One billing unit: **Daily Conversation Minutes** with the Anchor Agent.
- Stripe-hosted Checkout and Customer Portal.
- Plan-state mirror in Anchor's Supabase.
- Gentle, non-pushy exhaustion handling.

Out of scope (MVP):

- Annual or multi-tier plans.
- Trial periods, coupons, A/B priced experiments.
- Family/Trusted Contact billing.
- In-app card collection.

**Source context:** `docs/contexts/usage-limits/CONTEXT.md`
**Source ADR:** `docs/adr/0005-stripe-subscription-for-pro-conversation-minutes.md`

## BPR-001 Two plans only

**Requirement:** Anchor offers exactly two plans in MVP — Free and Pro.

**Acceptance criteria:**
- Every Anchor Account is on exactly one plan at any time.
- A new Anchor Account starts on Free without a payment step.
- No trial, no hidden tier, no usage-pack add-on in MVP.

## BPR-002 Unit of value is the Daily Conversation Minute

**Requirement:** Pro increases the User's **Daily Conversation Minutes** allowance with the Anchor Agent. No other capability differs between Free and Pro in MVP.

**Acceptance criteria:**
- Free allowance: a small daily minute budget (placeholder 15 min/day; final value tracked in `open-questions.md`).
- Pro allowance: a generous daily minute budget (placeholder 120 min/day; final value tracked in `open-questions.md`).
- Budget resets at the User's local midnight.
- Anchor's feature set (diary, memory, calendar, check-ins, recovery, trusted contact) is identical on both plans.

## BPR-003 What counts as a minute

**Requirement:** A Daily Conversation Minute is consumed only by **active** agent conversation.

**Acceptance criteria:**
- Active turn: from when the agent begins composing a reply to a User Message until the reply is delivered.
- Idle silence between turns does not consume minutes.
- Proactive Check-in messages do not consume minutes unless the User replies; the User's reply turn does.
- Recovery-related transactional messages (pairing confirmations, password reset notices) do not consume minutes.
- One-way system notifications never consume minutes.

## BPR-004 Gentle Limit Notice on exhaustion

**Requirement:** When the User reaches their Daily Conversation Minutes budget, the Anchor Agent sends a **Gentle Limit Notice** that follows the rules of `ABR-050` and references `ABR-051`.

**Acceptance criteria:**
- Notice is one short message in Good Friend Voice.
- Notice says when minutes reset (e.g., "morgen früh" / "tomorrow morning").
- Notice does not mention tokens, quotas, rate limits, or Stripe.
- Notice optionally points the User to the webapp for "Mehr Zeit pro Tag" — never repeated within the same exhausted day.

## BPR-005 Pricing display

**Requirement:** Pro is priced at **€10 per month** in EUR for MVP.

**Acceptance criteria:**
- Price is shown VAT-inclusive on the landing pricing section and on `/account/plan`.
- "Jederzeit kündbar" / "Cancel anytime" is displayed adjacent to the price every time the price is shown.
- No discount language, no scarcity, no countdown.
- Currency is EUR only; no currency switcher in MVP.

## BPR-006 Subscription lifecycle

**Requirement:** Stripe is the source of truth for subscription state. Anchor mirrors plan state into its own database so Hermes can enforce limits without a per-message round-trip to Stripe.

**Acceptance criteria:**
- Anchor's webapp consumes Stripe webhooks: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`.
- A `anchor_user_plan` row exists per Anchor Account with fields: `anchor_user_id`, `plan` (`free`|`pro`), `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`, `cancel_at_period_end`, `payment_failed_at`, `updated_at`.
- Plan-state changes are idempotent against repeated webhook deliveries.
- Hermes reads plan state from the Anchor backend; it never calls Stripe directly.

**Source ADR:** `docs/adr/0002-hermes-orchestrates-telegram-agent-communication.md`

## BPR-007 Failed payment grace

**Requirement:** A failed Pro renewal does not immediately strip access.

**Acceptance criteria:**
- On `invoice.payment_failed`, the Pro allowance remains for **24 hours** from the failure timestamp.
- During grace, the webapp shows a single non-modal banner asking the User to update their card.
- If payment is not resolved at grace end, plan flips to Free; the agent sends one Gentle Limit Notice the next time minutes are exhausted, not before.
- The webapp never sends its own dunning emails; Stripe's standard dunning is the only channel.

## BPR-008 Cancellation

**Requirement:** The User can cancel Pro at any time without contacting support.

**Acceptance criteria:**
- `/account/plan` exposes "Abo verwalten" linking to Stripe Customer Portal.
- After cancellation, the User keeps Pro until `current_period_end`.
- After `current_period_end`, plan flips to Free and `anchor_user_plan` reflects it.
- Cancellation never deletes diary, memory, calendar, or recovery data.

## BPR-009 No surprises

**Requirement:** Anchor must not nag, gate mid-conversation, or insert upsell into the agent's voice.

**Acceptance criteria:**
- No "80% used" warnings during conversation.
- No badges in chat referencing the plan.
- No Anchor Agent message that names the Pro plan; upgrade lives in the webapp only.
- Limit notices appear only on actual exhaustion.

## BPR-010 Refunds

**Requirement:** Refunds are manual in MVP.

**Acceptance criteria:**
- A refund request is handled by an operator via the Stripe dashboard.
- A refunded period does not retroactively erase that period's conversation data.
- The webapp does not offer a self-serve refund button.

## BPR-011 Tax, receipts, and PCI

**Requirement:** The webapp does not handle card data.

**Acceptance criteria:**
- All card collection happens on Stripe-hosted Checkout.
- Stripe Tax is enabled; VAT is computed by Stripe.
- Invoice receipts are mailed by Stripe directly to the User's billing email.
- Anchor's database stores only Stripe identifiers — never PAN, CVC, or full BIN.

## Relationships to other requirements

- **ABR-050 / ABR-051 — Gentle Limit Notice / Minute-budget exhaustion notice:** how the agent talks when BPR-004 fires.
- **WUX-013..WUX-019 — Landing, pricing, plan view, upgrade flow:** how the User sees plans.
- **UJ-011..UJ-013 — Upgrade, manage subscription, failed payment:** end-to-end flows.
- **FR-061 Conversation Budget:** a safety/reliability cap that is separate from the plan budget; whichever limit is reached first applies.
