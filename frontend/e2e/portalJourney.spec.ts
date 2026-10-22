import { expect, test } from '@playwright/test';
import { CUSTOMER_USER, mockApi } from './helpers/api';

/**
 * The customer portal journey.
 *
 * A customer signs in, sees their orders, and opens one of them. The portal is
 * the half of the product most people actually touch, so it gets the same
 * treatment as the console.
 */
test.describe('portal journey', () => {
  async function signIn(page: import('@playwright/test').Page) {
    await page.goto('/portal/login');
    await page.getByLabel(/email/i).first().fill(CUSTOMER_USER.email);
    await page.getByLabel(/password/i).first().fill('portal-password');
    await page.getByRole('button', { name: /sign in/i }).click();
  }

  test('signs in and reaches the portal dashboard', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await signIn(page);

    await expect(page).toHaveURL(/\/portal(\/|$)/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('lists the customer orders', async ({ page }) => {
    const api = await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await signIn(page);
    await expect(page).toHaveURL(/\/portal(\/|$)/);

    await page.goto('/portal/orders');
    await expect(page.getByRole('main')).toBeVisible();
    await expect
      .poll(() => api.requests.some((r) => r.path === '/portal/orders'))
      .toBe(true);
  });

  test('opens one order', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await signIn(page);
    await expect(page).toHaveURL(/\/portal(\/|$)/);

    await page.goto('/portal/orders/65f0000000000000000000o1');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('shows the measurements desk', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await signIn(page);
    await expect(page).toHaveURL(/\/portal(\/|$)/);

    await page.goto('/portal/measurements');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('shows the payments desk', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await signIn(page);
    await expect(page).toHaveURL(/\/portal(\/|$)/);

    await page.goto('/portal/payments');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('refuses a customer account in the admin console', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(CUSTOMER_USER.email);
    await page.getByLabel('Password').fill('portal-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/access limited/i)).toBeVisible();
  });
});
