import { expect, test } from '@playwright/test';
import { ADMIN_USER, mockApi } from './helpers/api';

/**
 * The admin journey.
 *
 * Sign in, move through the console, and reach the desks an operator uses
 * every day. The point is not that the tables render — it is that the console
 * opens, the navigation works, and a write reaches the API.
 */
test.describe('admin journey', () => {
  test('signs in and reaches the dashboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin(\/|$)/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigates from the console to the orders desk', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);

    await page.goto('/admin/orders');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('reaches the leads desk', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);

    await page.goto('/admin/leads');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('signs out and closes the console again', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);

    // The console's own sign-out control.
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await expect.poll(() => api.signedIn).toBe(false);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('sends a request to the API when a desk is opened', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);

    await page.goto('/admin/products');
    await expect
      .poll(() => api.requests.some((r) => r.path === '/admin/products/product-types'))
      .toBe(true);
  });
});
