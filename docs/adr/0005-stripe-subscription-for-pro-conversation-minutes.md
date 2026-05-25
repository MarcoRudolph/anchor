# Stripe subscription for Pro Conversation Minutes

Status: Accepted

Anchor monetizes via one paid plan, **Pro**, at **€10/month**, sold through **Stripe Checkout** and managed through the **Stripe Customer Portal**. The product unit sold is **Daily Conversation Minutes** with the Anchor Agent — Pro raises the daily allowance; no other capability is gated.

Plan state is **mirrored** from Stripe into Anchor's own Supabase in an `anchor_user_plan` row keyed by `anchor_user_id`. Stripe remains the source of truth for billing; Anchor's database is the source of truth for runtime enforcement. Hermes (per ADR-0002) reads plan state from the Anchor backend and never calls Stripe at request time, preserving the orchestrator/webapp split. The mirror table follows the conventions of ADR-0004: explicit user FK, no free-form jsonb, integers/timestamps for state.

The User pays directly. In MVP there is no family payer, no Trusted-Contact billing, no trial, and no annual plan. Card collection happens only on Stripe-hosted surfaces; Anchor stores no PAN, CVC, or BIN — only Stripe identifiers (`stripe_customer_id`, `stripe_subscription_id`). Stripe Tax computes VAT; Stripe mails receipts.

Conversation Minutes were chosen over message- or token-based units because the elderly target audience reads "Min." trivially, and minutes insulate pricing from underlying model-cost changes. Subscription was chosen over one-time top-ups because recurring revenue keeps the math simple for the User ("Heute noch 47 Min.") and predictable for us. Stripe was chosen over Paddle / Lemonsqueezy because Stripe is already in the Rudolpho-AI stack and the team already operates it.

Why mirror plan state in Postgres rather than call Stripe at runtime:
- Hermes must enforce the budget on every User Message in Telegram; a per-message Stripe call would add latency and create a brittle external dependency in the hot path.
- Webhook idempotency in our database is straightforward; runtime Stripe failures are not.
- ADR-0002 places conversation flow and tool calls inside Hermes and stable state behind Anchor APIs — billing state belongs to the latter.

Consequences:
- Webhook handler reliability is now part of Anchor's correctness contract. Lost or out-of-order webhooks must converge via Stripe's signed retries plus a periodic reconciliation job.
- Cancellations remain effective until `current_period_end`; downgrades happen at that boundary, not at click time.
- Failed payments get a 24-hour grace window at Pro minutes before auto-downgrade; this is captured in BPR-007.

Out of scope of this ADR: which webhook framework to use, the exact minute caps (placeholder values are tracked in `open-questions.md`), and any future shift to outcome-based pricing.

**Related:**
- `docs/requirements/billing-and-plans-requirements.md`
- `docs/adr/0002-hermes-orchestrates-telegram-agent-communication.md`
- `docs/adr/0004-anchor-specific-memory-index-instead-of-ob1-thoughts.md`
- `docs/contexts/usage-limits/CONTEXT.md`
