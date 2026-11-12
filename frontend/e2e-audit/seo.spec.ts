import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loadRoutes } from './routes';

const OUT = path.resolve(process.cwd(), '..', 'audit-artifacts');
const BASE = 'http://localhost:3002';

interface SeoResult {
  path: string;
  kind: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical: string;
  canonicalPath: string;
  robots: string;
  lang: string;
  viewport: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  h1: string[];
  h2Count: number;
  jsonLdTypes: string[];
  invalidJsonLd: number;
  images: number;
  imagesMissingAltAttr: number;
  imagesWithDimensions: number;
  internalLinks: string[];
  emptyLinks: number;
  targetBlankWithoutRel: number;
  placeholderImages: number;
  wordCount: number;
  issues: string[];
}

const EXPECTED: Record<string, string[]> = {
  home: ['ClothingStore'],
  contact: ['ClothingStore'],
  kurnool: ['ClothingStore'],
  locality: ['ClothingStore', 'FAQPage'],
  'product-detail': ['Product', 'FAQPage'],
  'blog-detail': ['Article'],
  'service-detail': ['Service', 'FAQPage'],
  'portfolio-detail': ['CreativeWork'],
  products: ['ItemList'],
  services: ['ItemList'],
  blogs: ['ItemList'],
  portfolio: ['ItemList'],
  gallery: ['ImageGallery'],
};

function unique(values: string[]) {
  return [...new Set(values)];
}

test('SEO, content and structured-data audit of every public route', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'SEO is device-independent; one profile is enough');
  test.setTimeout(20 * 60_000);

  const routes = (await loadRoutes(request)).filter(
    (route) => route.kind !== '404' && route.kind !== 'design-system',
  );
  const knownPaths = new Set(routes.map((route) => route.path));
  knownPaths.add('/');
  knownPaths.add('/design-system');
  knownPaths.add('/portal/activate');
  knownPaths.add('/portal/login');
  knownPaths.add('/portal');
  knownPaths.add('/admin/login');

  const results: SeoResult[] = [];
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.locator('main h1').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page
      .waitForFunction(
        () =>
          document.title.length > 0 &&
          (document.querySelector('main')?.innerText?.trim().length ?? 0) > 200,
        { timeout: 15_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(250);

    const data = await page.evaluate(() => {
      const meta = (selector: string) => document.querySelector(selector)?.getAttribute('content') ?? '';
      const jsonLdTypes: string[] = [];
      let invalidJsonLd = 0;
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const parsed = JSON.parse(script.textContent || '{}');
          const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed];
          for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
            const type = node?.['@type'];
            if (Array.isArray(type)) jsonLdTypes.push(...type.map(String));
            else if (type) jsonLdTypes.push(String(type));
          }
        } catch {
          invalidJsonLd += 1;
        }
      }
      const images = Array.from(document.querySelectorAll('main img'));
      const links = Array.from(document.querySelectorAll('a[href]'));
      return {
        title: document.title,
        description: meta('meta[name="description"]'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
        robots: meta('meta[name="robots"]'),
        lang: document.documentElement.getAttribute('lang') ?? '',
        viewport: meta('meta[name="viewport"]'),
        og: {
          site_name: meta('meta[property="og:site_name"]'),
          type: meta('meta[property="og:type"]'),
          title: meta('meta[property="og:title"]'),
          description: meta('meta[property="og:description"]'),
          url: meta('meta[property="og:url"]'),
          image: meta('meta[property="og:image"]'),
          locale: meta('meta[property="og:locale"]'),
        },
        twitter: {
          card: meta('meta[name="twitter:card"]'),
          title: meta('meta[name="twitter:title"]'),
          description: meta('meta[name="twitter:description"]'),
          image: meta('meta[name="twitter:image"]'),
        },
        h1: Array.from(document.querySelectorAll('main h1')).map((el) =>
          (el.textContent || '').replace(/\s+/g, ' ').trim(),
        ),
        h2Count: document.querySelectorAll('main h2').length,
        jsonLdTypes,
        invalidJsonLd,
        images: images.map((img) => ({
          altAttr: img.hasAttribute('alt'),
          width: img.getAttribute('width'),
          height: img.getAttribute('height'),
          src: img.getAttribute('src') ?? '',
        })),
        links: links.map((link) => ({
          href: link.getAttribute('href') ?? '',
          target: link.getAttribute('target') ?? '',
          rel: link.getAttribute('rel') ?? '',
        })),
        text: (document.querySelector('main')?.innerText ?? '').trim(),
      };
    });

    const canonicalPath = (() => {
      try {
        return new URL(data.canonical).pathname;
      } catch {
        return '';
      }
    })();
    const internalLinks = unique(
      data.links
        .map((link) => link.href)
        .filter((href) => href.startsWith('/') && !href.startsWith('//'))
        .map((href) => href.split('?')[0].split('#')[0]),
    );
    const expectedTypes = EXPECTED[route.kind] ?? [];
    const issues: string[] = [];

    if (!data.title) issues.push('missing title');
    if (data.title.length < 20) issues.push(`title too short (${data.title.length})`);
    if (data.title.length > 70) issues.push(`title too long (${data.title.length})`);
    if (!data.description) issues.push('missing meta description');
    if (data.description.length < 60) issues.push(`description too short (${data.description.length})`);
    if (data.description.length > 170) issues.push(`description too long (${data.description.length})`);
    if (!data.canonical) issues.push('missing canonical');
    if (canonicalPath && canonicalPath !== route.path) issues.push(`canonical path ${canonicalPath} != ${route.path}`);
    if (/noindex/i.test(data.robots)) issues.push(`noindex on public route: ${data.robots}`);
    if (data.h1.length !== 1) issues.push(`h1 count ${data.h1.length}`);
    if (data.lang !== 'en') issues.push(`lang=${data.lang || 'missing'}`);
    if (!data.viewport.includes('width=device-width')) issues.push('viewport missing width=device-width');
    for (const key of ['site_name', 'type', 'title', 'description', 'url', 'image', 'locale']) {
      if (!data.og[key]) issues.push(`og:${key} missing`);
    }
    for (const key of ['card', 'title', 'description', 'image']) {
      if (!data.twitter[key]) issues.push(`twitter:${key} missing`);
    }
    if (data.invalidJsonLd) issues.push(`${data.invalidJsonLd} invalid JSON-LD block(s)`);
    for (const type of expectedTypes) {
      if (!data.jsonLdTypes.includes(type)) issues.push(`missing JSON-LD ${type}`);
    }
    if (data.images.some((image) => !image.altAttr)) issues.push('image missing alt attribute');
    for (const link of data.links) {
      if (link.target === '_blank' && !/noopener|noreferrer/.test(link.rel)) {
        issues.push(`target=_blank without rel: ${link.href}`);
      }
    }
    for (const href of internalLinks) {
      if (!knownPaths.has(href) && href !== '#' && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
        issues.push(`internal link not in route inventory: ${href}`);
      }
    }

    results.push({
      path: route.path,
      kind: route.kind,
      title: data.title,
      titleLength: data.title.length,
      description: data.description,
      descriptionLength: data.description.length,
      canonical: data.canonical,
      canonicalPath,
      robots: data.robots,
      lang: data.lang,
      viewport: data.viewport,
      og: data.og,
      twitter: data.twitter,
      h1: data.h1,
      h2Count: data.h2Count,
      jsonLdTypes: unique(data.jsonLdTypes),
      invalidJsonLd: data.invalidJsonLd,
      images: data.images.length,
      imagesMissingAltAttr: data.images.filter((image) => !image.altAttr).length,
      imagesWithDimensions: data.images.filter((image) => image.width && image.height).length,
      internalLinks,
      emptyLinks: data.links.filter((link) => !link.href || link.href === '#').length,
      targetBlankWithoutRel: data.links.filter(
        (link) => link.target === '_blank' && !/noopener|noreferrer/.test(link.rel),
      ).length,
      placeholderImages: data.images.filter((image) => image.src.includes('/media/placeholders/')).length,
      wordCount: data.text.split(/\s+/).filter(Boolean).length,
      issues,
    });
  }

  const titleGroups = new Map<string, string[]>();
  const descriptionGroups = new Map<string, string[]>();
  for (const result of results) {
    titleGroups.set(result.title, [...(titleGroups.get(result.title) ?? []), result.path]);
    descriptionGroups.set(result.description, [
      ...(descriptionGroups.get(result.description) ?? []),
      result.path,
    ]);
  }
  const duplicateTitles = [...titleGroups.entries()].filter(([, paths]) => paths.length > 1);
  const duplicateDescriptions = [...descriptionGroups.entries()].filter(([, paths]) => paths.length > 1);

  // Raw HTML: this is what a crawler sees before hydration. It is only useful
  // when the build has been prerendered; the flag records which mode was tested.
  const rawHome = await request.get('/');
  const rawHomeHtml = await rawHome.text();
  const rawPrerendered = /<main[\s>]/i.test(rawHomeHtml) && !rawHomeHtml.includes('id="root"></div>');
  const soft404 = await request.get('/this-route-does-not-exist');
  const robotsTxt = await request.get('/robots.txt');
  const sitemapXml = await request.get('/sitemap.xml');
  const sitemapText = await sitemapXml.text();
  const sitemapLocations = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  const summary = {
    routes: results.length,
    routesWithIssues: results.filter((result) => result.issues.length > 0).length,
    issueCount: results.reduce((sum, result) => sum + result.issues.length, 0),
    duplicateTitles,
    duplicateDescriptions,
    missingJsonLd: results.filter((result) => result.issues.some((issue) => issue.startsWith('missing JSON-LD'))).length,
    invalidJsonLdRoutes: results.filter((result) => result.invalidJsonLd > 0).length,
    imagesMissingAlt: results.reduce((sum, result) => sum + result.imagesMissingAltAttr, 0),
    placeholderImages: results.reduce((sum, result) => sum + result.placeholderImages, 0),
    internalLinks: unique(results.flatMap((result) => result.internalLinks)).length,
    rawPrerendered,
    soft404Status: soft404.status(),
    robotsStatus: robotsTxt.status(),
    sitemapStatus: sitemapXml.status(),
    sitemapUrls: sitemapLocations.length,
    sitemapCoversAllRoutes:
      routes.every((route) => sitemapLocations.includes(`${BASE}${route.path}`)) ||
      routes.every((route) => sitemapLocations.some((url) => url.endsWith(route.path))),
    consoleErrors,
  };

  fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'raw', 'seo.json'),
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

  expect(summary.consoleErrors, 'console errors during SEO crawl').toEqual([]);
  expect(summary.duplicateTitles, 'duplicate titles').toEqual([]);
  expect(summary.duplicateDescriptions, 'duplicate descriptions').toEqual([]);
  expect(summary.invalidJsonLdRoutes, 'pages with invalid JSON-LD').toBe(0);
  expect(summary.imagesMissingAlt, 'images missing alt attribute').toBe(0);
  expect(summary.placeholderImages, 'placeholder images').toBe(0);
  expect(summary.issueCount, 'SEO issue count').toBe(0);
});
