import fs from 'node:fs';
import path from 'node:path';
import { test, type ConsoleMessage, type Page, type Request } from '@playwright/test';
import { loadRoutes, type AuditRoute } from './routes';

const OUT_DIR = path.resolve(process.cwd(), '..', 'audit-artifacts');
const RAW_DIR = path.join(OUT_DIR, 'raw');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');

interface RouteResult {
  path: string;
  kind: string;
  status: number | null;
  ok: boolean;
  finalUrl: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h1Count: number;
  h2Count: number;
  bodyTextLength: number;
  mainHeight: number;
  headerVisible: boolean;
  footerPresent: boolean;
  imagesTotal: number;
  imagesBroken: Array<{ src: string; alt: string }>;
  overflowPx: number;
  overflowOffenders: Array<{ tag: string; cls: string; width: number; left: number }>;
  smallTapTargets: number;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: Array<{ status: number; url: string }>;
  apiCalls: Array<{ status: number; url: string; ms: number }>;
  metrics: {
    domContentLoadedMs: number;
    loadMs: number;
    lcpMs: number;
    cls: number;
    longTasks: number;
    requests: number;
    transferKB: number;
    shifts: Array<{ value: number; time: number; scrollY: number; innerHeight: number; sources: string[] }>;
  };
  loadError?: string;
  screenshot?: string;
  screenshotNote?: string;
  durationMs: number;
}

interface InteractionResult {
  name: string;
  ok: boolean;
  detail: string;
}

function safeName(routePath: string) {
  if (routePath === '/') return 'home';
  return routePath.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+$/, '');
}

async function settle(page: Page) {
  // Let the first-visit curtain lift and lazy images start.
  await page
    .locator('[role="status"][aria-label="Preparing the studio"]')
    .waitFor({ state: 'hidden', timeout: 2500 })
    .catch(() => {});
  await page.waitForTimeout(350);
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const vh = window.innerHeight || 800;
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += vh * 0.9) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

async function collectMetrics(page: Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const audit = (window as unknown as { __kadambaAudit?: { lcp: number; cls: number; longTasks: number; shifts: Array<{ value: number; time: number; scrollY: number; innerHeight: number; sources: string[] }> } })
      .__kadambaAudit;
    return {
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      loadMs: Math.round(nav?.loadEventEnd ?? 0),
      lcpMs: Math.round(audit?.lcp ?? 0),
      cls: Number((audit?.cls ?? 0).toFixed(4)),
      longTasks: audit?.longTasks ?? 0,
      requests: resources.length,
      transferKB: Math.round(resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024),
      shifts: audit?.shifts ?? [],
    };
  });
}

async function auditRoute(
  page: Page,
  route: AuditRoute,
  state: {
    consoleErrors: string[];
    pageErrors: string[];
    failedRequests: string[];
    badResponses: Array<{ status: number; url: string }>;
    apiCalls: Array<{ status: number; url: string; ms: number }>;
  },
  projectName: string,
): Promise<RouteResult> {
  state.consoleErrors.length = 0;
  state.pageErrors.length = 0;
  state.failedRequests.length = 0;
  state.badResponses.length = 0;
  state.apiCalls.length = 0;

  const started = Date.now();
  const result: RouteResult = {
    path: route.path,
    kind: route.kind,
    status: null,
    ok: false,
    finalUrl: '',
    title: '',
    metaDescription: '',
    h1: [],
    h1Count: 0,
    h2Count: 0,
    bodyTextLength: 0,
    mainHeight: 0,
    headerVisible: false,
    footerPresent: false,
    imagesTotal: 0,
    imagesBroken: [],
    overflowPx: 0,
    overflowOffenders: [],
    smallTapTargets: 0,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
    apiCalls: [],
    metrics: {
      domContentLoadedMs: 0,
      loadMs: 0,
      lcpMs: 0,
      cls: 0,
      longTasks: 0,
      requests: 0,
      transferKB: 0,
      shifts: [],
    },
    durationMs: 0,
  };

  try {
    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    // A full-page navigation can inherit the previous route's scroll offset for
    // a few frames. The audit measures the initial layout, so pin it to the top
    // before any content or lazy images begin moving.
    await page.evaluate(() => {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }).catch(() => {});
    result.status = response?.status() ?? null;
    result.finalUrl = page.url();

    await page.locator('main').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    // WebKit can still be hydrating the route chunk when `main` first paints.
    // Wait for the route's own h1 before measuring, otherwise a slow worker
    // records a transient loading shell as a failed page.
    await page
      .locator('main h1')
      .first()
      .waitFor({ state: 'attached', timeout: 15_000 })
      .catch(() => {});
    await settle(page);
    await scrollThrough(page);

    result.title = await page.title();
    result.metaDescription = await page
      .locator('meta[name="description"]')
      .first()
      .getAttribute('content')
      .catch(() => '')
      .then((v) => v ?? '');

    const dom = await page.evaluate(() => {
      const main = document.querySelector('main');
      const mainRect = main?.getBoundingClientRect();
      const header = document.querySelector('header');
      const headerRect = header?.getBoundingClientRect();
      const h1s = Array.from(document.querySelectorAll('main h1')).map((el) =>
        (el.textContent || '').replace(/\s+/g, ' ').trim(),
      );
      const docWidth = document.documentElement.clientWidth;
      const offenders: Array<{ tag: string; cls: string; width: number; left: number }> = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > docWidth + 2 || rect.left < -2) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
            width: Math.round(rect.width),
            left: Math.round(rect.left),
          });
          if (offenders.length >= 8) break;
        }
      }
      const images = Array.from(document.images);
      const smallTargets = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter(
        (el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
        },
      ).length;
      return {
        h1s,
        h2Count: document.querySelectorAll('main h2').length,
        bodyTextLength: (document.body.innerText || '').trim().length,
        mainHeight: Math.round(mainRect?.height ?? 0),
        headerVisible: Boolean(headerRect && headerRect.height > 0),
        footerPresent: Boolean(document.querySelector('footer')),
        images: images.map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt || '',
          complete: img.complete,
          width: img.naturalWidth,
        })),
        overflowPx: Math.max(0, document.documentElement.scrollWidth - docWidth),
        offenders,
        smallTargets,
      };
    });

    result.h1 = dom.h1s;
    result.h1Count = dom.h1s.length;
    result.h2Count = dom.h2Count;
    result.bodyTextLength = dom.bodyTextLength;
    result.mainHeight = dom.mainHeight;
    result.headerVisible = dom.headerVisible;
    result.footerPresent = dom.footerPresent;
    result.imagesTotal = dom.images.length;
    result.imagesBroken = dom.images
      .filter((img) => img.complete && img.width === 0)
      .map((img) => ({ src: img.src, alt: img.alt }));
    result.overflowPx = dom.overflowPx;
    result.overflowOffenders = dom.offenders;
    result.smallTapTargets = dom.smallTargets;

    result.metrics = await collectMetrics(page);
    result.consoleErrors = [...new Set(state.consoleErrors)];
    result.pageErrors = [...new Set(state.pageErrors)];
    result.failedRequests = [...new Set(state.failedRequests)];
    result.badResponses = [...state.badResponses];
    result.apiCalls = [...state.apiCalls];

    if (route.screenshot) {
      const dir = path.join(SHOT_DIR, projectName);
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${safeName(route.path)}.png`);
      try {
        await page.screenshot({ path: file, animations: 'disabled', fullPage: false });
        if (route.path === '/') {
          const full = path.join(dir, 'home-full.png');
          // `scale: 'css'` keeps a 24,000 CSS-pixel editorial home page under the
          // 32,767-pixel screenshot limit on 2x/3x mobile emulation.
          await page.screenshot({ path: full, animations: 'disabled', fullPage: true, scale: 'css' });
        }
        result.screenshot = path.relative(OUT_DIR, file);
      } catch (error) {
        // A screenshot is evidence, not a functional check. Never fail a route
        // because the PNG was too large for the image encoder.
        result.screenshotNote = error instanceof Error ? error.message : String(error);
      }
    }

    result.ok =
      (result.status ?? 0) < 400 &&
      dom.mainHeight > 100 &&
      result.bodyTextLength > 200 &&
      result.h1Count > 0 &&
      result.title.length > 0;

    if (route.kind === '404') {
      const text = await page.locator('main').innerText();
      result.ok = /404/i.test(text) && /back to home/i.test(text);
    }
  } catch (error) {
    result.loadError = error instanceof Error ? error.message : String(error);
    result.consoleErrors = [...new Set(state.consoleErrors)];
    result.pageErrors = [...new Set(state.pageErrors)];
    result.failedRequests = [...new Set(state.failedRequests)];
  }

  result.durationMs = Date.now() - started;
  return result;
}

async function runInteractions(page: Page): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  const viewport = page.viewportSize()!;

  // 1. Header navigation, client-side.
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.waitFor({ state: 'visible', timeout: 5000 });

    if (viewport.width >= 1024) {
      const links: Array<[string, string]> = [
        ['About', '/about'],
        ['Services', '/services'],
        ['Collections', '/products'],
        ['Gallery', '/gallery'],
        ['Portfolio', '/portfolio'],
        ['Blogs', '/blogs'],
        ['Contact', '/contact'],
        ['Consultation', '/request-service'],
      ];
      const failures: string[] = [];
      for (const [label, expected] of links) {
        await nav.getByRole('link', { name: label, exact: true }).click();
        await page.waitForURL((url) => url.pathname === expected, { timeout: 8000 }).catch(() => {});
        if (new URL(page.url()).pathname !== expected) {
          failures.push(`${label} -> ${new URL(page.url()).pathname} (expected ${expected})`);
        }
        await page.locator('main').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      }
      results.push({
        name: 'desktop primary navigation (8 links)',
        ok: failures.length === 0,
        detail: failures.length ? failures.join('; ') : 'all 8 links routed correctly',
      });

      // Sticky header after scroll.
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(400);
      const top = await page
        .locator('header')
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().top));
      results.push({
        name: 'sticky header',
        ok: top === 0,
        detail: `header top after 900px scroll = ${top}`,
      });
    } else {
      await page.getByRole('button', { name: /open menu/i }).click();
      const drawer = page.getByRole('dialog');
      const drawerVisible = await drawer
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      const linkCount = await drawer.getByRole('link').count().catch(() => 0);
      await drawer.getByRole('link', { name: 'About', exact: true }).click().catch(() => {});
      await page.waitForURL((url) => url.pathname === '/about', { timeout: 8000 }).catch(() => {});
      results.push({
        name: 'mobile menu drawer',
        ok: drawerVisible && linkCount >= 9 && new URL(page.url()).pathname === '/about',
        detail: `visible=${drawerVisible} links=${linkCount} navigated=${new URL(page.url()).pathname}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'primary navigation',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  // 2. Contact form validation (no data is written).
  try {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const form = page.locator('#contact-form');
    await form.scrollIntoViewIfNeeded();
    await form.getByRole('button', { name: /send message/i }).click();
    await page.waitForTimeout(700);
    const text = await form.innerText();
    const errorNodes = await form.locator('[role="alert"], .text-danger, [aria-invalid="true"]').count();
    results.push({
      name: 'contact form empty-submit validation',
      ok: errorNodes > 0 && /required|enter|valid/i.test(text),
      detail: `error nodes=${errorNodes}; text sample=${text.slice(0, 220).replace(/\s+/g, ' ')}`,
    });
  } catch (error) {
    results.push({
      name: 'contact form validation',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  // 3. Consultation form validation (step 1 of 4, no data is written).
  try {
    await page.goto('/request-service', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const form = page.locator('form').first();
    const continueButton = form.getByRole('button', { name: /continue/i }).first();
    await continueButton.scrollIntoViewIfNeeded();
    await continueButton.click();
    await page.waitForTimeout(700);
    const text = await form.innerText();
    const errorNodes = await form.locator('[role="alert"], .text-danger, [aria-invalid="true"]').count();
    results.push({
      name: 'consultation form empty-submit validation',
      ok: errorNodes > 0 || /enter your name|valid email/i.test(text),
      detail: `error nodes=${errorNodes}; text sample=${text.slice(0, 220).replace(/\s+/g, ' ')}`,
    });
  } catch (error) {
    results.push({
      name: 'consultation form validation',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  // 4. Branded 404 and a way home.
  try {
    await page.goto('/definitely-not-a-real-page', { waitUntil: 'domcontentloaded' });
    await page.locator('main h1').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const main = page.locator('main');
    await main.waitFor({ state: 'visible', timeout: 8000 });
    const text = await main.innerText();
    const homeLink = page.getByRole('link', { name: /back to home/i });
    results.push({
      name: 'branded 404',
      ok: /404/.test(text) && (await homeLink.count()) > 0,
      detail: `404 text=${/404/.test(text)} home link=${(await homeLink.count()) > 0} sample=${text.slice(0, 120).replace(/\s+/g, ' ')}`,
    });
  } catch (error) {
    results.push({
      name: 'branded 404',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  // 5. Admin gating: unauthenticated visitors never see the console.
  try {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 }).catch(() => {});
    results.push({
      name: 'admin area gated',
      ok: /\/admin\/login/.test(new URL(page.url()).pathname),
      detail: `landed on ${new URL(page.url()).pathname}`,
    });
  } catch (error) {
    results.push({
      name: 'admin area gated',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

test('full public site audit against live backend', async ({ page, context, request }, testInfo) => {
  const projectName = testInfo.project.name;
  const routes = await loadRoutes(request);

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  // Performance observers must exist before every navigation.
  await context.addInitScript(() => {
    const audit = { lcp: 0, cls: 0, longTasks: 0, shifts: [] as Array<{ value: number; time: number; scrollY: number; innerHeight: number; sources: string[] }> };
    (window as unknown as { __kadambaAudit: typeof audit }).__kadambaAudit = audit;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) audit.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number; sources?: Array<{ node?: Node }> }>) {
          if (!entry.hadRecentInput) {
            audit.cls += entry.value ?? 0;
            if ((entry.value ?? 0) > 0.005) {
              audit.shifts.push({
                value: Number((entry.value ?? 0).toFixed(4)),
                time: Math.round(entry.startTime),
                scrollY: Math.round(window.scrollY),
                innerHeight: window.innerHeight,
                sources: (entry.sources ?? []).map((source) => {
                  const node = source.node as HTMLElement | undefined;
                  return node ? `${node.nodeName}.${String(node.className || '').split(' ').slice(0, 3).join('.')}` : '?';
                }),
              });
            }
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        audit.longTasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Older WebKit builds may not expose every observer type.
    }
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });

  const state = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    failedRequests: [] as string[],
    badResponses: [] as Array<{ status: number; url: string }>,
    apiCalls: [] as Array<{ status: number; url: string; ms: number }>,
  };

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      const location = message.location();
      state.consoleErrors.push(
        `${message.text()}${location.url ? ` @ ${location.url}:${location.lineNumber ?? 0}` : ''}`,
      );
    }
  });
  page.on('pageerror', (error) => state.pageErrors.push(error.message));
  page.on('requestfailed', (request: Request) => {
    const failure = request.failure()?.errorText ?? 'unknown';
    // Aborted requests are usually route changes or preloader image cancels.
    if (!/ERR_ABORTED/.test(failure)) {
      state.failedRequests.push(`${failure} ${request.url()}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400) {
      state.badResponses.push({ status: response.status(), url });
    }
    if (url.includes('/api/')) {
      const timing = response.request().timing();
      state.apiCalls.push({
        status: response.status(),
        url,
        ms: Math.round((timing.responseEnd || 0) - (timing.requestStart || 0)),
      });
    }
  });

  const results: RouteResult[] = [];
  for (const route of routes) {
    // Recover from a route that left the page in a bad state.
    if (page.url() === 'about:blank') {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    results.push(await auditRoute(page, route, state, projectName));
  }

  const interactions = await runInteractions(page);

  const summary = {
    project: projectName,
    viewport: page.viewportSize(),
    routesTested: results.length,
    routesOk: results.filter((r) => r.ok).length,
    routesFailed: results.filter((r) => !r.ok).map((r) => ({ path: r.path, kind: r.kind, reason: r.loadError ?? 'checks failed' })),
    consoleErrorRoutes: results.filter((r) => r.consoleErrors.length > 0).length,
    pageErrorRoutes: results.filter((r) => r.pageErrors.length > 0).length,
    brokenImageRoutes: results.filter((r) => r.imagesBroken.length > 0).length,
    overflowRoutes: results.filter((r) => r.overflowPx > 1).length,
    apiErrorRoutes: results.filter((r) => r.badResponses.some((b) => b.url.includes('/api/'))).length,
    interactions,
  };

  fs.writeFileSync(
    path.join(RAW_DIR, `${projectName}.json`),
    JSON.stringify({ summary, results }, null, 2),
  );

  // This test reports rather than asserts: the audit's job is to surface every
  // defect in one run, not to stop at the first red page.
  testInfo.attach('summary', { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });
});
