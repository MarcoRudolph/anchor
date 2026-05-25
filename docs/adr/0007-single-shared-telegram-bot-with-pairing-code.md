---
description: "ADR-0007 — Anchor operates one shared Telegram bot for all Users; pairing is an 8-char Crockford-Base32 single-use code with a 15-minute TTL redeemed via deep link."
paths:
  - "../contexts/user-identity/CONTEXT.md"
  - "../requirements/functional-requirements.md"
  - "./0002-hermes-orchestrates-telegram-agent-communication.md"
---

# Single shared Telegram bot with Pairing Code

Status: Accepted

Anchor operates exactly **one Telegram bot** (the Anchor Telegram Bot) for all Users. Every Anchor User pairs with the same bot; per-User bots created via BotFather are not supported. Pairing is performed in the webapp from inside an authenticated Web Session: the webapp generates a **Pairing Code** — 8 characters of Crockford Base32 (`0-9A-HJKMNP-TV-Z`, omitting `I`, `L`, `O`, `U`), single-use, 15-minute TTL, bound to the issuing Anchor Account — and renders a Telegram deep link (`https://t.me/<bot-handle>?start=<code>`) plus a copy-fallback. The User opens the link, Telegram launches `/start <code>` against the Anchor Telegram Bot, Hermes consumes the code, binds the User's `telegram_user_id` to the Anchor Account, and burns the code. Pairing Code issuance is rate-limited per Anchor Account (5 per hour) to throttle takeover attempts from a stolen Web Session.

**Telegram Re-Pairing** uses the same mechanism: an authenticated User triggers "Telegram neu verbinden" in the webapp, receives a fresh Pairing Code, and on successful redemption Hermes sends a farewell message to the prior `telegram_user_id` ("Diese Verbindung wurde durch eine neue ersetzt") and Anchor emails the Account Email with a 24-hour undo link. No Trusted Person is involved; the Web Session is itself the possession factor.

Users without Telegram cannot complete onboarding: Telegram Pairing is a hard prerequisite gate before Stripe Checkout and before the agent surface. The wizard shows a setup guide and a Trusted-Person help prompt rather than silently allowing an account that has no product surface. Anchor Accounts that never complete pairing are deleted after 90 days of inactivity (GDPR data minimization).

One shared bot was chosen over per-User bots because the target audience (older adults with memory difficulties) cannot reasonably be expected to create their own bot through BotFather; per-User bots would also force Hermes into a token-vault and rotation subsystem with no proportional benefit at the projected scale (tens to hundreds of Users, NFR-009). Telegram's global rate limit of 30 messages/second per bot is far above this scale; sharding to additional bots is deferred until empirically required. The trade-off is single-bot blast radius: a Telegram-side spam flag or ban on the shared bot affects all Users at once. Mitigations are conservative outbound content, per-`telegram_user_id` rate limiting in Hermes, and operational readiness to stand up a backup bot if needed.

Crockford Base32 was chosen over hex and over standard Base32 because Pairing Codes may need to be read aloud by a Trusted Person helping the User over the phone; the alphabet excludes the visually and aurally confusable characters `I`, `L`, `O`, `U`. Code length 8 yields ~40 bits of entropy, which combined with the 15-minute TTL and per-account issuance rate-limit is sufficient against online brute force; longer codes would harm the assisted-setup path without measurable security gain.

Out of scope for MVP: per-User bots, BotFather automation, SMS pairing fallback, QR-code pairing (the deep link already encodes the code, no separate QR is needed), automatic re-pairing on Telegram phone-number change without webapp login.
