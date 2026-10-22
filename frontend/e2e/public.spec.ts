import { expect, test } from '@playwright/test';

test.describe('public site smoke', () => {
  test('home renders with navigation and hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kadamba/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('key public routes load', async ({ page }) => {
    for (const path of ['/about', '/services', '/gallery', '/portfolio', '/blogs', '/contact']) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBeLessThan(400);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('unknown route shows branded 404', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('skip link is reachable via keyboard', async ({ page }, testInfo) => {
    // Keyboard tab focus is a desktop concern; mobile devices have no Tab key.
    test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop-only keyboard flow');
    await page.goto('/');
    // The home route waits on its content loader before it renders, so the
    // skip link is not in the DOM yet when `goto` resolves.
    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeAttached();
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  });
});

test.describe('admin gating', () => {
  test('admin area redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
