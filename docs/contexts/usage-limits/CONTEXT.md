# Usage Limits

Usage Limits owns the language for how Anchor caps conversation length and total model usage so the service remains predictable and affordable.

## Language

**Conversation Budget**:
The maximum amount of model input and output a User can consume within a rolling usage window.
_Avoid_: Unlimited chat, hidden throttling

**Message Size Limit**:
The maximum length of a single User Message, including transcribed voice text, that Anchor will process at once.
_Avoid_: Arbitrary cutoff, silent truncation

**Rolling Usage Window**:
A time-bounded period, such as five hours or one week, used to measure Conversation Budget consumption.
_Avoid_: Billing cycle, subscription period

**Gentle Limit Notice**:
A simple, non-technical message explaining that the User has reached a temporary usage limit and when they can continue.
_Avoid_: API quota error, token exhaustion, rate-limit failure

## Relationships

- A **User** has a **Conversation Budget**.
- A **Conversation Budget** is measured over one or more **Rolling Usage Windows**.
- Anchor should support Anthropic-style rolling limits, including a short window such as five hours and a longer weekly window.
- A **User Message** is subject to a **Message Size Limit** before the Anchor Agent processes it.
- Voice messages are transcribed before applying the **Message Size Limit**.
- When the User reaches a **Conversation Budget**, the Anchor Agent sends a **Gentle Limit Notice** rather than exposing model-provider quota language.
- Usage limits protect service reliability and cost, but should preserve the User's trust and avoid sounding punitive.

## Example dialogue

> **Dev:** "If a User talks with Anchor for hours, should the system stay unlimited?"
> **Domain expert:** "No. Anchor should cap message size and rolling usage, similar to Anthropic's short-window and weekly limits, but communicate limits gently."

## Flagged ambiguities

- Exact numeric limits are unresolved. Resolved only at the domain level: Anchor needs per-message and rolling usage limits.
