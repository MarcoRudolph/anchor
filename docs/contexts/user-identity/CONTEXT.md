# User Identity

User Identity owns the language for the person using Anchor, their account, external account connections, and minimal fallback contact information.

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

**Trusted Contact**:
A fallback person designated by the User by email for account recovery or optional non-response escalation, without default access to diary or calendar contents.
_Avoid_: Caregiver, admin, family user

**Trusted Contact Email**:
The email address the User provides so Anchor can contact a Trusted Contact for recovery or explicitly enabled escalation.
_Avoid_: Caregiver login, shared account, emergency account

**User Birthdate**:
Sensitive User profile data required when Trusted Contact recovery is enabled and used as a matching factor during recovery.
_Avoid_: Recovery secret, password hint, public profile data

**User Recovery Identifier**:
The User display name, email, or phone value supplied during recovery to disambiguate which User the Trusted Contact is helping.
_Avoid_: Account enumeration field, public lookup

**User Zipcode**:
Sensitive User profile data collected when Trusted Contact recovery is enabled, normalized separately from any address, and used only as an additional disambiguation factor during recovery.
_Avoid_: Address, full address, location tracking, recovery secret

**Trusted Contact Invitation**:
An email sent to a Trusted Contact asking them to accept or decline the User's request to list them as a fallback contact.
_Avoid_: Signup, caregiver invite, access grant

**Pending Trusted Contact**:
A Trusted Contact whose invitation has been sent but not accepted.
_Avoid_: Unverified caregiver, inactive user

**Verified Trusted Contact**:
A Trusted Contact who has accepted the invitation and can be used for recovery or explicitly enabled escalation.
_Avoid_: Caregiver, admin, account member

**Trusted Contact Recovery Request**:
A recovery request started by a Verified Trusted Contact using the Trusted Contact Email, the User's birthdate, and a User Recovery Identifier.
_Avoid_: Caregiver login, admin reset, delegated access, password disclosure

**Assisted Password Reset**:
A recovery action where a Verified Trusted Contact sets a new User password after a Trusted Contact Recovery Request succeeds.
_Avoid_: Password retrieval, sending password, caregiver login

## Relationships

- A **User** has exactly one **Anchor Account**.
- A **User** may designate multiple **Trusted Contacts**.
- A **Trusted Contact** is identified initially by a **Trusted Contact Email**.
- Each **Trusted Contact** must confirm a separate **Trusted Contact Invitation** before becoming a **Verified Trusted Contact**.
- Adding **Trusted Contacts** is optional but strongly encouraged during onboarding.
- **User Birthdate** is required when the User adds the first Trusted Contact.
- **User Birthdate** is a matching factor, not a standalone recovery credential.
- **User Recovery Identifier** is required for a **Trusted Contact Recovery Request** and may be User display name, email, or phone.
- **User Zipcode** is required when the User adds the first Trusted Contact.
- Anchor collects only **User Zipcode**, not the User's full address.
- **User Zipcode** is normalized and stored separately from any address data.
- **User Zipcode** is only requested from the Trusted Contact when recovery details match multiple User accounts.
- Any **Verified Trusted Contact** may start a **Trusted Contact Recovery Request** using their **Trusted Contact Email**, the User's birthdate, and a **User Recovery Identifier**.
- A **Trusted Contact Recovery Request** must match an existing **Verified Trusted Contact** on the specific User's Anchor Account, using **User Zipcode** as an extra disambiguation factor only when needed.
- Pending, declined, removed, or unverified Trusted Contacts cannot start an **Assisted Password Reset**.
- A successful **Trusted Contact Recovery Request** may allow an **Assisted Password Reset**.
- An **Assisted Password Reset** creates a new password; it never reveals the old password.
- An **Assisted Password Reset** revokes active web sessions but does not unpair Telegram or disconnect Google Calendar by default.
- A **Trusted Contact** receives no lasting login ability after an **Assisted Password Reset**.
- A **Trusted Contact** cannot read diary or calendar contents by default.
- A **Trusted Contact** cannot delete, hide, or confirm deletion of the User's memory content in the MVP.
- Anchor has no **Caregiver** role in the initial product model.

## Example dialogue

> **Dev:** "When the **User** enters a **Trusted Contact Email**, do we create another Anchor account?"
> **Domain expert:** "No. We send a **Trusted Contact Invitation**. If accepted, they become a **Verified Trusted Contact**, but they still cannot read diary or calendar contents by default."

## Flagged ambiguities

- "user" was used ambiguously. Resolved: the canonical term is **User**, meaning the person with dementia using Anchor directly.
- "caregiver" was considered as a role. Resolved: there is no caregiver role in the initial Anchor product model.
- A **Trusted Contact** is not a caregiver and not an account member; it is only a fallback contact unless a specific flow explicitly uses it.
- Memory deletion authority is reserved to the **User**. Resolved: a **Trusted Contact** cannot delete or hide memories for the User in the MVP.
