# User Identity

User Identity owns the language for the person using Anchor, their account, login mechanics, external account connections, and minimal fallback contact information.

## Language

**User**:
An older adult with memory difficulties who uses Anchor directly through Telegram and whose diary, calendar, and memory Anchor maintains.
_Avoid_: Patient, subject, customer

**Older Adult With Memory Difficulties**:
The preferred product-copy phrase for Anchor's target demographic.
_Avoid_: Dementia patient, elderly user, cognitively impaired user

**Dementia Reference**:
A restricted content reference allowed only in SEO pages, help docs, legal/safety disclaimers, and a "Who Anchor may help" page.
_Avoid_: In-app label, general product copy, User description

**Anchor Account**:
The webapp account that belongs to exactly one User and controls that User's Anchor Agent, Google Calendar connection, diary, and memory data.
_Avoid_: Family account, caregiver account

**Account Email**:
The email address on file for the Anchor Account; receives every Magic Link and every recovery notification, and is the sole login identifier.
_Avoid_: Username, login name, primary key

**Magic Link**:
A single-use, short-lived URL emailed to the Account Email that establishes a Web Session when opened; Anchor's only login mechanism.
_Avoid_: Password, password reset link, OTP, one-time password

**Web Session**:
The authenticated browser context established by opening a Magic Link, held in an HttpOnly cookie and revocable by the User or by recovery.
_Avoid_: Login token, JWT, refresh session

**Trusted Person** (DE: Vertrauensperson):
A fallback person designated by the User by email, who can relay a Recovery Link when the User has lost access to the Account Email; has no default access to diary or calendar contents.
_Avoid_: Trusted Contact, Caregiver, admin, family user, account member

**Trusted Person Email**:
The email address the User provides so Anchor can send a Recovery Link to the Trusted Person during a Trusted Person Recovery Request.
_Avoid_: Caregiver login, shared account, emergency account

**User Birthdate**:
Sensitive User profile data required when a Trusted Person is configured; serves as the matching factor a User must supply during a Trusted Person Recovery Request.
_Avoid_: Recovery secret, password hint, public profile data

**User Recovery Identifier**:
The User display name, email, or phone value supplied during a Trusted Person Recovery Request to disambiguate which User the Trusted Person is helping.
_Avoid_: Account enumeration field, public lookup

**User Zipcode**:
Sensitive User profile data collected when a Trusted Person is configured; used only as an additional disambiguation factor when User Recovery Identifier and User Birthdate match more than one User.
_Avoid_: Address, full address, location tracking, recovery secret

**Trusted Person Invitation**:
An email sent to a Trusted Person asking them to accept or decline the User's request to list them as a fallback contact.
_Avoid_: Signup, caregiver invite, access grant

**Pending Trusted Person**:
A Trusted Person whose invitation has been sent but not accepted.
_Avoid_: Unverified caregiver, inactive user

**Verified Trusted Person**:
A Trusted Person who has accepted the invitation and can relay a Recovery Link during a Trusted Person Recovery Request.
_Avoid_: Caregiver, admin, account member

**Trusted Person Recovery Request**:
A recovery request started by the User from the login screen, supplying the Trusted Person Email, the User Birthdate, and a User Recovery Identifier; on success, Anchor emails a Recovery Link to the Verified Trusted Person.
_Avoid_: Caregiver login, admin reset, delegated access, password disclosure

**Recovery Link**:
A single-use, short-lived URL emailed to a Verified Trusted Person during a Trusted Person Recovery Request; opening it lets the Trusted Person submit the User's new email address.
_Avoid_: Password, login link, magic link

**Assisted Email Rebind**:
The recovery outcome in which a Verified Trusted Person uses a Recovery Link to set a new Account Email; Anchor then sends a Magic Link to that new email and the User logs in.
_Avoid_: Assisted Password Reset, password retrieval, sending password, caregiver login

**Recovery Notification**:
An automated message sent to the previous Account Email (best-effort), to the User's Telegram, and to the Trusted Person on initiation and on success of a Trusted Person Recovery Request, recording who triggered the rebind, when, and the new Account Email bound.
_Avoid_: Security alert, marketing email

**Anchor Telegram Bot**:
The single shared Telegram bot every User pairs with; Hermes operates one bot for the whole product, not one bot per User.
_Avoid_: User bot, per-user bot, BotFather instance, custom bot

**Telegram Pairing**:
The act of binding a User's Anchor Account to a specific `telegram_user_id` so the Anchor Agent can speak to that User; initiated from the webapp by generating a Pairing Code the User redeems in the Anchor Telegram Bot via `/start <code>`.
_Avoid_: Telegram login, bot signup, Telegram connect

**Pairing Code**:
An 8-character Crockford-Base32 single-use code with a 15-minute TTL, bound to one Anchor Account, that the User redeems by clicking the deep link to the Anchor Telegram Bot; on first `/start <code>` the code is consumed and the Telegram Pairing is established.
_Avoid_: PIN, password, OTP, login token

**Telegram Re-Pairing**:
The flow an existing User runs from inside an authenticated Web Session to replace a previous Telegram Pairing with a new `telegram_user_id`; generates a fresh Pairing Code, sends a farewell notice to the prior `telegram_user_id` when redeemed, and triggers a security email to the Account Email with a 24-hour undo link.
_Avoid_: Telegram reconnect, account transfer, device change

## Relationships

- A **User** has exactly one **Anchor Account**.
- An **Anchor Account** has exactly one **Account Email** at any time.
- Anchor authenticates Users only by sending a **Magic Link** to the **Account Email**; there is no password, no PIN, and no security question.
- Opening a **Magic Link** establishes a **Web Session** in the browser that opened it; other devices repeat the Magic Link flow.
- A **User** may designate multiple **Trusted Persons**.
- A **Trusted Person** is identified initially by a **Trusted Person Email**.
- Each **Trusted Person** must confirm a separate **Trusted Person Invitation** before becoming a **Verified Trusted Person**.
- Adding **Trusted Persons** is optional but strongly encouraged during onboarding.
- **User Birthdate** is required when the User adds the first Trusted Person.
- **User Birthdate** is a matching factor, not a standalone recovery credential.
- **User Recovery Identifier** is required for a **Trusted Person Recovery Request** and may be User display name, email, or phone.
- **User Zipcode** is required when the User adds the first Trusted Person.
- Anchor collects only **User Zipcode**, not the User's full address.
- **User Zipcode** is normalized and stored separately from any address data.
- **User Zipcode** is only requested when User Recovery Identifier and User Birthdate match multiple Anchor Accounts.
- A **Trusted Person Recovery Request** is started by the User on the login screen using the Trusted Person Email, the User Birthdate, and a User Recovery Identifier.
- A successful **Trusted Person Recovery Request** causes Anchor to email a **Recovery Link** to the **Verified Trusted Person**.
- Only a **Verified Trusted Person** can receive a **Recovery Link**; Pending, declined, removed, or unverified Trusted Persons cannot.
- Opening a **Recovery Link** lets the Verified Trusted Person submit the User's new **Account Email**; this initiates an **Assisted Email Rebind**.
- An **Assisted Email Rebind** sets the new Account Email and triggers a **Magic Link** to that new address; the User clicks it to enter the account.
- An **Assisted Email Rebind** revokes all active **Web Sessions** but does not unpair Telegram or disconnect Google Calendar by default.
- A **Recovery Notification** fires on both initiation and success of a **Trusted Person Recovery Request**.
- A **Trusted Person** receives no lasting login ability after an **Assisted Email Rebind**.
- A **Trusted Person** cannot read diary or calendar contents by default.
- A **Trusted Person** cannot delete, hide, or confirm deletion of the User's memory content in the MVP.
- Anchor has no **Caregiver** role in the initial product model.
- Anchor operates exactly one **Anchor Telegram Bot** for all Users; per-User bots are not supported.
- A **Telegram Pairing** binds an **Anchor Account** to exactly one `telegram_user_id` at a time.
- A **Pairing Code** is single-use, has a 15-minute TTL, and is bound to one **Anchor Account** at issuance.
- **Pairing Code** generation is rate-limited per **Anchor Account** to throttle hostile takeover attempts from a stolen Web Session.
- **Telegram Re-Pairing** is initiated only from inside an authenticated **Web Session**; it does not require a **Trusted Person**.
- A successful **Telegram Re-Pairing** sends a farewell message to the prior `telegram_user_id` and a security email with an undo link to the **Account Email** valid for 24 hours.
- Completing **Telegram Pairing** is a hard prerequisite of the onboarding wizard; an Anchor Account without a Telegram Pairing has no product surface.
- An **Anchor Account** that never completes **Telegram Pairing** is deleted after 90 days of inactivity.

## Example dialogue

> **Dev:** "Was passiert, wenn der User sein Email-Konto verloren hat?"
> **Domain expert:** "Er startet auf der Login-Seite eine **Trusted Person Recovery Request** mit der **Trusted Person Email** und seinem **User Birthdate**. Anchor schickt einen **Recovery Link** an die **Verified Trusted Person**. Die Vertrauensperson öffnet den Link und trägt die neue **Account Email** des Users ein — das ist der **Assisted Email Rebind**. Danach geht ein **Magic Link** an die neue Email, der User klickt rein, fertig."

## Flagged ambiguities

- "user" was used ambiguously. Resolved: the canonical term is **User**, meaning the person with dementia using Anchor directly.
- "caregiver" was considered as a role. Resolved: there is no caregiver role in the initial Anchor product model.
- A **Trusted Person** is not a caregiver and not an account member; it is only a relay for a Recovery Link unless a specific flow explicitly uses it differently.
- "password" appeared in earlier drafts. Resolved: Anchor has no password. Authentication is exclusively Magic Link to Account Email; recovery is exclusively Trusted Person Recovery Request → Recovery Link → Assisted Email Rebind. See ADR-0006.
- "Trusted Contact" was the earlier term. Resolved: renamed to **Trusted Person** (DE: Vertrauensperson) for clarity and to align with the German-targeted product.
- Memory deletion authority is reserved to the **User**. Resolved: a **Trusted Person** cannot delete or hide memories for the User in the MVP.
