import { defineConfig, devices } from '@playwright/test';

/**
 * Full public-site audit against the real backend.
 *
 * Unlike the committed e2e suite this config does not mock the API: the
 * frontend preview (port 3002, matching backend FRONTEND_URL so CORS passes)
 * talks to the live Express + MongoDB stack on port 4000.
 */
const PORT = 3002;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e-audit',
  fullyParallel: false,
  workers: 5,
  timeout: 30 * 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: '../audit-artifacts/playwright-run.json' }]],
  use: {
    baseURL,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    serviceWorkers: 'block',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: 'laptop-1280',
      use: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
    },
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'mobile-iphone13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-galaxy-s8',
      use: { ...devices['Galaxy S8'] },
    },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
