/**
 * Telegram webhook receive + /start CODE parse (ADR-0002 / ADR-0007 / T-00-24).
 *
 * Receives incoming Telegram Update objects, validates the optional
 * secret-token header (T-00-24), and routes /start <CODE> commands to the
 * pairing flow.
 *
 * Crockford Base32 alphabet: 0-9 A-H J K M N P-T V-Z (no I, L, O, U).
 * Code format: exactly 8 characters from that alphabet.
 */

import { redeemPairingCode } from './pairing.js';
import { sendPairingConfirmation } from './echo.js';

/** Crockford Base32 alphabet — validated before redeem (T-00-22) */
const CROCKFORD_RE = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/**
 * Expected Telegram secret-token header (T-00-24).
 * If set, every webhook POST must include X-Telegram-Bot-Api-Secret-Token.
 * Set this env var when registering the webhook via setWebhook.
 */
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';

// ---- Telegram Update types (minimal subset we need) ----

interface TelegramUser {
  id: number;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Handles an incoming Telegram webhook request.
 *
 * @param req  - The raw Node.js/HTTP IncomingMessage body (already parsed as JSON)
 * @param secretTokenHeader - Value of X-Telegram-Bot-Api-Secret-Token header (may be empty)
 */
export async function handleTelegramWebhook(
  update: TelegramUpdate,
  secretTokenHeader: string,
): Promise<void> {
  // T-00-24: validate webhook secret if configured
  if (TELEGRAM_WEBHOOK_SECRET && secretTokenHeader !== TELEGRAM_WEBHOOK_SECRET) {
    console.warn('[hermes/webhook] Rejected update — invalid secret token');
    return;
  }

  const message = update.message;
  if (!message) {
    // Not a message update (e.g. edited_message, channel_post, etc.) — ignore
    return;
  }

  const text = message.text?.trim() ?? '';
  const from = message.from;
  const chatId = message.chat.id;

  if (!from) {
    // Anonymous or channel sender — no user identity to bind
    return;
  }

  // Match /start <CODE> (Telegram deep-link format)
  const startMatch = text.match(/^\/start(?:@\S+)?\s+([0-9A-Za-z]{1,16})$/);
  if (!startMatch) {
    // Not a /start with a payload — ignore silently (phase 0: only pairing)
    return;
  }

  const rawCode = startMatch[1].toUpperCase();

  // T-00-22: validate Crockford format BEFORE calling the edge fn
  if (!CROCKFORD_RE.test(rawCode)) {
    console.warn('[hermes/webhook] Ignoring /start with invalid code format:', rawCode);
    return;
  }

  console.log('[hermes/webhook] Pairing attempt: code=%s user=%d', rawCode, from.id);

  const result = await redeemPairingCode(rawCode, from.id, from.username);

  if (result.connected) {
    console.log(
      '[hermes/webhook] Pairing succeeded: anchorUserId=%s telegramUserId=%d',
      result.anchorUserId,
      from.id,
    );
    await sendPairingConfirmation(chatId);
  } else {
    console.warn(
      '[hermes/webhook] Pairing failed: code=%s error=%s',
      rawCode,
      result.error,
    );
    // Do not echo an error message — silently discard (T-00-22: no oracle)
  }
}
