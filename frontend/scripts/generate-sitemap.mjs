/**
 * Generate the sitemap and `robots.txt`.
 *
 * A sitemap is a list of the pages that deserve to be found. Written by hand
 * it is wrong within a week: a product is published, an article is posted, and
 * neither is in the file. So this reads the live catalogue — the products,
 * the articles, the services — and adds them to the static routes.
 *
 * The static routes are the floor; the catalogue is what makes the file
 * worth submitting. Without an API the script still writes the static
 * routes, so a build never fails for want of a sitemap.
 *
 * Usage:
 *   SITEMAP_API_URL=https://api.kadambastudio.com/api npm run build:sitemap
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const siteOrigin = (process.env.SITEMAP_SITE_URL || 'https://kadambastudio.com').replace(/\/$/, '');
const apiOrigin = process.env.SITEMAP_API_URL?.replace(/\/$/, '');

/**
 * The static, indexable routes.
 *
 * `/design-system`, `/admin` and the portal are deliberately absent: they are
 * the studio's own surfaces, and a sitemap is a list of what the public may
 * read.
 */
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/services/bridal-wear', priority: '0.8', changefreq: 'monthly' },
  { path: '/services/traditional-wear', priority: '0.8', changefreq: 'monthly' },
  { path: '/services/custom-tailoring', priority: '0.8', changefreq: 'monthly' },
  { path: '/services/boutique-styling', priority: '0.8', changefreq: 'monthly' },
  { path: '/products', priority: '0.9', changefreq: 'weekly' },
  { path: '/gallery', priority: '0.7', changefreq: 'weekly' },
  { path: '/portfolio', priority: '0.7', changefreq: 'weekly' },
  { path: '/blogs', priority: '0.8', changefreq: 'daily' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/request-service', priority: '0.8', changefreq: 'monthly' },
];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Read an array out of whatever shape the endpoint returned. */
function readList(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  for (const key of ['items', 'products', 'blogs', 'articles', 'services', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

/** The public path of a catalogue entry, if it has one. */
function publicPath(entry) {
  const slug = entry?.publicSlug || entry?.slug;
  if (!slug) return null;

  const prefix =
    entry?.productTypeCode || entry?.type === 'product'
      ? '/products'
      : entry?.type === 'service'
        ? '/services'
        : entry?.type === 'blog' || entry?.publishedAt || entry?.author
          ? '/blogs'
          : null;
  if (!prefix) return null;

  // A slug may already carry its prefix.
  if (slug.startsWith('/')) return slug;
  return `${prefix}/${slug}`;
}

/** Fetch one endpoint and return its list, or nothing if it is unreachable. */
async function fetchList(pathname, params = {}) {
  if (!apiOrigin) return [];
  const url = new URL(`${apiOrigin}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) return [];
    return readList(await response.json());
  } catch {
    return [];
  }
}

async function collect() {
  const routes = [...STATIC_ROUTES];

  const [products, blogs, services] = await Promise.all([
    fetchList('/products', { limit: 500 }),
    fetchList('/blogs', { limit: 500 }),
    fetchList('/services', { limit: 200 }),
  ]);

  const seen = new Set(routes.map((route) => route.path));

  const add = (entry, prefix, priority, changefreq, lastmod) => {
    const slug = entry?.publicSlug || entry?.slug;
    if (!slug) return;
    const routePath = `${prefix}/${slug}`;
    if (seen.has(routePath)) return;
    seen.add(routePath);
    routes.push({ path: routePath, priority, changefreq, lastmod });
  };

  for (const product of products) {
    add(product, '/products', '0.8', 'weekly', product?.updatedAt || product?.createdAt);
  }
  for (const blog of blogs) {
    add(blog, '/blogs', '0.7', 'monthly', blog?.updatedAt || blog?.publishedAt);
  }
  for (const service of services) {
    add(service, '/services', '0.8', 'monthly', service?.updatedAt);
  }

  return routes;
}

function renderSitemap(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = routes
    .map((route) => {
      const parts = [
        `    <loc>${xmlEscape(`${siteOrigin}${route.path}`)}</loc>`,
        `    <lastmod>${route.lastmod ? String(route.lastmod).slice(0, 10) : today}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
      ];
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

const robots = `# Kadamba's Designer Studio — Kurnool
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /portal/
Disallow: /design-system

# Crawlers should not reach the API through the site host.
Disallow: /api/

Sitemap: ${siteOrigin}/sitemap.xml
`;

const routes = await collect();
await mkdir(dist, { recursive: true });
await writeFile(path.join(dist, 'sitemap.xml'), renderSitemap(routes), 'utf8');
await writeFile(path.join(dist, 'robots.txt'), robots, 'utf8');

console.log(`sitemap: ${routes.length} url(s) written to dist/sitemap.xml`);
if (!apiOrigin) {
  console.log('  (no SITEMAP_API_URL — only the static routes were written)');
}
