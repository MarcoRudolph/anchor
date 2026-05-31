import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Anchor E2E tests (ADR-0020).
 * Runs the UJ-002 pairing journey (and future journeys) against the
 * Next.js dev/preview server.
 *
 * Gate: The full E2E suite must pass before merging to main.
 * Phase 0 scope: UJ-002 pairing scaffold (fully wired in plan 00-06).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Fail CI fast on first failure — fail-fast in headless runs
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'html',
  use: {
    // Base URL: Vercel preview in CI (PLAYWRIGHT_BASE_URL env), local dev otherwise
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Boot the Next.js dev server when not in CI (CI uses the Vercel preview URL)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
