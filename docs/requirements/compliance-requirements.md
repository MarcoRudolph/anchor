---
description: "Anchor legal-surface, consent, sub-processor, and GDPR data-subject-rights requirements (DE/EU B2C)."
paths:
  - "./README.md"
  - "./non-functional-requirements.md"
  - "./billing-and-plans-requirements.md"
  - "./webapp-ui-ux-requirements.md"
  - "../adr/0021-legal-and-compliance-layer.md"
  - "../adr/0006-passwordless-magic-link-auth-with-trusted-person-recovery.md"
  - "../adr/0016-stripe-operations-customer-lifecycle-webhooks-vat.md"
---

# Anchor Compliance Requirements

## Purpose

Anchor is a German-targeted B2C subscription. This leaf fixes the legal surfaces, consent posture, sub-processor obligations, and GDPR data-subject-rights flows the product must ship before any non-pilot user is admitted. It is the requirement-level expression of `docs/adr/0021-legal-and-compliance-layer.md`.

## Scope

In scope (MVP): the four mandatory legal documents, the Widerruf consent mechanic at Checkout, the cookie-consent-free posture, the sub-processor register, and self-service erasure + export.

Out of scope (MVP): Consent Management Platform, multi-jurisdiction legal variants, automated DSAR ticketing, BFSG accessibility certification.

**Source ADR:** `docs/adr/0021-legal-and-compliance-layer.md`

## CR-001 Mandatory legal documents
Anchor ships Impressum (§5 DDG), Datenschutzerklärung (GDPR Art. 13/14), AGB, and Widerrufsbelehrung at localized routes `/impressum`, `/datenschutz`, `/agb`, `/widerruf`, linked from a persistent footer on every page including the landing page.

## CR-002 German is authoritative
German is the authoritative legal language. The English locale carries an informational translation that explicitly defers to the German original on conflict.

## CR-003 Impressum fields are operator-supplied
Legal name, address, USt-IdNr., Vertretungsberechtigter, and contact are configuration, not committed content. The build fails if a required Impressum slot is unset.

## CR-004 Withdrawal consent at Checkout
Pro Checkout presents a required, unchecked acknowledgment that the User demands immediate performance and accepts loss of the 14-day Widerrufsrecht (§356 Abs. 5 BGB). The subscription does not start without it. The acknowledgment is logged with timestamp against `anchor_user_id`.

## CR-005 Withdrawal without immediate-performance consent
If a User withdraws within 14 days and did not consent to immediate performance, the operator refunds via Stripe (BPR-010) and downgrades the plan.

## CR-006 No non-essential cookies
The MVP ships only the strictly necessary HttpOnly session cookie (ADR-0006). No analytics, trackers, or marketing pixels run on the webapp. No consent banner is shown — only a privacy notice linking to the Datenschutzerklärung.

## CR-007 Re-consent trigger is documented
Introducing any non-essential client-side storage re-triggers §25 TDDDG consent and requires a Consent Management Platform. This is deferred and MUST NOT be added silently.

## CR-008 Sub-processor register
A versioned sub-processor register lists each processor's purpose, data categories, processing location, and AVV/DPA reference, published in the Datenschutzerklärung and mirrored at `docs/compliance/subprocessors.md`. A signed AVV with each processor is a launch prerequisite.

## CR-009 Right to erasure (Art. 17)
`/account/delete` deletes the Account self-service: magic-link confirmation, a 7-day recoverable grace window, then a scheduled irreversible purge (ADR-0019) that cascades all User data, revokes the Google token, cancels the Stripe subscription, and writes a tombstone audit event. An operator fallback exists.

## CR-010 Right to export (Art. 20)
`/account/export` asynchronously generates a machine-readable JSON bundle plus a human-readable summary, delivered as an emailed download link (ADR-0017). An operator fallback exists. Both rights are linked from the Datenschutzerklärung per Art. 13(2)(b).

## CR-011 Legal prose review
Final Impressum, Datenschutzerklärung, AGB, and Widerrufsbelehrung wording is drafted or reviewed with a qualified party against the operator's real company data before launch. This requirement set fixes architecture and mechanics, not the prose.
