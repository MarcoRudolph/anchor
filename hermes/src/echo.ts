/**
 * Echo module — sends a single confirmation turn to the Telegram user after
 * successful pairing (ADR-0002 / Phase 0 scope).
 *
 * Uses the Telegram Bot API directly (sendMessage).
 * NO turn orchestration / voice / memory — those are Phase 3.
 *
 * Required env var:
 *   TELEGRAM_BOT_TOKEN — the Telegram bot token
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('[hermes/echo] TELEGRAM_BOT_TOKEN env var is not set');
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Sends a pairing confirmation message to the Telegram chat.
 *
 * @param chatId  - Telegram chat_id (same as user_id for private chats)
 * @param locale  - 'de' | 'en' — determines the confirmation language
 */
export async function sendPairingConfirmation(
  chatId: number,
  locale: string = 'de',
): Promise<void> {
  const message =
    locale === 'de'
      ? 'Du bist jetzt mit Anchor verbunden. Ich bin dein persönlicher Gedächtnisassistent.'
      : 'You are now connected to Anchor. I am your personal memory companion.';

  const url = `${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[hermes/echo] sendMessage failed:', response.status, body);
    }
  } catch (err) {
    console.error('[hermes/echo] Network error sending echo:', err);
  }
}
