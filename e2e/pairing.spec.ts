/**
 * UJ-002: Telegram Pairing Journey — E2E scaffold (ADR-0007, DEC-0020).
 *
 * This is the MERGE-GATE spec for Phase 0. It is scaffolded here (plan 00-04)
 * and fully wired in plan 00-06 once the pairing-redeem edge function and
 * Hermes stub exist.
 *
 * Journey steps:
 *   1. Magic-link login (authenticated Web Session)
 *   2. Pairing code rendered in the webapp (8-char Crockford-Base32, 15-min TTL)
 *   3. Stub bot redeems the code via the pairing-redeem edge fn
 *      (mirrors real Hermes: service-role + x-hermes-secret)
 *   4. UI flips to "connected" state via Supabase Realtime
 *
 * Acceptance criteria (UJ-002):
 *   - One Anchor Agent communicates with exactly one User.
 *   - Pairing cannot attach another User's Telegram identity to the wrong Account.
 *
 * All assertions are marked test.fixme until plan 00-06 implements the full
 * wiring — CI stays green now while this spec is the tracked target.
 */
import { test, expect } from '@playwright/test';
import { stubRedeemPairingCode } from './fixtures/stub-bot';

// ---------------------------------------------------------------------------
// Constants (will be injected from env / ephemeral Supabase in 00-06)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'stub-key';
const HERMES_SECRET = process.env.HERMES_SECRET ?? 'stub-secret';
const STUB_TELEGRAM_USER_ID = 9_000_000_001;
const STUB_TELEGRAM_USERNAME = 'anchor_ci_bot';

// ---------------------------------------------------------------------------
// UJ-002 journey
// ---------------------------------------------------------------------------
test.describe('UJ-002: Telegram Pairing Journey', () => {
  // Sentinel: spec file is wired and Playwright can discover it.
  // All journey assertions are fixme until plan 00-06 implements the full wiring.
  test('spec scaffold is registered (CI discovery gate)', async () => {
    // This test is intentionally trivial — it confirms the spec is wired
    // into the Playwright suite so CI counts it as a discovered test.
    // Real journey assertions land in plan 00-06.
    expect(true).toBe(true);
  });

  test.fixme(
    'step 1 — magic-link login redirects to onboarding with a valid session',
    async ({ page }) => {
      // TODO (00-06): trigger magic-link for the CI test user, intercept the
      // email link via a Supabase inbucket fixture, and assert the session cookie.
      await page.goto('/de');
      await expect(page.locator('[data-testid="pairing-section"]')).toBeVisible();
    },
  );

  test.fixme(
    'step 2 — pairing code is rendered and matches Crockford-Base32 format',
    async ({ page }) => {
      // TODO (00-06): navigate to the onboarding/settings pairing section and
      // assert the code element matches /^[0-9A-HJKMNP-TV-Z]{8}$/.
      const codeEl = page.locator('[data-testid="pairing-code"]');
      await expect(codeEl).toBeVisible();
      const code = await codeEl.textContent();
      expect(code?.trim()).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
    },
  );

  test.fixme(
    'step 3 — stub bot redeems the pairing code via the edge function',
    async ({ page }) => {
      // TODO (00-06): extract the live code from the page, then call the stub.
      const fakePairingCode = 'AAAABBBB'; // placeholder — real code extracted in 00-06
      const result = await stubRedeemPairingCode({
        pairingCode: fakePairingCode,
        telegramUserId: STUB_TELEGRAM_USER_ID,
        telegramUsername: STUB_TELEGRAM_USERNAME,
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SERVICE_ROLE_KEY,
        hermesSecret: HERMES_SECRET,
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
    },
  );

  test.fixme(
    'step 4 — UI flips to "connected" state via Supabase Realtime after redemption',
    async ({ page }) => {
      // TODO (00-06): after stub redemption, wait for the Realtime channel to
      // deliver the postgres_changes event and assert the "connected" badge.
      await expect(
        page.locator('[data-testid="telegram-status-connected"]'),
      ).toBeVisible({ timeout: 10_000 });
    },
  );

  test.fixme(
    'security — pairing code cannot be redeemed twice (single-use, ADR-0007)',
    async () => {
      // TODO (00-06): call stubRedeemPairingCode twice with the same code;
      // second call must return 409 or 400.
      const fakePairingCode = 'AAAABBBB';
      const result = await stubRedeemPairingCode({
        pairingCode: fakePairingCode,
        telegramUserId: STUB_TELEGRAM_USER_ID,
        supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SERVICE_ROLE_KEY,
        hermesSecret: HERMES_SECRET,
      });
      expect([400, 409]).toContain(result.status);
    },
  );
});
