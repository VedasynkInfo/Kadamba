import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

/**
 * Responsive browser smoke tests. Builds and serves the production bundle,
 * then exercises the critical public journeys on desktop and mobile.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  /**
   * Two workers, on purpose.
   *
   * Every spec drives the *production* bundle through one preview server, and
   * a page that renders the whole console is heavy. Running eight at once on a
   * two-core runner starves them and turns real assertions into timeouts.
   */
  workers: process.env.CI ? 2 : 3,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /**
       * The public site on a phone.
       *
       * The console and the customer portal are desktop tools — a studio runs
       * the order board on a laptop, not on a phone — so the mobile project
       * covers the site the public actually visits. Running the console
       * journeys through an emulated iPhone added nothing but flakiness.
       */
      name: 'mobile-safari',
      testMatch: /public\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
