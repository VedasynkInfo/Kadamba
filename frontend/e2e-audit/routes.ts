import type { APIRequestContext } from '@playwright/test';

export const API = 'http://localhost:4000/api';

export interface AuditRoute {
  path: string;
  kind: string;
  /** Key routes get a viewport screenshot. */
  screenshot?: boolean;
}

/** Static routes discovered from the router + sitemap. */
const STATIC_ROUTES: AuditRoute[] = [
  { path: '/', kind: 'home', screenshot: true },
  { path: '/about', kind: 'about', screenshot: true },
  { path: '/services', kind: 'services', screenshot: true },
  { path: '/products', kind: 'products', screenshot: true },
  { path: '/gallery', kind: 'gallery', screenshot: true },
  { path: '/portfolio', kind: 'portfolio', screenshot: true },
  { path: '/blogs', kind: 'blogs', screenshot: true },
  { path: '/contact', kind: 'contact', screenshot: true },
  { path: '/kurnool', kind: 'kurnool', screenshot: true },
  { path: '/request-service', kind: 'request-service', screenshot: true },
  { path: '/design-system', kind: 'design-system' },
  { path: '/this-route-does-not-exist', kind: '404', screenshot: true },
];

const CLUSTERS = ['bridal', 'traditional', 'tailoring', 'kurnool', 'fabric-and-care', 'wedding-season'];
const LOCALITIES = ['kurnool-city', 'adoni', 'nandyal', 'yemmiganur', 'dhone'];

function extractList(json: unknown): Array<{ slug?: string; title?: string; name?: string }> {
  const root = json as { data?: unknown };
  const data = root?.data as
    | { items?: unknown[]; products?: unknown[] }
    | unknown[]
    | undefined;
  if (Array.isArray(data)) return data as Array<{ slug?: string }>;
  if (data && Array.isArray(data.items)) return data.items as Array<{ slug?: string }>;
  if (data && Array.isArray(data.products)) return data.products as Array<{ slug?: string }>;
  return [];
}

async function fetchList(request: APIRequestContext, endpoint: string) {
  const res = await request.get(`${API}/${endpoint}`);
  if (!res.ok()) return [];
  return extractList(await res.json());
}

/**
 * Build the route list from the live CMS, so the audit covers what the studio
 * has actually published rather than a stale hard-coded sample.
 */
export async function loadRoutes(request: APIRequestContext): Promise<AuditRoute[]> {
  const [services, portfolio, blogs, products] = await Promise.all([
    fetchList(request, 'services?limit=100&published=true'),
    fetchList(request, 'portfolio?limit=100&published=true'),
    fetchList(request, 'blogs?limit=100&published=true'),
    fetchList(request, 'products?limit=100&published=true'),
  ]);

  const routes: AuditRoute[] = [...STATIC_ROUTES];

  for (const item of services) {
    if (item.slug) routes.push({ path: `/services/${item.slug}`, kind: 'service-detail' });
  }
  for (const item of portfolio) {
    if (item.slug) routes.push({ path: `/portfolio/${item.slug}`, kind: 'portfolio-detail' });
  }
  for (const item of blogs) {
    if (item.slug) routes.push({ path: `/blogs/${item.slug}`, kind: 'blog-detail' });
  }
  for (const item of products) {
    if (item.slug) routes.push({ path: `/products/${item.slug}`, kind: 'product-detail' });
  }
  for (const cluster of CLUSTERS) {
    routes.push({ path: `/blogs/cluster/${cluster}`, kind: 'blog-cluster' });
  }
  for (const locality of LOCALITIES) {
    routes.push({ path: `/kurnool/${locality}`, kind: 'locality' });
  }

  // Screenshot one representative detail page of each family.
  const firstService = routes.find((r) => r.kind === 'service-detail');
  const firstProduct = routes.find((r) => r.kind === 'product-detail');
  const firstPortfolio = routes.find((r) => r.kind === 'portfolio-detail');
  const firstBlog = routes.find((r) => r.kind === 'blog-detail');
  const firstLocality = routes.find((r) => r.kind === 'locality');
  for (const route of [firstService, firstProduct, firstPortfolio, firstBlog, firstLocality]) {
    if (route) route.screenshot = true;
  }

  return routes;
}
