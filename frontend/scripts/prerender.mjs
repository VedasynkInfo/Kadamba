/**
 * Prerender the public routes into `dist`.
 *
 * The site is a client-rendered React app and its editorial content lives in
 * MongoDB, so static HTML cannot be produced from source alone. This script
 * runs the built app in Chromium against a tiny static server, proxies `/api`
 * to a live API, waits for the route to settle, and writes the resulting HTML
 * back to disk. Crawlers and first paints get real headings, meta tags and
 * Product/FAQ/LocalBusiness JSON-LD; the SPA still hydrates normally.
 *
 * Usage:
 *   PRERENDER_API_URL=https://kadamba-api.onrender.com npm run build:prerender
 *
 * It is deliberately best-effort: a missing browser or sleeping API leaves the
 * normal `vite build` output intact rather than failing a deployment.
 */
import { createServer } from 'node:http';
import { access, readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const apiOrigin = process.env.PRERENDER_API_URL?.replace(/\/$/, '');
const port = Number(process.env.PRERENDER_PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function fileIfExists(file) {
  try {
    const info = await stat(file);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

async function proxy(req, res, origin) {
  const target = new URL(req.url, origin);
  const headers = { ...req.headers, host: target.host };
  for (const key of ['connection', 'content-length', 'transfer-encoding']) delete headers[key];
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    duplex: 'half',
    redirect: 'manual',
  });
  res.statusCode = upstream.status;
  for (const [key, value] of upstream.headers) {
    if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  }
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const direct = path.join(dist, safe);
  const candidates = [direct, path.join(direct, 'index.html'), path.join(dist, 'index.html')];

  return (async () => {
    for (const candidate of candidates) {
      if (!candidate.startsWith(dist)) continue;
      const info = await fileIfExists(candidate);
      if (!info) continue;
      const body = await readFile(candidate);
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME[path.extname(candidate)] || 'application/octet-stream');
      res.end(body);
      return;
    }
    res.statusCode = 404;
    res.end('Not found');
  })();
}

async function startServer() {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://local').pathname;
    if (apiOrigin && (pathname.startsWith('/api/') || pathname.startsWith('/uploads/'))) {
      proxy(req, res, apiOrigin).catch((error) => {
        res.statusCode = 502;
        res.end(String(error));
      });
      return;
    }
    void serveStatic(req, res);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

async function apiJson(pathname) {
  if (!apiOrigin) return null;
  try {
    const response = await fetch(`${apiOrigin}${pathname}`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(`[prerender] API unavailable for ${pathname}: ${error.message}`);
    return null;
  }
}

async function publicRoutes() {
  const routes = new Set([
    '/',
    '/about',
    '/services',
    '/products',
    '/gallery',
    '/portfolio',
    '/blogs',
    '/contact',
    '/request-service',
  ]);

  const collections = [
    ['/api/services?published=true&limit=100', 'items', '/services'],
    ['/api/portfolio?published=true&limit=100', 'items', '/portfolio'],
    ['/api/blogs?published=true&limit=100', 'items', '/blogs'],
  ];

  for (const [endpoint, key, prefix] of collections) {
    const payload = await apiJson(endpoint);
    for (const item of payload?.data?.[key] ?? []) {
      if (item?.slug) routes.add(`${prefix}/${item.slug}`);
    }
  }

  const catalog = await apiJson('/api/products');
  for (const product of catalog?.data?.products ?? []) {
    if (product?.slug) routes.add(`/products/${product.slug}`);
  }

  return [...routes];
}

async function main() {
  if (!apiOrigin) {
    console.log(
      '[prerender] PRERENDER_API_URL is not set; skipping. Client-rendered build is intact.',
    );
    return;
  }

  await access(path.join(dist, 'index.html')).catch(() => {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  });

  const healthy = await fetch(`${apiOrigin}/api/health/ready`)
    .then((response) => response.ok)
    .catch(() => false);
  if (!healthy) {
    console.warn('[prerender] API is not reachable; keeping the client-rendered build.');
    return;
  }

  let browser;
  let server;
  try {
    const { chromium } = await import('@playwright/test');
    server = await startServer();
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });

    // The SPA's API origin is baked in at build time (usually the production
    // API). Intercept it in the browser and replay against PRERENDER_API_URL so
    // prerendering works from CI without loosening the API's CORS allow-list.
    await page.route('**/api/**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const target = `${apiOrigin}${requestUrl.pathname}${requestUrl.search}`;
      try {
        const response = await route.fetch({ url: target });
        const origin = route.request().headers().origin;
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            'access-control-allow-origin': origin ?? '*',
            'access-control-allow-credentials': 'true',
          },
        });
      } catch (error) {
        await route.abort();
        console.warn(`[prerender] API request failed: ${requestUrl.pathname} (${error.message})`);
      }
    });

    const origin = `http://127.0.0.1:${port}`;
    const routes = await publicRoutes();
    const site = (process.env.VITE_SITE_URL || 'https://kadambastudio.com').replace(/\/$/, '');
    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...routes.map(
        (route) =>
          `  <url><loc>${site}${route === '/' ? '/' : route}</loc><changefreq>weekly</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`,
      ),
      '</urlset>',
      '',
    ].join('\n');
    await writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
    let written = 0;

    for (const route of routes) {
      try {
        await page.goto(`${origin}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
        await page.waitForSelector('main, #main-content', { timeout: 15_000 });
        await page.waitForTimeout(100);
        const html = await page.content();
        const file =
          route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html');
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, html, 'utf8');
        written += 1;
        console.log(`[prerender] ${route}`);
      } catch (error) {
        console.warn(`[prerender] skipped ${route}: ${error.message}`);
      }
    }

    console.log(`[prerender] wrote ${written}/${routes.length} routes.`);
  } catch (error) {
    console.warn(`[prerender] skipped: ${error.message}`);
    console.warn(
      '[prerender] Install Chromium with `npx playwright install chromium` to enable it.',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server?.close(resolve));
  }
}

main().catch((error) => {
  console.warn(`[prerender] ${error.message}`);
});
