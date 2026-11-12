import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadRoutes } from './routes';

const OUT = path.resolve(process.cwd(), '..', 'audit-artifacts');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface RouteStandards {
  path: string;
  kind: string;
  axeViolations: number;
  axeRules: string[];
  h1Count: number;
  headingLevels: number[];
  duplicateIds: string[];
  landmarks: { header: number; main: number; footer: number; nav: number };
  skipLink: boolean;
  imagesMissingAlt: number;
  linksWithoutName: number;
  buttonsWithoutName: number;
  inputsWithoutLabel: number;
  buttonsWithoutType: number;
  positiveTabindex: number;
  targetBlankWithoutRel: number;
  ariaHiddenFocusable: number;
  issues: string[];
}

test('WCAG and web-standards audit of every public route', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'standards checks are device-independent');
  test.setTimeout(25 * 60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const routes = (await loadRoutes(request)).filter(
    (route) => route.kind !== '404' && route.kind !== 'design-system',
  );
  const results: RouteStandards[] = [];
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.locator('main h1').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page
      .waitForFunction(() => (document.querySelector('main')?.innerText?.trim().length ?? 0) > 200, {
        timeout: 15_000,
      })
      .catch(() => {});
    await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const height = document.body.scrollHeight;
      for (let y = 0; y < height; y += window.innerHeight * 0.85) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(450);

    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const dom = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

      const accessibleName = (element: Element) => {
        const aria = element.getAttribute('aria-label')?.trim();
        if (aria) return aria;
        const labelledby = element.getAttribute('aria-labelledby');
        if (labelledby) {
          return labelledby
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .join(' ')
            .trim();
        }
        return (element as HTMLElement).innerText?.trim() ?? element.getAttribute('title')?.trim() ?? '';
      };

      const images = Array.from(document.querySelectorAll('main img'));
      const links = Array.from(document.querySelectorAll('a[href]'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const fields = Array.from(
        document.querySelectorAll('main input:not([type="hidden"]), main select, main textarea'),
      );
      const ariaHiddenFocusable = Array.from(document.querySelectorAll('[aria-hidden="true"]')).filter(
        (element) =>
          element.matches('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])') ||
          Boolean(element.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')),
      );

      return {
        h1Count: document.querySelectorAll('main h1').length,
        headingLevels: Array.from(
          document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'),
        ).map((heading) => Number(heading.tagName.slice(1))),
        duplicateIds,
        landmarks: {
          header: document.querySelectorAll('header').length,
          main: document.querySelectorAll('main').length,
          footer: document.querySelectorAll('footer').length,
          nav: document.querySelectorAll('nav').length,
        },
        skipLink: Boolean(document.querySelector('a[href="#main-content"]')),
        imagesMissingAlt: images.filter((image) => !image.hasAttribute('alt')).length,
        linksWithoutName: links.filter((link) => accessibleName(link).length === 0).length,
        buttonsWithoutName: buttons.filter((button) => accessibleName(button).length === 0).length,
        inputsWithoutLabel: fields.filter((field) => {
          const id = field.getAttribute('id');
          const hasLabel = id ? Boolean(document.querySelector(`label[for="${CSS.escape(id)}"]`)) : false;
          return (
            !hasLabel &&
            !field.getAttribute('aria-label') &&
            !field.getAttribute('aria-labelledby') &&
            !field.closest('label')
          );
        }).length,
        buttonsWithoutType: buttons.filter((button) => !button.hasAttribute('type')).length,
        positiveTabindex: document.querySelectorAll('[tabindex]').length
          ? Array.from(document.querySelectorAll('[tabindex]')).filter(
              (element) => Number(element.getAttribute('tabindex')) > 0,
            ).length
          : 0,
        targetBlankWithoutRel: links.filter(
          (link) => link.getAttribute('target') === '_blank' && !/noopener|noreferrer/.test(link.getAttribute('rel') ?? ''),
        ).length,
        ariaHiddenFocusable: ariaHiddenFocusable.length,
      };
    });

    const headingOrder = dom.headingLevels;

    const issues: string[] = [];
    if (dom.h1Count !== 1) issues.push(`h1 count ${dom.h1Count}`);
    if (
      dom.headingLevels.some(
        (level, index) => index > 0 && level > dom.headingLevels[index - 1] + 1,
      )
    ) {
      issues.push('heading level skipped');
    }
    if (dom.duplicateIds.length) issues.push(`duplicate ids: ${dom.duplicateIds.slice(0, 5).join(', ')}`);
    if (dom.landmarks.main !== 1) issues.push(`main landmark count ${dom.landmarks.main}`);
    if (dom.landmarks.header < 1) issues.push('no header landmark');
    if (dom.landmarks.footer < 1) issues.push('no footer landmark');
    if (!dom.skipLink) issues.push('no skip link');
    if (dom.imagesMissingAlt) issues.push(`${dom.imagesMissingAlt} image(s) missing alt`);
    if (dom.linksWithoutName) issues.push(`${dom.linksWithoutName} link(s) without accessible name`);
    if (dom.buttonsWithoutName) issues.push(`${dom.buttonsWithoutName} button(s) without accessible name`);
    if (dom.inputsWithoutLabel) issues.push(`${dom.inputsWithoutLabel} field(s) without label`);
    if (dom.buttonsWithoutType) issues.push(`${dom.buttonsWithoutType} button(s) without type`);
    if (dom.positiveTabindex) issues.push(`${dom.positiveTabindex} positive tabindex`);
    if (dom.targetBlankWithoutRel) issues.push(`${dom.targetBlankWithoutRel} target=_blank without rel`);
    if (dom.ariaHiddenFocusable) issues.push(`${dom.ariaHiddenFocusable} aria-hidden focusable`);
    if (axe.violations.length) issues.push(`${axe.violations.length} axe rule(s)`);

    results.push({
      path: route.path,
      kind: route.kind,
      axeViolations: axe.violations.reduce((sum, violation) => sum + violation.nodes.length, 0),
      axeRules: axe.violations.map((violation) => `${violation.id}(${violation.nodes.length})`),
      h1Count: dom.h1Count,
      headingLevels: headingOrder,
      duplicateIds: dom.duplicateIds,
      landmarks: dom.landmarks,
      skipLink: dom.skipLink,
      imagesMissingAlt: dom.imagesMissingAlt,
      linksWithoutName: dom.linksWithoutName,
      buttonsWithoutName: dom.buttonsWithoutName,
      inputsWithoutLabel: dom.inputsWithoutLabel,
      buttonsWithoutType: dom.buttonsWithoutType,
      positiveTabindex: dom.positiveTabindex,
      targetBlankWithoutRel: dom.targetBlankWithoutRel,
      ariaHiddenFocusable: dom.ariaHiddenFocusable,
      issues,
    });
  }

  const summary = {
    routes: results.length,
    routesWithIssues: results.filter((result) => result.issues.length > 0).length,
    issueCount: results.reduce((sum, result) => sum + result.issues.length, 0),
    axeViolationNodes: results.reduce((sum, result) => sum + result.axeViolations, 0),
    duplicateIdRoutes: results.filter((result) => result.duplicateIds.length > 0).length,
    missingAltImages: results.reduce((sum, result) => sum + result.imagesMissingAlt, 0),
    unnamedLinks: results.reduce((sum, result) => sum + result.linksWithoutName, 0),
    unnamedButtons: results.reduce((sum, result) => sum + result.buttonsWithoutName, 0),
    unlabeledFields: results.reduce((sum, result) => sum + result.inputsWithoutLabel, 0),
    consoleErrors,
  };

  fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'raw', 'standards.json'),
    JSON.stringify({ summary, results }, null, 2),
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      results
        .filter((result) => result.issues.length > 0)
        .map((result) => ({ path: result.path, issues: result.issues })),
      null,
      2,
    ),
  );

  expect(summary.consoleErrors, 'console errors during standards crawl').toEqual([]);
  expect(summary.issueCount, 'web-standards issue count').toBe(0);
});
