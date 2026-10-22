import { expect, test } from '@playwright/test';
import { ADMIN_USER, CUSTOMER_USER, mockApi } from './helpers/api';

/**
 * The auth matrix.
 *
 * Every combination of audience (admin, customer), state (signed in, signed
 * out) and route has to land somewhere sensible: the console behind a sign-in
 * wall, the portal behind its own, and neither of them open to a visitor.
 */
test.describe('auth matrix', () => {
  test('an anonymous visitor is sent from the console to the sign-in page', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('an admin can sign in and lands in the console', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin(\/|$)/);
    await expect(page.getByText(/studio console|kadamba/i).first()).toBeVisible();
  });

  test('a wrong password is refused and the console stays closed', async ({ page }) => {
    await mockApi(page, { validEmails: [] });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('a customer account cannot sign in to the console', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(CUSTOMER_USER.email);
    await page.getByLabel('Password').fill('portal-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    // The console refuses a non-staff account: it shows a refusal rather than
    // opening a desk to a customer.
    await expect(page.getByText(/access limited/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /orders|leads|products/i })).toHaveCount(0);
  });

  test('an account with two-factor enabled is asked for a code', async ({ page }) => {
    await mockApi(page, { mfaRequired: true });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/two-step verification/i)).toBeVisible();
    await expect(page.getByLabel(/verification code/i)).toBeVisible();
  });

  test('a customer is sent from the portal to the portal sign-in page', async ({ page }) => {
    await mockApi(page);
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/portal\/login/);
  });

  test('a customer can sign in to the portal', async ({ page }) => {
    await mockApi(page, { user: CUSTOMER_USER, validEmails: [CUSTOMER_USER.email] });
    await page.goto('/portal/login');
    await page.getByLabel(/email/i).first().fill(CUSTOMER_USER.email);
    await page.getByLabel(/password/i).first().fill('portal-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/portal(\/|$)/);
  });

  test('the public site never asks for a sign-in', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: /sign in/i })).toHaveCount(0);
  });
});
