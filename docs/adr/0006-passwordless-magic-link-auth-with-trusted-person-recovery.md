---
description: "ADR-0006 — Anchor uses passwordless email magic-link auth; recovery is handled by a Trusted Person flow gated by birthdate."
paths:
  - "../contexts/user-identity/CONTEXT.md"
  - "../requirements/functional-requirements.md"
---

# Passwordless magic-link auth with Trusted Person recovery

Status: Accepted

Anchor authenticates Users with **email + magic link** only. There is no password, no password reset, and no PIN. A login is an email-delivered one-time link (single-use, short TTL) that establishes an HttpOnly session cookie on the device that opened the link. New devices repeat the magic-link flow; the "identity" lives in the email inbox the User controls, not in a secret the User must remember.

Account recovery is performed by a **Trusted Person** (DE: Vertrauensperson) the User has previously designated by email. When the User has lost access to the email on file or has forgotten which email he used, he submits the Trusted Person's email plus his own birthdate (with zipcode as a tiebreak when multiple Users match). Anchor sends a single-use **recovery link** to the Trusted Person's email; the Trusted Person opens it and submits the User's new email; Anchor then sends a **magic login link** to that new email, which the User clicks to enter the account. The new email becomes the email on file. All active web sessions are revoked; Telegram pairing and Google Calendar connection remain intact by default.

Notifications fire to the old email (best-effort), to Telegram, and to the Trusted Person on initiation and on success, recording who triggered the rebind, when, and the new email bound. The Trusted Person never holds persistent credentials, never sees a password (there are none), and receives no lasting login ability after the flow completes.

Magic link was chosen over passwords because Anchor's target audience is older adults with memory difficulties: passwords are the dominant cause of support contact and signup abandonment in this demographic, and removing them eliminates an entire NFR surface (breach-check, strength rules, hashing, lockout, password reset). Magic link was chosen over Google OAuth as the primary factor because OAuth would tie launch readiness to Google's app-verification timeline (months) and exclude Users who do not have or do not want a Google account; Google OAuth is still used separately for Calendar scope after login. Email is already a hard dependency of the product (verification, Trusted Person invites, Stripe receipts), so magic link reuses a channel that must be operated regardless.

Trusted Person recovery was chosen over self-service password reset (impossible without passwords) and over support-ticket recovery (does not scale, leaks a social-engineering surface). Recovery is rate-limited per Anchor Account and per Trusted Person email; repeated failed attempts pause the flow rather than locking the User out.

Two-factor authentication is deliberately deferred. A magic link delivered to a verified email is itself a possession factor; layering TOTP on top of an audience that struggles with passwords would suppress activation without a proportional security gain. TOTP MAY be added later as opt-in.

Out of scope for MVP: WebAuthn / passkeys, social login other than Google Calendar OAuth, SMS as a recovery channel, account-takeover insurance.
