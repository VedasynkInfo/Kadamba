import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const OUT_DIR = path.resolve(process.cwd(), '..', 'audit-artifacts');

/**
 * Real submissions against the live API.
 *
 * One contact message and one four-step consultation are written through the
 * public UI. The recorded email/phone/order are used by
 * `scripts/cleanup-audit-submissions.ts` to remove the test records afterwards.
 */
test('real contact and consultation form submissions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'one real submission is enough');
  test.setTimeout(3 * 60_000);

  const suffix = Date.now().toString().slice(-7);
  const phone = `9${suffix.padStart(9, '0').slice(-9)}`;
  const contactEmail = `audit.contact.${suffix}@example.com`;
  const consultationEmail = `audit.consult.${suffix}@example.com`;

  const api: Array<{ url: string; status: number }> = [];
  const consoleErrors: string[] = [];
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/contact') || url.includes('/api/leads')) {
      api.push({ url, status: response.status() });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  // ── Contact form ─────────────────────────────────────────────────────────
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor();
  const contactSection = page.locator('#contact-form');
  await contactSection.scrollIntoViewIfNeeded();
  const contactForm = contactSection.locator('form');
  await contactForm.locator('input[name="name"]').fill('Audit Contact');
  await contactForm.locator('input[name="email"]').fill(contactEmail);
  await contactForm.locator('input[name="phone"]').fill(phone);
  await contactForm.locator('textarea[name="message"]').fill(
    `This is an end-to-end audit submission. Please ignore. Reference ${suffix}.`,
  );
  await contactForm.getByRole('button', { name: /send message/i }).click();
  await expect(contactSection.getByText('Message received')).toBeVisible({ timeout: 20_000 });
  const contactStatus = api.find((entry) => entry.url.includes('/api/contact'))?.status;

  // ── Consultation form: 4 steps ───────────────────────────────────────────
  await page.goto('/request-service', { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor();
  const requestSection = page.locator('#request-form');
  await requestSection.scrollIntoViewIfNeeded();
  const form = requestSection.locator('form');

  await form.locator('input[name="name"]').fill('Audit Consultation');
  await form.locator('input[name="phone"]').fill(phone);
  await form.locator('input[name="email"]').fill(consultationEmail);
  await form.locator('input[name="city"]').fill('Kurnool');
  await form.locator('input[name="locality"]').fill('Sreenivas Nagar');
  await form.getByRole('button', { name: /continue/i }).click();

  const service = form.getByRole('combobox', { name: 'Service' });
  await service.click();
  await page.getByRole('option').first().click();
  await form.locator('input[name="garmentType"]').fill('Bridal lehenga');
  const occasion = form.getByRole('combobox', { name: 'Occasion' });
  await occasion.click();
  await page.getByRole('option').first().click();

  // The date field is a dialog-backed control. "Today" is always selectable
  // and satisfies the form's not-in-the-past rule.
  await form.getByLabel('Preferred date').click();
  await page.getByRole('button', { name: 'Today', exact: true }).click();

  const budget = form.getByRole('combobox', { name: 'Budget' });
  await budget.click();
  await page.getByRole('option').first().click();
  await form.getByRole('button', { name: /continue/i }).click();

  await form.locator('textarea[name="message"]').fill(
    'A made-to-measure bridal consultation submitted by the end-to-end audit. Please ignore this test record.',
  );
  await form.getByRole('button', { name: /continue/i }).click();

  // Depending on how quickly React commits the step change, the same action
  // may land on the review step or the form may already be submitting. If the
  // review's Send request button is present, press it; otherwise wait for the
  // success state that is already in flight.
  const sendRequest = form.getByRole('button', { name: /send request/i });
  await page.waitForTimeout(300);
  if (await sendRequest.isVisible().catch(() => false)) {
    await sendRequest.click({ noWaitAfter: true }).catch(() => {});
  }
  await expect(requestSection.getByText('Request received')).toBeVisible({ timeout: 30_000 });

  const orderText = await requestSection.innerText();
  const orderMatch = orderText.match(/Order #(\d+)/);
  const leadStatus = api.find((entry) => entry.url.includes('/api/leads'))?.status;

  const result = {
    submittedAt: new Date().toISOString(),
    suffix,
    email: { contact: contactEmail, consultation: consultationEmail },
    phone,
    orderNumber: orderMatch ? Number(orderMatch[1]) : null,
    api,
    consoleErrors,
    project: testInfo.project.name,
  };
  fs.mkdirSync(path.join(OUT_DIR, 'raw'), { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'raw', `forms-${testInfo.project.name}.json`),
    JSON.stringify(result, null, 2),
  );

  expect(contactStatus, 'contact endpoint status').toBe(200);
  expect(leadStatus, 'lead endpoint status').toBe(201);
  expect(consoleErrors, 'console errors during submissions').toEqual([]);
});
