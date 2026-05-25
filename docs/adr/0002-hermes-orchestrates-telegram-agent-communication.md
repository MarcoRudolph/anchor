# Hermes orchestrates Telegram agent communication

Hermes is the runtime orchestrator for Telegram communication: it owns conversation flow, Good Friend Voice, Small Talk Mode, calendar/diary/memory skills, and tool calls. The webapp/backend provides stable APIs/tools for identity, settings, Google Connection state, Calendar Additions, diary and memory persistence, and Recovery Flows, but it must not duplicate agent conversation logic. Zapier may be used as an integration adapter, but Anchor state, permissions, and memory remain owned by the Anchor backend and persistence layer.
