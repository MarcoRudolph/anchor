/**
 * Stub Telegram bot fixture for CI E2E tests (DEC-0020, ADR-0007).
 *
 * In production, the real Hermes worker receives Telegram's webhook when a
 * user sends `/start <code>` to the shared bot. In CI, there is no real
 * Telegram bot — this stub simulates the same HTTP call that Hermes would
 * make to the `pairing-redeem` Supabase Edge Function after receiving the
 * `/start <code>` command.
 *
 * Auth mirrors the real Hermes call exactly (DEC-0010):
 *   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   - x-hermes-secret: <HERMES_SECRET>
 *
 * Contract body matches supabase/functions/_shared/contract.ts PairingRedeemRequest:
 *   { code: string; telegramUserId: number; telegramUsername?: string }
 * camelCase field names — matches the frozen contract (00-05).
 */

export interface StubBotRedeemOptions {
  /** The 8-char Crockford-Base32 pairing code displayed in the webapp */
  pairingCode: string;
  /** Simulated Telegram user ID (must be a valid int64-compatible number) */
  telegramUserId: number;
  /** Telegram username (optional, mirrors real bot behaviour) */
  telegramUsername?: string;
  /** Base URL of the Supabase Edge Function endpoint */
  supabaseUrl: string;
  /** Supabase service-role key (ephemeral in CI — never prod) */
  serviceRoleKey: string;
  /** Hermes shared secret (from HERMES_SECRET env in CI) */
  hermesSecret: string;
}

export interface StubBotRedeemResult {
  ok: boolean;
  status: number;
  body: unknown;
}

/**
 * Simulates the `/start <code>` redemption call Hermes makes to the
 * `pairing-redeem` edge function after a user sends the pairing code via
 * Telegram.
 *
 * Body uses camelCase to match the PairingRedeemRequest contract shape
 * defined in supabase/functions/_shared/contract.ts.
 */
export async function stubRedeemPairingCode(
  opts: StubBotRedeemOptions,
): Promise<StubBotRedeemResult> {
  const url = `${opts.supabaseUrl}/functions/v1/pairing-redeem`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.serviceRoleKey}`,
      'x-hermes-secret': opts.hermesSecret,
    },
    // camelCase keys — matches PairingRedeemRequest in contract.ts (T-00-21)
    body: JSON.stringify({
      code: opts.pairingCode,
      telegramUserId: opts.telegramUserId,
      ...(opts.telegramUsername != null && { telegramUsername: opts.telegramUsername }),
    }),
  });

  const body = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}
