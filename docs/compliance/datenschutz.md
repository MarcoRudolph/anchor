---
description: "Anchor Datenschutzerklärung draft content — adapted services (Telegram, Google Calendar, LLM, Deepgram, Stripe, Resend, Supabase, Vercel, Hostinger) and cookie-consent-free posture. Source-of-truth copy for the /datenschutz route (CR-001/CR-006/CR-008/CR-009/CR-010); convert to page.tsx when the app is scaffolded."
paths:
  - "../adr/0021-legal-and-compliance-layer.md"
  - "../requirements/compliance-requirements.md"
  - "./subprocessors.md"
  - "./impressum.md"
---

# Datenschutzerklärung

> Adapted from the Empatify Datenschutz. German is authoritative (CR-002). Final wording reviewed by a qualified party before launch (CR-011). Mirrors the Empatify `page.tsx` section structure for 1:1 conversion to `src/app/[locale]/datenschutz/page.tsx`.

## 1. Datenschutz auf einen Blick

### Allgemeine Hinweise
Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen oder Anchor nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.

### Wer ist verantwortlich für die Datenerfassung?
Die Datenverarbeitung erfolgt durch den Anbieter. Dessen Kontaktdaten entnehmen Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle" sowie dem Impressum.

### Wie erfassen wir Ihre Daten?
Einige Daten teilen Sie uns selbst mit — z. B. Ihre E-Mail-Adresse bei der Anmeldung, Ihr Geburtsdatum für die Kontowiederherstellung und die Inhalte, die Sie dem Anchor-Begleiter per Telegram schreiben oder sprechen. Andere technische Daten (z. B. Browser, Betriebssystem, Uhrzeit des Aufrufs) erfassen unsere IT-Systeme automatisch beim Besuch der Website.

### Wofür nutzen wir Ihre Daten?
Zur fehlerfreien Bereitstellung des Dienstes, zur Erbringung der Anchor-Funktionen (täglicher Check-in, Erinnerungen, Kalender, Gedächtnis des Begleiters) sowie zur Abwicklung des Pro-Abonnements. **Eine Analyse Ihres Nutzerverhaltens findet nicht statt** — Anchor setzt keine Analyse- oder Tracking-Werkzeuge ein.

### Welche Rechte haben Sie?
Sie haben jederzeit das Recht auf unentgeltliche Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung sowie auf Datenübertragbarkeit. Löschung und Export können Sie direkt in Ihrem Konto unter **/account/delete** bzw. **/account/export** selbst auslösen (siehe Abschnitt 4). Außerdem steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.

## 2. Hosting und externe Dienste

### Vercel
Wir hosten die Web-Anwendung bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Beim Besuch erfasst Vercel Logfiles inkl. IP-Adresse zur technischen Bereitstellung und Sicherheit. Datenschutz: https://vercel.com/legal/privacy-policy. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an zuverlässiger Bereitstellung).

### Supabase
Für Authentifizierung, Datenspeicherung und Server-Funktionen nutzen wir Supabase (Supabase Inc., USA). Verarbeitet werden u. a. E-Mail-Adresse, Profil- und Nutzungsdaten sowie die Gesprächs- und Gedächtnisinhalte des Begleiters, gespeichert in einer EU-Region. Datenschutz: https://supabase.com/privacy.

### Hostinger
Den Vermittlungsdienst „Hermes", der die Kommunikation zwischen Anchor und Telegram orchestriert, betreiben wir auf einem Server von Hostinger (EU). Dabei werden Nachrichteninhalte transient verarbeitet.

## 3. Allgemeine Hinweise und Pflichtinformationen

### Datenschutz
Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Vorschriften. Ein lückenloser Schutz der Daten bei der Übertragung im Internet (z. B. per E-Mail) ist nicht möglich.

### Hinweis zur verantwortlichen Stelle
> Rudolpho AI – Marco Rudolph
> No de Halloh 8a, 25591 Ottenbüttel
> Telefon: 015116321085
> E-Mail: marcorudolph09@proton.me

### Speicherdauer
Soweit keine speziellere Speicherdauer genannt ist, verbleiben Ihre Daten bei uns, bis der Zweck der Verarbeitung entfällt oder Sie ein berechtigtes Löschersuchen geltend machen, sofern keine gesetzlichen Aufbewahrungsfristen (z. B. steuer- oder handelsrechtlich) entgegenstehen.

### Rechtsgrundlagen
Wir verarbeiten Ihre Daten auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), zur Vertragserfüllung (lit. b), zur Erfüllung rechtlicher Pflichten (lit. c) oder aufgrund berechtigten Interesses (lit. f). Die für sensible Inhalte (z. B. Sprachaufnahmen) ggf. einschlägige Einwilligung holen wir gesondert ein.

### Empfänger / Auftragsverarbeiter
Wir geben personenbezogene Daten nur auf Grundlage gültiger Auftragsverarbeitungsverträge (AVV) an die in dieser Erklärung genannten Dienstleister weiter. Eine vollständige Liste der Auftragsverarbeiter finden Sie im Abschnitt 5 sowie unter `docs/compliance/subprocessors.md`.

### Widerruf, Widerspruch (Art. 21 DSGVO), Beschwerde
Erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Bei Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO haben Sie ein Widerspruchsrecht. Ihnen steht ein Beschwerderecht bei einer Aufsichtsbehörde zu.

### Recht auf Datenübertragbarkeit (Art. 20)
Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder zur Vertragserfüllung automatisiert verarbeiten, in einem gängigen, maschinenlesbaren Format zu erhalten — siehe Selbst-Export unter **/account/export**.

### Auskunft, Berichtigung, Löschung, Einschränkung
Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung. Hierzu können Sie sich an uns wenden oder die Selbstbedienungsfunktionen in Ihrem Konto nutzen.

## 4. Datenerfassung und Konto-Funktionen

### Cookies — keine Einwilligung erforderlich
Anchor setzt **ausschließlich ein technisch notwendiges Cookie** ein: ein HttpOnly-Sitzungs-Cookie, das nach der Anmeldung per Magic-Link Ihre Sitzung aufrechterhält. **Es werden keine Analyse-, Tracking- oder Werbe-Cookies und keine Drittanbieter-Cookies gesetzt.** Da nur technisch notwendige Speicherung im Sinne des § 25 Abs. 2 TDDDG erfolgt, ist hierfür keine Einwilligung erforderlich; ein Cookie-Banner entfällt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.

### Anmeldung per Magic-Link
Die Anmeldung erfolgt passwortlos über einen einmaligen Link an Ihre E-Mail-Adresse. Verarbeitet werden Ihre E-Mail-Adresse und ein Sitzungs-Token (Art. 6 Abs. 1 lit. b DSGVO).

### Kontowiederherstellung über eine Vertrauensperson
Zur Wiederherstellung verarbeiten wir die E-Mail-Adresse Ihrer benannten Vertrauensperson sowie Ihr Geburtsdatum (und optional die Postleitzahl). Bei jeder Wiederherstellung werden Sie benachrichtigt.

### Konto löschen (Art. 17) und Daten exportieren (Art. 20)
Unter **/account/delete** löschen Sie Ihr Konto selbst: nach Bestätigung per Magic-Link und einer 7-tägigen Karenzfrist werden alle Ihre Daten unwiderruflich entfernt, das Google-Token widerrufen und ein laufendes Abonnement gekündigt. Unter **/account/export** erhalten Sie eine maschinenlesbare Kopie Ihrer Daten.

## 5. Verarbeitete Dienste / Auftragsverarbeiter

### Telegram
Der Anchor-Begleiter kommuniziert über Telegram (Telegram FZ-LLC, Dubai, VAE). Ihre Nachrichten an den Begleiter werden über Telegram übertragen. Datenschutz: https://telegram.org/privacy.

### Google Kalender (Google Calendar API)
Wenn Sie Ihren Google-Kalender verbinden, verarbeiten wir über die Google Calendar API (Google Ireland Limited) im von Ihnen freigegebenen Umfang Kalendereinträge, um Termine vorzulesen und einzutragen. Grundlage ist Ihre Einwilligung (OAuth, Art. 6 Abs. 1 lit. a DSGVO); der Zugriff ist auf die erforderlichen Kalenderberechtigungen beschränkt und jederzeit widerrufbar. Datenschutz: https://policies.google.com/privacy.

### KI-Sprachmodell (Anthropic / OpenAI)
Zur Erzeugung der Antworten des Begleiters übertragen wir Gesprächsinhalte an einen KI-Anbieter (Anthropic PBC und/oder OpenAI, L.L.C., USA). Wo verfügbar, wählen wir EU-Verarbeitung und Optionen ohne Speicherung der Inhalte zu Trainingszwecken. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Datenschutz: https://www.anthropic.com/legal/privacy bzw. https://openai.com/policies/privacy-policy.

### Sprachtranskription (Deepgram, Fallback Whisper)
Sprachnachrichten an den Begleiter werden zur Transkription an Deepgram, Inc. (USA) übermittelt; als Ausweichlösung kommt ein Whisper-Modell zum Einsatz. Da Sprachinhalte besonders sensibel sind, erfolgt die Verarbeitung in der EU auf Grundlage Ihrer Einwilligung. Datenschutz: https://deepgram.com/privacy.

### Zahlungsabwicklung (Stripe)
Für das Pro-Abonnement nutzen wir Stripe (Stripe Payments Europe, Ltd., Irland). Name, E-Mail und Zahlungsinformationen werden direkt an Stripe übermittelt; Anchor speichert keine Kartendaten. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Datenschutz: https://stripe.com/de/privacy.

### Transaktions-E-Mails (Resend)
Anmelde-Links, Einladungen an die Vertrauensperson und Sicherheitshinweise versenden wir über Resend (Resend, Inc., USA). Verarbeitet werden E-Mail-Adresse und Nachrichteninhalt. Datenschutz: https://resend.com/legal/privacy-policy.
