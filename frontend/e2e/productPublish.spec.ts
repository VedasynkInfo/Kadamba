import { expect, test } from '@playwright/test';
import { ADMIN_USER, mockApi } from './helpers/api';

/**
 * Publishing a product.
 *
 * The console's product desk is a master/detail editor. This journey proves
 * the whole path: open the desk, create a product, mark it live, and confirm
 * the API receives it as an *active* product — which is what makes it appear
 * in the public catalogue.
 */
test.describe('product publish', () => {
  async function signIn(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  }

  /**
   * Open the product desk and wait for it to settle.
   *
   * The desk animates in and re-renders while its queries resolve, so a click
   * issued too early lands on a button that is about to be replaced.
   */
  async function openProductDesk(page: import('@playwright/test').Page) {
    await page.goto('/admin/products');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('button', { name: /new product/i }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
  }

  test('opens the product desk', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await openProductDesk(page);

    await expect(page.getByText(/Bridal Lehenga/).first()).toBeVisible();
  });

  test('creates a product and publishes it to the storefront', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await openProductDesk(page);

    await page.getByRole('button', { name: /new product/i }).first().click();

    // The editor opens on the product it is about to create.
    await expect(page.getByLabel(/workshop code/i)).toBeVisible();
    await page.getByLabel(/workshop code/i).fill('BR-NEW');
    await page.getByLabel(/public name/i).fill('A New Lehenga');

    // "Active on the website" is the publish switch. A new product starts
    // live, so the switch is only toggled when it is *not* already on.
    const active = page.getByLabel(/active on the website/i);
    await active.scrollIntoViewIfNeeded();
    if (!(await active.isChecked())) {
      await active.check();
    }
    await expect(active).toBeChecked();

    const create = page.getByRole('button', { name: /create product/i }).first();
    await create.scrollIntoViewIfNeeded();
    await create.click();

    await expect
      .poll(() =>
        api.requests.find(
          (r) => r.method === 'POST' && r.path === '/admin/products/product-types',
        ),
      )
      .toBeTruthy();

    const created = api.requests.find(
      (r) => r.method === 'POST' && r.path === '/admin/products/product-types',
    );
    const payload = created?.body as { code?: string; name?: string; active?: boolean };
    expect(payload?.code).toBe('BR-NEW');
    expect(payload?.name).toBe('A New Lehenga');
    // The publish switch really did publish.
    expect(payload?.active).toBe(true);
  });

  test('saves a product as a draft when it is not marked live', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await openProductDesk(page);

    await page.getByRole('button', { name: /new product/i }).first().click();
    await expect(page.getByLabel(/workshop code/i)).toBeVisible();
    await page.getByLabel(/workshop code/i).fill('BR-DRAFT');
    await page.getByLabel(/public name/i).fill('A Draft Lehenga');

    const active = page.getByLabel(/active on the website/i);
    await active.scrollIntoViewIfNeeded();
    if (await active.isChecked()) {
      await active.uncheck();
    }
    await expect(active).not.toBeChecked();

    const create = page.getByRole('button', { name: /create product/i }).first();
    await create.scrollIntoViewIfNeeded();
    await create.click();

    await expect
      .poll(() =>
        api.requests.some(
          (r) => r.method === 'POST' && r.path === '/admin/products/product-types',
        ),
      )
      .toBe(true);

    const created = api.requests.find(
      (r) => r.method === 'POST' && r.path === '/admin/products/product-types',
    );
    const payload = created?.body as { active?: boolean };
    expect(payload?.active).toBe(false);
  });
});
