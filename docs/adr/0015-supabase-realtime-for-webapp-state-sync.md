---
description: "ADR-0015 — The webapp observes onboarding progress, connection health, and plan transitions via Supabase Realtime subscriptions on the User's own rows; a 30-second polling fallback covers Realtime outages."
paths:
  - "../requirements/webapp-ui-ux-requirements.md"
  - "../requirements/user-journeys.md"
  - "../requirements/functional-requirements.md"
  - "./0010-supabase-edge-functions-as-anchor-hermes-api.md"
  - "./0011-nextjs-on-vercel-with-tailwind-and-shadcn.md"
---

# Supabase Realtime for webapp state sync

Status: Accepted

The Anchor webapp observes server-side state changes — Telegram Pairing completion, Google Connection state transitions, Stripe plan changes, voice consent updates — via Supabase Realtime subscriptions on rows the User owns. The Onboarding Wizard, the `/account` overview, and the `/account/plan` view subscribe to `anchor_user WHERE id = auth.uid()` and to a small set of related per-User rows (`google_connection`, `stripe_subscription`); UI badges and progress indicators bind to subscription state and update within roughly half a second of the server-side write. RLS policies confine each Realtime channel to the authenticated User's own rows; no fan-out across Users is configured.

The state-changing writes that drive these updates are concentrated in the Edge Functions defined by ADR-0010. `pairing-redeem` writes `anchor_user.telegram_user_id` and the webapp's onboarding step transitions automatically. `stripe-webhook` writes `anchor_user.plan` and `stripe_subscription.status`, and the `/account/plan` view re-renders with the new plan badge. `hermes-cache-invalidate` for Google External Revocation writes `google_connection.state = 'disconnected_external'`, and the `/account` connection card flips to a warning state with a Re-Consent button.

This design replaces three alternatives. Polling `pairing-status` on a 2-second tick would solve the narrow onboarding case but would not generalize to ongoing UI surfaces; it is also wasteful at idle. A bespoke webhook from Hermes to a Vercel API route would require its own auth, retry, and ordering guarantees that Realtime already provides. Both options would each add a separate sync system; standardizing on Realtime keeps one mental model — "the database is the bus" — for every server→client UI update.

Realtime is not load-bearing for correctness; it is a latency improvement. A 30-second client-side polling fallback re-fetches the same per-User state directly from the database whenever the Realtime channel is closed, throttled, or has been silent past a heartbeat threshold. The polling code path and the subscription path consume the same Supabase query results, so the UI does not need separate branches. Stripe Checkout completion is handled with the same primitive: after Vercel redirects the User back from Checkout, the `/account/plan` view shows a transient "Wird aktiviert…" spinner that resolves the moment the Realtime update from `stripe-webhook` arrives, falling back to polling if the spinner runs longer than ten seconds. The UI never shows "Pro aktiv" until the database row reflects it; this avoids the BPR-009 "no surprises" contradiction that would arise if the webapp optimistically rendered the upgrade ahead of the webhook.

Subscription teardown happens automatically on route change in the App Router via the `useEffect` cleanup. Mobile Safari background-tab behavior closes Realtime channels after a few minutes of inactivity; on tab-focus the client re-subscribes and runs a single catch-up fetch.

Out of scope for MVP: server-sent-events or websocket transport from Hermes directly to the browser (Hermes never talks to the browser), cross-User Realtime channels, offline state queueing, optimistic UI updates ahead of server confirmation, fine-grained Realtime row-level filtering beyond the User-id scope.
