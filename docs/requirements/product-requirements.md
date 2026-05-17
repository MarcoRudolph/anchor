# Anchor Product Requirements

## Problem

Older adults with memory difficulties can lose track of appointments, daily events, conversations, and personal facts. Existing calendar, notes, and diary tools require too much deliberate organization. Anchor provides a low-friction conversational second brain through Telegram, backed by a webapp for setup and settings.

## Target User

The **User** is an older adult with memory difficulties who uses Anchor directly through Telegram. Anchor is non-clinical and must not frame the User as a patient.

Preferred product-copy phrase: **older adults with memory difficulties**.

## Product goals

- Help the User remember upcoming events.
- Help the User maintain a lightweight diary through natural conversation.
- Help the User recover forgotten information by asking the Anchor Agent.
- Reduce friction by supporting voice and text through Telegram.
- Let the User connect Google Calendar from the webapp.
- Let the User manage a small set of agent settings in the webapp.
- Preserve a warm companion feeling rather than a clinical or productivity-tool feeling.

## Product non-goals

- Anchor is not a medical device.
- Anchor is not an emergency response service.
- Anchor is not a caregiver dashboard in the MVP.
- Anchor does not give medical advice.
- Anchor does not create a shared family account model in the MVP.
- Anchor does not expose raw retrieval internals, confidence scores, embeddings, or graph metadata to the User.

## Core product principles

1. **Low friction beats perfect confirmation.** When intent, date, and time are clear, Anchor acts and acknowledges.
2. **Everything said to Anchor can be memorable source evidence.** Not every conversation creates a structured Memory Fact, but conversations are recallable evidence.
3. **The User remains the authority.** The User can correct and delete memories.
4. **Friendly, not childish.** The Anchor Agent uses Good Friend Voice: warm, respectful, simple, and never infantilizing.
5. **Trusted Contacts are fallback contacts, not caregivers.** They do not get default diary or calendar access.
6. **Safety claims stay modest.** Anchor may notify a Trusted Contact if enabled, but it is not emergency care.

## Webapp role

The webapp exists for:

- Account registration and login.
- Telegram pairing.
- Google Calendar connection.
- Agent settings.
- Trusted Contact setup, if included in MVP.
- Optional diary/memory review if included in MVP scope.

The Telegram Anchor Agent is the primary day-to-day interaction channel.

## Success criteria

- A new User can register, pair Telegram, connect Google Calendar, and receive the first check-in.
- A User can speak or type a calendar request and have Anchor create a Calendar Addition when details are clear.
- A User can complete an evening Daily Check-in through short voice/text turns.
- A User can later ask what happened on a date or around a topic and receive a grounded answer.
- A User can correct or delete memory through natural language with appropriate safeguards.
- The system communicates uncertainty and limits without technical jargon.
