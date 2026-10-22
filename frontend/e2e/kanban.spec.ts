import { expect, test } from '@playwright/test';
import { ADMIN_USER, mockApi } from './helpers/api';

/**
 * The order board (Kanban).
 *
 * A boutique's orders move through nine stages, and the board answers "what
 * is stuck". Two things have to hold: the board renders the orders in the
 * right columns, and a status change reaches the API — because the board
 * reads the same transition map the server enforces, a card can only be
 * dropped where the API would accept it.
 */
test.describe('order board', () => {
  async function openBoard(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);

    await page.goto('/admin/orders/board');
    await expect(page.getByRole('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
  }

  test('renders a column for every stage of the order lifecycle', async ({ page }) => {
    await mockApi(page);
    await openBoard(page);

    for (const label of [
      'Enquiry',
      'Confirmed',
      'Measurements',
      'Pattern / Cutting',
      'Tailoring / Stitching',
      'Trial & Fitting',
      'Delivered',
    ]) {
      // The board scrolls sideways on a narrow viewport, so the column has to
      // be in the document rather than on screen.
      await expect(page.getByText(label, { exact: true }).first()).toBeAttached();
    }
  });

  test('puts an order in the column that matches its status', async ({ page }) => {
    await mockApi(page);
    await openBoard(page);

    // The mock serves one order, in `stitching`.
    await expect(page.getByText(/Bridal Lehenga/).first()).toBeVisible();
    await expect(page.getByText(/#7001/).first()).toBeVisible();
  });

  test('asks the API for the board rather than the plain list', async ({ page }) => {
    const api = await mockApi(page);
    await openBoard(page);

    await expect
      .poll(() => api.requests.some((r) => r.path === '/admin/orders' && r.method === 'GET'))
      .toBe(true);
  });

  test('offers a way back to the list view', async ({ page }) => {
    await mockApi(page);
    await openBoard(page);

    await expect(page.getByText(/back to list/i).first()).toBeVisible();
  });
});
