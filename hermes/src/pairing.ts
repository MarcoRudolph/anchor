/**
 * Pairing-code redemption for Hermes (ADR-0007 / DEC-0007).
 *
 * Called after Hermes receives a /start <CODE> Telegram command and validates
 * the code format. Calls the pairing-redeem edge function with the contract
 * body { code, telegramUserId, telegramUsername? }.
 */

import { callEdge } from './edge-client.js';

export interface RedeemResult {
  /** true = pairing bound; false = code was expired, consumed, or not found */
  connected: boolean;
  /** Populated when connected = true */
  anchorUserId?: string;
  /** Reason string when connected = false */
  error?: string;
}

/**
 * Redeems a pairing code on behalf of a Telegram user.
 *
 * @param code            - 8-char Crockford Base32 code from /start payload
 * @param telegramUserId  - Telegram user_id (integer from the update)
 * @param telegramUsername - Optional Telegram @username (passed through for display)
 */
export async function redeemPairingCode(
  code: string,
  telegramUserId: number,
  telegramUsername?: string,
): Promise<RedeemResult> {
  let response: Response;

  try {
    response = await callEdge('pairing-redeem', {
      code,
      telegramUserId,
      telegramUsername,
    });
  } catch (err) {
    console.error('[hermes/pairing] Network error calling pairing-redeem:', err);
    return { connected: false, error: 'network_error' };
  }

  let body: { ok?: boolean; anchorUserId?: string; error?: string };
  try {
    body = (await response.json()) as typeof body;
  } catch {
    console.error('[hermes/pairing] Non-JSON response from pairing-redeem, status:', response.status);
    return { connected: false, error: 'invalid_response' };
  }

  if (!response.ok || !body.ok) {
    console.warn('[hermes/pairing] pairing-redeem failed:', body.error ?? response.status);
    return { connected: false, error: body.error ?? 'redeem_failed' };
  }

  return { connected: true, anchorUserId: body.anchorUserId };
}
