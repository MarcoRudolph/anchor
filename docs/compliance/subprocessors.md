---
description: "Anchor sub-processor register — processors, purpose, data categories, processing location, and AVV/DPA status. A signed AVV with each is a launch prerequisite."
paths:
  - "../adr/0021-legal-and-compliance-layer.md"
  - "../requirements/compliance-requirements.md"
---

# Anchor Sub-Processor Register

German is authoritative; this register is mirrored in the Datenschutzerklärung (CR-008). `AVV signed` is an operational launch gate — fill the date when the agreement is executed.

| Processor | Purpose | Data categories | Processing location | AVV/DPA reference | AVV signed |
|-----------|---------|-----------------|---------------------|-------------------|------------|
| Stripe (Stripe Payments Europe) | Payments, subscription billing | Email, name, payment metadata | EU + US (SCCs) | Stripe DPA | ☐ |
| Google | Calendar OAuth, event read/write | OAuth tokens, calendar events | EU + US (SCCs) | Google Cloud DPA | ☐ |
| Telegram | Agent message transport | Telegram user id, message content | Global | Telegram terms | ☐ |
| Anthropic / OpenAI | LLM inference for the agent | Conversation content | EU/US — elect zero-retention where available | Provider data-processing terms | ☐ |
| Deepgram (Whisper fallback) | Voice transcription (ADR-0014) | Voice audio, transcripts (sensitive) | EU processing required | Provider DPA | ☐ |
| Supabase | Database, Edge Functions (ADR-0010/0013) | All application data | EU region | Supabase DPA | ☐ |
| Hostinger | VPS for Hermes (ADR-0003) | Transient agent traffic | EU | Hostinger DPA | ☐ |
| Vercel | Webapp hosting (ADR-0011) | Request logs | EU + US (SCCs) | Vercel DPA | ☐ |
| Resend | Transactional email (ADR-0017) | Email address, message content | EU + US (SCCs) | Resend DPA | ☐ |

Adding or removing a processor requires updating this register and the published Datenschutzerklärung in the same change.
