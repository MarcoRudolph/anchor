/**
 * pairing-redeem — Hermes-tier edge function (ADR-0010 / DEC-0007 / T-00-16)
 *
 * Called by Hermes when a Telegram user sends /start <code>.
 * Atomically burns the pairing code:
 *   UPDATE pairing_code
 *      SET consumed_at = now()
 *    WHERE code = $1
 *      AND consumed_at IS NULL
 *      AND expires_at > now()
 *   RETURNING anchor_user_id
 * Then binds telegram_user_id to the anchor_user row.
 *
 * Tier: requireHermes (service-role JWT + x-hermes-secret)
 * STUB: returns contract-shaped fixture with the burn SQL shape documented.
 *       Wave 1 replaces with real DB write.
 */

import { z } from "zod";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireHermes } from "../_shared/auth.ts";
import type { PairingRedeemResponse } from "../_shared/contract.ts";

const schema = z.object({
  code: z.string().min(1),
  telegramUserId: z.number().int(),
  telegramUsername: z.string().optional(),
});

export async function handler(req: Request): Promise<Response> {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Auth: Hermes-tier only (T-00-14 / T-00-15)
  try {
    requireHermes(req);
  } catch (e) {
    return e as Response;
  }

  // Zod validation (ASVS V5 / T-00-20)
  let body: z.infer<typeof schema>;
  try {
    const raw = await req.json();
    body = schema.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  /**
   * ATOMIC BURN SHAPE (wave owner wires to real DB):
   *
   *   const result = await db.execute(sql`
   *     UPDATE pairing_code
   *        SET consumed_at = now()
   *      WHERE code = ${body.code}
   *        AND consumed_at IS NULL
   *        AND expires_at > now()
   *     RETURNING anchor_user_id
   *   `);
   *
   *   if (result.rows.length === 0) {
   *     return { ok: false, error: 'already_consumed' | 'expired' | 'not_found' };
   *   }
   *   const { anchor_user_id } = result.rows[0];
   *
   *   await db.execute(sql`
   *     UPDATE anchor_user
   *        SET telegram_user_id = ${body.telegramUserId}
   *      WHERE id = ${anchor_user_id}
   *   `);
   */

  void body; // used for validation; stub does not write to DB

  // Stub fixture — returns contract-shaped success
  const response: PairingRedeemResponse = {
    ok: true,
    anchorUserId: "00000000-0000-7000-a000-000000000001",
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((globalThis as any).Deno?.serve) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Deno.serve(handler);
}
