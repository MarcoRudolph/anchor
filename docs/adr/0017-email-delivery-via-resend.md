---
description: "ADR-0017 — Anchor sends all transactional email through Resend with React Email templates; DKIM/SPF/DMARC are configured on the sending domain, and bounce webhooks mark dead addresses in the database to gate further sends."
paths:
  - "../requirements/infrastructure-requirements.md"
  - "../requirements/functional-requirements.md"
  - "./0006-passwordless-magic-link-auth-with-trusted-person-recovery.md"
  - "./0011-nextjs-on-vercel-with-tailwind-and-shadcn.md"
---

# Email delivery via Resend

Status: Accepted

All transactional email — Magic Link login, Trusted Person Invitations, Recovery Notifications, Telegram Re-Pairing security alerts, voice consent confirmations — is sent through Resend (`resend.com`) from a verified sending domain (`anchor.com`). Email templates are authored with React Email and rendered server-side; the same component code produces the HTML and plain-text variants, so localization changes do not need duplicate maintenance. Stripe payment receipts are not relayed through Anchor; Stripe sends those directly from its own infrastructure with the Customer email already on file.

Resend was chosen over AWS SES and Postmark on three criteria. First, deliverability for low-volume transactional mail in Germany is strong on Resend with minimal warmup. Second, the API and the React Email integration map cleanly onto the Next.js stack (ADR-0011) without a separate templating engine. Third, the free tier (3,000 emails/month) covers the pilot scale (NFR-009) without billing setup. AWS SES is cheaper per email at scale but requires manual DKIM/SPF setup, sandbox-mode exit, and bounce handling wiring that is not worth the saved cents at MVP volume. Postmark has best-in-class transactional branding and reputation but at a higher per-email price than the volume warrants.

DKIM, SPF, and DMARC records are configured at the DNS level for `anchor.com` per Resend's domain-verification guide. DMARC is set to `p=quarantine` initially and ratcheted to `p=reject` after two weeks of clean delivery. The `From` address is `noreply@anchor.com` for system mail and `vertrauen@anchor.com` for Trusted Person Invitations, which raises perceived trust at the moment a recipient must decide whether to act on the invite. Reply-Tos route to a monitored `kontakt@anchor.com` mailbox.

Bounce handling is wired through Resend webhooks to an Edge Function `email-bounce`, which writes `anchor_user.email_bounced_at TIMESTAMPTZ NOT NULL DEFAULT NULL` on the affected User. Magic Link sends check this column before queueing a send: if a bounce was recorded within the last 24 hours the send is skipped and the UI shows a copy block explaining that the address appears undeliverable and prompting the User to verify it. The bounce flag clears automatically the next time the User completes Trusted Person Recovery or otherwise updates the Account Email. Hard bounces from Trusted Person addresses mark the Trusted Person row instead so the User can be alerted to update their fallback contact.

Per-User send-rate caps prevent abuse loops: Magic Link emails are rate-limited to three per hour per Account Email, Trusted Person Invitations to ten per day per Anchor Account, and Re-Pairing security alerts are coalesced if more than one fires within five minutes (only the first goes out, with a "(plus N more events)" addendum on the next outbound). All sends are logged in `email_log(message_id, anchor_user_id, type, status, sent_at)` for forensics; payload bodies are not stored (the templates plus the input row are sufficient to reconstruct any specific message).

Out of scope for MVP: marketing or newsletter email (no list management, no campaign tooling), email-based commands (the agent surface is Telegram), inbound email parsing, multiple sending domains, dedicated IP pools, email-preview tooling beyond Resend's built-in dev mode, push notifications as a Magic-Link replacement.
