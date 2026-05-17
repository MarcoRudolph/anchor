# Safety

Safety owns the language for account recovery, non-response handling, consent boundaries, and emergency limitations.

## Language

**Recovery Flow**:
A process that helps the User regain access to Anchor when login, Telegram, or Google access is lost.
_Avoid_: Support ticket, caregiver reset

**Trusted Contact Recovery Request**:
A Recovery Flow initiated by a Verified Trusted Contact using the Trusted Contact Email, the User's birthdate, and a User Recovery Identifier.
_Avoid_: Caregiver reset, admin takeover, password disclosure

**User Birthdate**:
Sensitive User profile data required when Trusted Contact recovery is enabled and used as a matching factor during recovery.
_Avoid_: Recovery secret, password hint, public profile data

**User Zipcode**:
Sensitive User profile data collected when Trusted Contact recovery is enabled, normalized separately from any address, and used only as an additional disambiguation factor during recovery.
_Avoid_: Address, full address, location tracking, recovery secret

**Assisted Password Reset**:
A recovery action where a Verified Trusted Contact sets a new User password after a Trusted Contact Recovery Request succeeds.
_Avoid_: Password retrieval, sending password, caregiver login

**Session Revocation**:
Invalidating active web login sessions after a password reset or suspicious recovery event.
_Avoid_: Telegram unpairing, Google disconnect

**Non-response Escalation**:
An optional flow that contacts a Verified Trusted Contact when the User does not respond for a configured period.
_Avoid_: Welfare check, emergency alert

**Emergency Boundary**:
The explicit product limit that Anchor is not an emergency service and cannot guarantee urgent intervention.
_Avoid_: Emergency mode, medical alert

**Consent Boundary**:
A rule defining what Anchor may do with User data and when external contacts may be notified.
_Avoid_: Permission flag, privacy setting

## Relationships

- A **Recovery Flow** may use any **Verified Trusted Contact** designated by the User.
- Any **Verified Trusted Contact** may initiate a **Trusted Contact Recovery Request** using their **Trusted Contact Email**, the User's birthdate, and a **User Recovery Identifier**.
- **User Recovery Identifier** may be User display name, email, or phone and is required to disambiguate the target User.
- **User Zipcode** is required when the User adds the first Trusted Contact.
- Anchor collects only **User Zipcode**, not the User's full address.
- **User Zipcode** is normalized and stored separately from any address data.
- **User Zipcode** is requested from the Trusted Contact only when the initial recovery details match multiple User accounts.
- A **Trusted Contact Recovery Request** must match an existing **Verified Trusted Contact** on the specific User's Anchor Account, using **User Zipcode** as an extra disambiguation factor only when needed.
- Pending, declined, removed, or unverified Trusted Contacts cannot start an **Assisted Password Reset**.
- **User Birthdate** is required when the User adds the first Trusted Contact.
- **User Birthdate** is a matching factor, not a standalone recovery credential.
- A **Trusted Contact Recovery Request** must never disclose an existing password.
- A successful **Trusted Contact Recovery Request** may allow an **Assisted Password Reset**.
- An **Assisted Password Reset** creates a new password; it never reveals the old password.
- An **Assisted Password Reset** triggers **Session Revocation** for active web sessions.
- An **Assisted Password Reset** does not unpair Telegram by default unless the recovery flow is specifically for lost Telegram access.
- An **Assisted Password Reset** does not disconnect the Google Connection by default.
- A **Trusted Contact** receives no lasting login ability after an **Assisted Password Reset**.
- Anchor should notify the User's known channels after an **Assisted Password Reset** when possible.
- **Non-response Escalation** requires an explicitly enabled **Consent Boundary**.
- **Non-response Escalation** may notify a **Verified Trusted Contact**, but does not grant diary or calendar access by default.
- The **Emergency Boundary** must be visible wherever Anchor discusses safety-sensitive behavior.

## Example dialogue

> **Dev:** "If the **User** stops answering, do we call emergency services?"
> **Domain expert:** "No. Anchor can run **Non-response Escalation** to a **Verified Trusted Contact** if enabled, but the **Emergency Boundary** says Anchor is not an emergency service."

## Flagged ambiguities

- "escalation" does not mean medical emergency response. Resolved: use **Non-response Escalation** for optional contact notification only.
