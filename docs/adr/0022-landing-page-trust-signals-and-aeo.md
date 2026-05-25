---
description: "ADR-0022 — Anchor's landing page carries an above-the-fold trust/reassurance block (not a medical device, encrypted, cancel anytime, no data sold), a legal/trust footer linking Impressum/Datenschutz/AGB/Widerruf, and AEO-structured crawlable content (FAQ section with FAQPage JSON-LD, definition blocks, server-rendered) so answer engines can cite Anchor."
paths:
  - "../requirements/webapp-ui-ux-requirements.md"
  - "../requirements/compliance-requirements.md"
  - "./0011-nextjs-on-vercel-with-tailwind-and-shadcn.md"
  - "./0012-i18n-next-intl-de-authoritative.md"
  - "./0021-legal-and-compliance-layer.md"
---

# Landing-page trust signals and AEO

Status: Accepted

Anchor's audience is older adults and the adult children who often discover the product on their behalf — a demographic acutely sensitive to scams and reluctant to hand a vulnerable relative to an unknown service. The single calm hero of WUX-013 is necessary but insufficient: it sells the feeling, not the safety. This ADR adds three content layers to the landing page without disturbing the hero's calm: an **above-the-fold trust/reassurance block**, a **legal and trust footer**, and an **AEO-structured FAQ/definition layer** that makes Anchor citable by answer engines (per the global AEO rules).

The **trust block** sits immediately below the hero, before pricing. It carries four short, plain-language reassurances as scannable items (icon + one line each), copy-sourced from the locale JSON (ADR-0012): (1) *"Kein medizinisches Gerät — Anchor ersetzt keine Pflege, keinen Arzt und keinen Notruf."* — the medical-device disclaimer is a hard requirement, not marketing; (2) *"Deine Daten sind verschlüsselt und gehören dir."* — speaks to the encryption posture (NFR-002) and the no-tracking stance (CR-006); (3) *"Jederzeit kündbar, keine versteckten Kosten."* — mirrors BPR-005 and the Widerruf handling (CR-004); (4) *"Wir verkaufen deine Daten nicht."* The block uses WUX-002 plain language, WUX-004 contrast, and never uses fear copy. Testimonials/social proof are explicitly **deferred** (there are none at pilot stage, and fabricating them would breach trust and §5 UWG) — a slot is reserved but ships empty until real pilot quotes with consent exist. A short product demo (a captioned screen-recording of a Telegram check-in, no real user data) MAY occupy this zone later; it is not an MVP blocker.

The **footer** is persistent across every page (closing TODO #15 and satisfying CR-001) and links the four legal surfaces — `/impressum`, `/datenschutz`, `/agb`, `/widerruf` — plus a `kontakt` mailto and the operator name "Rudolpho AI". The footer is the discharge point for §5 DDG reachability ("from every page"). Legal links are not gated behind the locale switcher styling; they are always visible, never color-only (WUX-004), and the Impressum/Datenschutz content is the German source-of-truth in `docs/compliance/` (ADR-0021).

The **AEO layer** makes Anchor an extractable, citable source. The landing page renders, below pricing, a server-rendered FAQ section answering real buyer questions ("Was ist Anchor?", "Ist Anchor ein Pflegedienst oder Notruf?", "Was kostet Anchor?", "Welche Daten speichert Anchor?", "Wie funktioniert die Erinnerungsfunktion?", "Kann ich jederzeit kündigen?"). Each answer leads with the direct answer in the first sentence, then one short supporting paragraph — the extractable-first structure the AEO rules require. The same Q&A pairs are emitted as **`FAQPage` JSON-LD** structured data, and the organization identity as `Organization` JSON-LD (name, URL, logo, sameAs to the product siblings). A concise **definition block** ("Anchor ist ein KI-Begleiter für ältere Menschen, der per Telegram täglich nach dem Befinden fragt, an Termine erinnert und sich an Gesprochenes erinnert.") gives answer engines a clean one-paragraph extract. Because ADR-0011 puts the app on Next.js/Vercel, these sections are statically rendered (not client-only) so crawlers and LLM fetchers see the content without executing JS; the page sets a sane `<title>`/`<meta description>`, canonical URL, and Open Graph tags, and is reachable without auth.

These additions are codified as new requirements WUX-021 (trust block), WUX-022 (legal/trust footer), and WUX-023 (AEO-structured content), and all FAQ/definition/reassurance strings live in the locale JSON per WUX-020 with German authoritative. Nothing here changes the hero (WUX-013) or pricing (WUX-014) contracts; it layers beneath them.

Out of scope for MVP: a blog or content-cluster CMS, programmatic per-niche landing pages (the global funnel strategy — a later milestone), fabricated or incentivized reviews, third-party review-platform widgets (would reintroduce cookies and breach CR-006), A/B testing infrastructure, and video production beyond a single optional demo clip.
