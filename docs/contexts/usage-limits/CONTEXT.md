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

**Daily Conversation Minute**:
A unit of active talk time between the User and the Anchor Agent. Active means a User Message and the Anchor Agent's reply turn. Idle silence between turns is not counted. The User has a daily allowance that resets at the User's local midnight.
_Avoid_: Tokens, credits, quota units, API minutes

**Plan**:
Whether the Anchor Account is on Free or Pro. The Plan determines the daily allowance of **Daily Conversation Minutes**. It does not gate any Anchor feature.
_Avoid_: Tier, package, subscription level

**Conversation Turn**:
One User Message plus the Anchor Agent's reply, tracked from `turn_started_at` (User Message accepted) to `delivered_at` (Telegram confirms delivery of the Agent reply with 200 OK); the elapsed time is the only quantity charged against the Daily Conversation Minute allowance.
_Avoid_: Request, exchange, prompt cycle

**Turn Delivery**:
The moment Telegram returns `200 OK` on `sendMessage` or `sendVoice` for the Anchor Agent's reply; the timestamp at which a Conversation Turn becomes billable.
_Avoid_: Response start, streaming start, queue accepted

**Failed Turn**:
A Conversation Turn that aborted before Turn Delivery (LLM error, Telegram rejection, network drop); not charged against the Daily Conversation Minute allowance, retained in `conversation_turn` with `status=failed` for 30 days for forensics.
_Avoid_: Lost message, dropped turn, retry attempt

**User Timezone**:
The IANA timezone string (e.g. `Europe/Berlin`) used to evaluate the User's local midnight; autodetected from the browser at signup via `Intl.DateTimeFormat().resolvedOptions().timeZone` and editable in the webapp account settings.
_Avoid_: UTC offset, fixed offset, server timezone

**Daily Minute Usage Row**:
The per-User per-local-date Postgres row tracking `seconds_used` and `plan_at_reset`; created lazily on the first delivered turn of that local date.
_Avoid_: Counter table, quota record, ledger entry

**Limit Explanation Turn**:
A special Conversation Turn flagged `turn_type='limit_explanation'` that the Anchor Agent uses to answer a User who explicitly asks why responses stopped; charged as zero minutes, capped at one per User per local date.
_Avoid_: Free turn, support turn, system reply

**Silence Refresh Notice**:
A cached static reminder Hermes sends — without an LLM call and without incrementing the Daily Minute Usage — when the User sends a new message more than two hours after the most recent Gentle Limit Notice while still over the daily limit.
_Avoid_: Repeat reminder, nag, retry prompt

**Downgrade Grace**:
The behavior at Pro→Free downgrade in which the currently in-flight Conversation Turn is allowed to deliver under Pro limits even if Turn Delivery happens after the downgrade timestamp; subsequent User Messages are evaluated under the new Plan.
_Avoid_: Refund, prorated quota, mid-turn cutoff

## Relationships

- A **User** has a **Conversation Budget**.
- A **Conversation Budget** is measured over one or more **Rolling Usage Windows**.
- Anchor should support Anthropic-style rolling limits, including a short window such as five hours and a longer weekly window.
- A **User Message** is subject to a **Message Size Limit** before the Anchor Agent processes it.
- Voice messages are transcribed before applying the **Message Size Limit**.
- When the User reaches a **Conversation Budget**, the Anchor Agent sends a **Gentle Limit Notice** rather than exposing model-provider quota language.
- Usage limits protect service reliability and cost, but should preserve the User's trust and avoid sounding punitive.
- A **User** has a **Plan** that sets the size of their **Daily Conversation Minute** allowance.
- The **Conversation Budget** (reliability cap) and the **Daily Conversation Minute** allowance (plan cap) are separate; whichever limit is reached first triggers a **Gentle Limit Notice**.
- The **Daily Conversation Minute** counter resets at the User's local midnight.
- The User's local midnight is evaluated against the **User Timezone**.
- The **User Timezone** is autodetected from the browser at signup and editable in account settings; changing it does not retroactively rewrite the current day's usage.
- A **Conversation Turn** is charged only on **Turn Delivery**; a **Failed Turn** is recorded but not billed.
- The charged amount is the wall-clock interval from `turn_started_at` to `delivered_at`.
- A new **Daily Minute Usage Row** is created lazily on the first delivered turn of a User-local date; no scheduled cron job resets counters.
- A **Conversation Turn** that would exceed the daily allowance at start is not initiated; the previously delivered **Gentle Limit Notice** stands.
- After a **Gentle Limit Notice** has fired today, further User Messages do not trigger new LLM-generated replies until the local-midnight reset; instead, Hermes may send a **Silence Refresh Notice** at most once per two-hour gap.
- A User who asks why responses stopped receives one **Limit Explanation Turn** per local date.
- **Downgrade Grace** protects the active **Conversation Turn** at the moment of a Pro→Free transition.

## Example dialogue

> **Dev:** "If a User talks with Anchor for hours, should the system stay unlimited?"
> **Domain expert:** "No. Anchor should cap message size and rolling usage, similar to Anthropic's short-window and weekly limits, but communicate limits gently."

## Flagged ambiguities

- Exact numeric limits are unresolved. Resolved only at the domain level: Anchor needs per-message and rolling usage limits.
