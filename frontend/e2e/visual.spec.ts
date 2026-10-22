import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { mockApi } from './helpers/api';

/**
 * Visual regression.
 *
 * A screenshot is a cheap way to notice that a heading moved, a card lost its
 * padding, or a colour changed under a page that no assertion covers. The
 * baselines are committed, so a change that alters the surface has to be
 * accepted deliberately.
 *
 * The baselines are per platform — Chromium on Linux is the reference,
 * because that is what CI runs. A platform without a baseline yet skips
 * rather than fails: the first run on a new platform writes the image, and it
 * is reviewed and committed like any other change.
 */
function skipWithoutBaseline(name: string) {
  // When the baselines are being written, there is nothing to compare with
  // yet — the run's job is to produce them.
  if (test.info().config.updateSnapshots !== 'none') return;

  const path = test.info().snapshotPath(name, { kind: 'screenshot' });
  test.skip(
    !existsSync(path),
    `No baseline for this platform yet (${name}). Run "npm run test:e2e:update" to write it.`,
  );
}

test.describe('visual regression', () => {
  test('the home page', async ({ page }) => {
    skipWithoutBaseline('home.png');

    await mockApi(page);
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Freeze the motion so the screenshot is of the settled page.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);

    // The viewport, not the whole page: a full-page shot of fifteen sections
    // is a two-megabyte baseline, and the part that changes is the part a
    // designer actually looks at.
    await expect(page).toHaveScreenshot('home.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('the home page, further down', async ({ page }) => {
    skipWithoutBaseline('home-services.png');

    await mockApi(page);
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // The services band — cards, icons and the gold actions.
    await page.getByRole('heading', { name: /what we make|services/i }).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    await expect(page).toHaveScreenshot('home-services.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('the console sign-in page', async ({ page }) => {
    skipWithoutBaseline('admin-login.png');

    await mockApi(page);
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('admin-login.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
