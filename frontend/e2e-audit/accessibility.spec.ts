import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';
import { loadRoutes } from './routes';

const OUT_DIR = path.resolve(process.cwd(), '..', 'audit-artifacts');
const RAW_DIR = path.join(OUT_DIR, 'raw');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const KEY_PAGES = [
  '/',
  '/about',
  '/services',
  '/products',
  '/gallery',
  '/portfolio',
  '/blogs',
  '/contact',
  '/kurnool',
  '/request-service',
  '/design-system',
];

async function settle(page: Page) {
  await page
    .locator('[role="status"][aria-label="Preparing the studio"]')
    .waitFor({ state: 'hidden', timeout: 2500 })
    .catch(() => {});
  await page.evaluate(async () => {
    const vh = window.innerHeight || 800;
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += vh * 0.85) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

test('axe WCAG A/AA audit of key public pages', async ({ page, request }, testInfo) => {
  const projectName = testInfo.project.name;
  fs.mkdirSync(RAW_DIR, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const allRoutes = await loadRoutes(request);
  const representative = [
    allRoutes.find((r) => r.kind === 'service-detail')?.path,
    allRoutes.find((r) => r.kind === 'product-detail')?.path,
    allRoutes.find((r) => r.kind === 'portfolio-detail')?.path,
    allRoutes.find((r) => r.kind === 'blog-detail')?.path,
    allRoutes.find((r) => r.kind === 'locality')?.path,
  ].filter((p): p is string => Boolean(p));

  const pages = [...KEY_PAGES, ...representative];
  const output: Array<{
    path: string;
    violations: Array<{
      id: string;
      impact: string | null;
      help: string;
      nodes: number;
      targets: string[];
      samples: string[];
    }>;
    error?: string;
  }> = [];

  for (const routePath of pages) {
    try {
      await page.goto(routePath, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.locator('main').waitFor({ state: 'visible', timeout: 10_000 });
      await settle(page);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      output.push({
        path: routePath,
        violations: results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact ?? null,
          help: violation.help,
          nodes: violation.nodes.length,
          targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
          samples: violation.nodes.slice(0, 2).map((node) => node.html.slice(0, 220)),
        })),
      });
    } catch (error) {
      output.push({
        path: routePath,
        violations: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  fs.writeFileSync(
    path.join(RAW_DIR, `a11y-${projectName}.json`),
    JSON.stringify({ project: projectName, viewport: page.viewportSize(), pages: output }, null, 2),
  );
});
