import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ADMIN_USER, CUSTOMER_USER, mockApi } from './helpers/api';

/**
 * Accessibility, checked in a real browser.
 *
 * The unit tests cannot see a missing label, a poor contrast ratio or a
 * heading order that makes no sense. axe can, and it runs against the same
 * production bundle a visitor downloads.
 *
 * Only `wcag2a` and `wcag2aa` are enforced — those are the levels a public
 * site is expected to meet.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function analyse(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

/**
 * Let the page finish moving before it is measured.
 *
 * The sections animate in as they come into view, and a half-finished
 * animation leaves the text at a fraction of its opacity — which axe reads as
 * a contrast failure no visitor would ever see. Scrolling the page through
 * triggers every section's entrance, and the wait lets it land.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

/** Turn axe's violations into a readable failure. */
function describeViolations(violations: Awaited<ReturnType<typeof analyse>>['violations']) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3)
        .map((node) => {
          const check = node.any?.[0]?.data as
            | { fgColor?: string; bgColor?: string; contrastRatio?: number }
            | undefined;
          const colours = check
            ? ` [${check.fgColor} on ${check.bgColor} = ${check.contrastRatio}]`
            : '';
          return `      ${node.target.join(' ')}${colours}\n        ${node.html.slice(0, 200)}`;
        })
        .join('\n');
      return `  ${violation.id} (${violation.impact}): ${violation.help}\n${nodes}`;
    })
    .join('\n');
}

test.describe('accessibility', () => {
  test('the home page has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await settle(page);

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });

  test('the products page has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/products');
    await expect(page.locator('main')).toBeVisible();
    await settle(page);

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });

  test('the contact page has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/contact');
    await expect(page.locator('main')).toBeVisible();
    await settle(page);

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });

  test('the console sign-in page has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });

  test('the console has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN_USER.email);
    await page.getByLabel('Password').fill('studio-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\/|$)/);
    await settle(page);

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });

  test('the customer portal has no WCAG A/AA violations', async ({ page }) => {
    await mockApi(page);
    await page.goto('/portal/login');
    await page.getByLabel(/email/i).first().fill(CUSTOMER_USER.email);
    await page.getByLabel(/password/i).first().fill('portal-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/portal(\/|$)/);
    await settle(page);

    const results = await analyse(page);
    expect(describeViolations(results.violations)).toBe('');
  });
});
