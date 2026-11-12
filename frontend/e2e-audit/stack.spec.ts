import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

const BASE = 'http://localhost:3002';
const API = 'http://localhost:4000/api';
const OUT = path.resolve(process.cwd(), '..', 'audit-artifacts');
const accountsPath = path.join(OUT, 'audit-accounts.json');
const accounts = (fs.existsSync(accountsPath)
  ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
  : {
      admin: { email: '', password: '' },
      portal: { email: '', password: '', customerId: '' },
    }) as {
  admin: { email: string; password: string };
  portal: { email: string; password: string; customerId: string };
};

interface ApiCheck {
  scope: 'public' | 'admin' | 'portal';
  path: string;
  method: string;
  status: number;
  expected: number;
  ok: boolean;
  ms: number;
  contentLength: number;
  message: string;
  detail: string;
}

interface PageCheck {
  area: 'admin' | 'portal';
  path: string;
  ok: boolean;
  status: number | null;
  title: string;
  h1: string;
  textLength: number;
  images: number;
  brokenImages: number;
  tables: number;
  consoleErrors: string[];
  pageErrors: string[];
  failedApi: Array<{ status: number; path: string }>;
  url: string;
}

function firstItem(payload: unknown): Record<string, any> | null {
  const data = (payload as any)?.data ?? payload;
  if (Array.isArray(data)) return data[0] ?? null;
  for (const key of ['items', 'results', 'products', 'blogs', 'services', 'orders', 'customers']) {
    if (Array.isArray(data?.[key])) return data[key][0] ?? null;
  }
  return data && typeof data === 'object' ? data : null;
}

async function login(request: APIRequestContext, kind: 'admin' | 'portal'): Promise<string> {
  const credentials = kind === 'admin' ? accounts.admin : accounts.portal;
  const res = await request.post(`${API}/${kind === 'admin' ? 'auth' : 'portal'}/login`, {
    data: { email: credentials.email, password: credentials.password },
    headers: { origin: BASE },
  });
  expect(res.status(), `${kind} login`).toBe(200);
  const body = await res.json();
  return body.data.token as string;
}

async function getJson(
  request: APIRequestContext,
  pathname: string,
  token?: string,
): Promise<{ status: number; body: any; headers: Record<string, string>; ms: number }> {
  const started = Date.now();
  const res = await request.get(`${API}${pathname}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return {
    status: res.status(),
    body,
    headers: res.headers(),
    ms: Date.now() - started,
  };
}

async function checkApi(
  request: APIRequestContext,
  scope: ApiCheck['scope'],
  pathname: string,
  token: string | undefined,
  expected = 200,
  method = 'GET',
): Promise<ApiCheck> {
  const started = Date.now();
  const res =
    method === 'GET'
      ? await request.get(`${API}${pathname}`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        })
      : await request.fetch(`${API}${pathname}`, {
          method,
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });
  const body = await res.text();
  const contentType = res.headers()['content-type'] ?? '';
  const isCsv = contentType.includes('text/csv');
  let parsed: any = body;
  if (!isCsv) {
    try {
      parsed = body ? JSON.parse(body) : null;
    } catch {
      parsed = null;
    }
  }
  const ok =
    res.status() === expected &&
    (expected >= 400 || isCsv || parsed?.success !== false);
  return {
    scope,
    path: pathname,
    method,
    status: res.status(),
    expected,
    ok,
    ms: Date.now() - started,
    contentLength: body.length,
    message: String(parsed?.message ?? (isCsv ? 'csv' : '')),
    detail: isCsv ? contentType : JSON.stringify(parsed?.data ?? parsed).slice(0, 180),
  };
}

async function collectPage(
  page: Page,
  area: PageCheck['area'],
  route: string,
  errors: string[],
  pageErrors: string[],
  failedApi: Array<{ status: number; path: string }>,
): Promise<PageCheck> {
  errors.length = 0;
  pageErrors.length = 0;
  failedApi.length = 0;
  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
  await page.locator('main').waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const dom = await page.evaluate(() => {
    const imgs = [...document.images];
    return {
      title: document.title,
      h1: document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      textLength: (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ').trim().length,
      images: imgs.length,
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      tables: document.querySelectorAll('main table').length,
      url: location.pathname,
    };
  });
  const text = (await page.locator('main').innerText().catch(() => '')).toLowerCase();
  const looksBroken =
    text.includes('something went wrong') ||
    text.includes('failed to load') ||
    text.includes('application error') ||
    (dom.textLength < 40 && !dom.h1);
  return {
    area,
    path: route,
    ok: Boolean(response?.status() === 200) && !looksBroken && pageErrors.length === 0,
    status: response?.status() ?? null,
    title: dom.title,
    h1: dom.h1,
    textLength: dom.textLength,
    images: dom.images,
    brokenImages: dom.brokenImages,
    tables: dom.tables,
    consoleErrors: [...errors],
    pageErrors: [...pageErrors],
    failedApi: failedApi.filter((call) => call.status >= 400),
    url: dom.url,
  };
}

test.describe.configure({ mode: 'serial' });
test.describe('full stack audit', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      !accounts.admin.email || testInfo.project.name !== 'desktop-1440',
      'Stack audit is desktop-only and needs temporary audit accounts.',
    );
  });
  test.setTimeout(25 * 60_000);
  let adminToken = '';
  let portalToken = '';
  let ids: Record<string, string> = {};
  let apiChecks: ApiCheck[] = [];
  let pageChecks: PageCheck[] = [];
  let contentUpdates: Array<Record<string, unknown>> = [];

  test('API matrix, auth gates and content/image writes', async ({ request }) => {
    adminToken = await login(request, 'admin');
    portalToken = await login(request, 'portal');

    const serviceList = await getJson(request, '/services?limit=100&published=true', adminToken);
    const galleryList = await getJson(request, '/gallery?limit=100&published=true', adminToken);
    const portfolioList = await getJson(request, '/portfolio?limit=100&published=true', adminToken);
    const blogList = await getJson(request, '/blogs?limit=100&published=true', adminToken);
    const productList = await getJson(request, '/admin/products/product-types?limit=100', adminToken);
    const customerList = await getJson(request, '/admin/customers?limit=1', adminToken);
    const orderList = await getJson(request, '/admin/orders?limit=1', adminToken);
    const leadList = await getJson(request, '/leads?limit=1', adminToken);
    const invoiceList = await getJson(request, '/admin/finance/invoices?limit=1', adminToken);
    const paymentList = await getJson(request, '/admin/finance/payments?limit=1', adminToken);
    const mediaList = await getJson(request, '/admin/media?limit=1', adminToken);
    const staffList = await getJson(request, '/admin/staff', adminToken);
    const portalOrders = await getJson(request, '/portal/orders', portalToken);

    const service = firstItem(serviceList.body);
    const gallery = firstItem(galleryList.body);
    const portfolio = firstItem(portfolioList.body);
    const blog = firstItem(blogList.body);
    const product = firstItem(productList.body);
    const customer = firstItem(customerList.body);
    const order = firstItem(orderList.body);
    const lead = firstItem(leadList.body);
    const invoice = firstItem(invoiceList.body);
    const payment = firstItem(paymentList.body);
    const media = firstItem(mediaList.body);
    const staff = firstItem(staffList.body);
    const portalOrder = firstItem(portalOrders.body);

    ids = {
      service: String(service?._id ?? service?.id ?? ''),
      serviceSlug: String(service?.slug ?? ''),
      gallery: String(gallery?._id ?? gallery?.id ?? ''),
      gallerySlug: String(gallery?.slug ?? ''),
      portfolio: String(portfolio?._id ?? portfolio?.id ?? ''),
      portfolioSlug: String(portfolio?.slug ?? ''),
      blog: String(blog?._id ?? blog?.id ?? ''),
      blogSlug: String(blog?.slug ?? ''),
      product: String(product?._id ?? product?.id ?? ''),
      productSlug: String(product?.slug ?? ''),
      customer: String(customer?._id ?? customer?.id ?? ''),
      order: String(order?._id ?? order?.id ?? ''),
      lead: String(lead?._id ?? lead?.id ?? ''),
      invoice: String(invoice?._id ?? invoice?.id ?? ''),
      payment: String(payment?._id ?? payment?.id ?? ''),
      media: String(media?._id ?? media?.id ?? ''),
      staff: String(staff?._id ?? staff?.id ?? ''),
      portalOrder: String(portalOrder?._id ?? portalOrder?.id ?? ''),
    };

    const checks: ApiCheck[] = [];
    const pub = (p: string) => checks.push(checkApi(request, 'public', p, undefined));
    const adm = (p: string, expected = 200) => checks.push(checkApi(request, 'admin', p, adminToken, expected));
    const por = (p: string, expected = 200) => checks.push(checkApi(request, 'portal', p, portalToken, expected));

    for (const p of ['/health', '/health/live', '/health/ready', '/settings/public', '/settings', '/products', '/gallery', '/services', '/portfolio', '/blogs', '/portal/catalog', '/media/resolve?urls=/media/photos/bridal-red-lehenga.jpg']) {
      pub(p);
    }
    adm('/admin/blogs/slug-available?slug=audit-photo-check');
    adm('/admin/services/slug-available?slug=audit-photo-check');
    adm('/admin/portfolio/slug-available?slug=audit-photo-check');
    adm('/admin/gallery/slug-available?slug=audit-photo-check');
    if (ids.productSlug) pub(`/products/${ids.productSlug}`);
    if (ids.gallerySlug) pub(`/gallery/${ids.gallerySlug}`);
    if (ids.serviceSlug) pub(`/services/${ids.serviceSlug}`);
    if (ids.portfolioSlug) pub(`/portfolio/${ids.portfolioSlug}`);
    if (ids.blogSlug) pub(`/blogs/${ids.blogSlug}`);

    for (const p of ['/auth/me', '/auth/mfa', '/auth/sessions', '/auth/audit', '/auth/audit/verify', '/admin/dashboard/summary', '/admin/dashboard/badges', '/admin/customers', '/admin/orders', '/admin/products/categories', '/admin/products/product-types', '/admin/staff', '/admin/finance/summary', '/admin/finance/revenue-by-product', '/admin/finance/profit-loss', '/admin/finance/invoices', '/admin/finance/payments', '/admin/finance/expenses', '/admin/finance/salaries', '/admin/settings', '/admin/media', '/admin/media/folders', '/admin/users', '/admin/users/permissions', '/leads', '/measurement-templates', '/measurements']) {
      adm(p);
    }
    if (ids.customer) {
      adm(`/admin/customers/${ids.customer}`);
      adm(`/admin/customers/${ids.customer}/orders`);
      adm(`/admin/customers/${ids.customer}/measurements`);
      adm(`/admin/portal/customers/${ids.customer}/chat`);
    }
    if (ids.order) adm(`/admin/orders/${ids.order}`);
    if (ids.product) {
      adm(`/admin/products/product-types/${ids.product}`);
      adm(`/admin/products/product-types/${ids.product}/usage`);
    }
    if (ids.invoice) adm(`/admin/finance/invoices/${ids.invoice}`);
    if (ids.media) adm(`/admin/media/${ids.media}`);
    if (ids.lead) adm(`/leads/${ids.lead}`);
    adm('/admin/reports/orders-by-status?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/deliveries-trials?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/revenue-trend?from=2025-01-01&to=2026-12-31&groupBy=month');
    adm('/admin/reports/revenue-by-product?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/revenue-by-service?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/outstanding');
    adm('/admin/reports/expenses-salaries?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/pnl?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/leads-conversion?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/staff-workload?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/customer-repeat?from=2025-01-01&to=2026-12-31');
    adm('/admin/reports/export/orders-by-status?from=2025-01-01&to=2026-12-31');

    for (const p of ['/portal/dashboard', '/portal/orders', '/portal/measurements', '/portal/measurement-templates', '/portal/chat', '/portal/payments', '/portal/catalog']) {
      por(p);
    }
    if (ids.portalOrder) por(`/portal/orders/${ids.portalOrder}`);

    // Auth gates: anonymous and wrong-role tokens must not read protected data.
    checks.push(await checkApi(request, 'admin', '/admin/dashboard/summary', undefined, 401));
    checks.push(await checkApi(request, 'admin', '/admin/dashboard/summary', portalToken, 403));
    checks.push(await checkApi(request, 'portal', '/portal/dashboard', adminToken, 403));

    // Content/image updates: each collection must accept a new image and expose
    // it on the public endpoint, then restore the original value.
    const update = async (
      label: string,
      collection: 'service' | 'gallery' | 'portfolio' | 'blog',
      route: string,
      originalField: string,
      publicPath: string,
      publicField: string,
    ) => {
      if (!route) return;
      const list =
        collection === 'service'
          ? serviceList
          : collection === 'gallery'
            ? galleryList
            : collection === 'portfolio'
              ? portfolioList
              : blogList;
      const item = firstItem(list.body);
      if (!item) return;
      const original = item[originalField];
      const replacement = '/media/photos/bridal-window.jpg';
      const res = await request.put(`${API}${route}`, {
        data: { [originalField]: replacement },
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const updated = await getJson(request, publicPath);
      const value = firstItem(updated.body)?.[publicField];
      await request.put(`${API}${route}`, {
        data: { [originalField]: original },
        headers: { authorization: `Bearer ${adminToken}` },
      });
      contentUpdates.push({ label, route, status: res.status(), original, replacement, publicField, publicValue: value, verified: value === replacement });
    };

    if (ids.service) {
      await update('service image', 'service', `/services/${ids.service}`, 'cardImage', `/services/${ids.serviceSlug}`, 'cardImage');
    }
    if (ids.gallery) {
      await update('gallery image', 'gallery', `/gallery/${ids.gallery}`, 'src', `/gallery/${ids.gallerySlug}`, 'src');
    }
    if (ids.portfolio) {
      await update('portfolio image', 'portfolio', `/portfolio/${ids.portfolio}`, 'coverImage', `/portfolio/${ids.portfolioSlug}`, 'coverImage');
    }
    if (ids.blog) {
      await update('blog cover', 'blog', `/blogs/${ids.blog}`, 'coverImage', `/blogs/${ids.blogSlug}`, 'coverImage');
    }
    if (ids.product) {
      const productItem = firstItem(productList.body);
      const originalGallery = productItem?.gallery;
      const res = await request.patch(`${API}/admin/products/product-types/${ids.product}`, {
        data: { gallery: [{ id: 'audit-image', url: '/media/photos/bridal-window.jpg', alt: 'Audit image update' }] },
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const updated = await getJson(request, `/products/${ids.productSlug}`);
      const value = firstItem(updated.body)?.gallery?.[0]?.url;
      await request.patch(`${API}/admin/products/product-types/${ids.product}`, {
        data: { gallery: originalGallery },
        headers: { authorization: `Bearer ${adminToken}` },
      });
      contentUpdates.push({ label: 'product gallery', route: `/admin/products/product-types/${ids.product}`, status: res.status(), publicField: 'gallery[0].url', publicValue: value, verified: value === '/media/photos/bridal-window.jpg' });
    }

    // Binary image upload through the real media pipeline; delete the test asset.
    const uploadBuffer = fs.readFileSync(path.resolve(process.cwd(), 'public', 'media', 'photos', 'bridal-window.jpg'));
    const upload = await request.post(`${API}/upload?folder=audit`, {
      headers: { authorization: `Bearer ${adminToken}` },
      multipart: {
        file: { name: 'audit-upload.jpg', mimeType: 'image/jpeg', buffer: uploadBuffer },
      },
    });
    const uploadBody = await upload.json().catch(() => null);
    const assetId = uploadBody?.data?.asset?.id as string | undefined;
    let uploadDetailStatus: number | null = null;
    let uploadPatchStatus: number | null = null;
    let uploadDeleteStatus: number | null = null;
    if (assetId) {
      const detail = await request.get(`${API}/admin/media/${assetId}`, {
        headers: { authorization: `Bearer ${adminToken}` },
      });
      uploadDetailStatus = detail.status();
      const patch = await request.patch(`${API}/admin/media/${assetId}`, {
        data: { alt: 'Audit upload — delete after verification' },
        headers: { authorization: `Bearer ${adminToken}` },
      });
      uploadPatchStatus = patch.status();
      const del = await request.delete(`${API}/admin/media/${assetId}`, {
        headers: { authorization: `Bearer ${adminToken}` },
      });
      uploadDeleteStatus = del.status();
    }
    contentUpdates.push({
      label: 'image upload',
      status: upload.status(),
      assetId: assetId ?? null,
      detailStatus: uploadDetailStatus,
      patchStatus: uploadPatchStatus,
      deleteStatus: uploadDeleteStatus,
      verified:
        upload.status() === 201 &&
        Boolean(assetId) &&
        uploadDetailStatus === 200 &&
        uploadPatchStatus === 200 &&
        uploadDeleteStatus === 200,
    });

    apiChecks = await Promise.all(checks);
    const failures = apiChecks.filter((entry) => !entry.ok);
    const summary = {
      apiChecks: apiChecks.length,
      apiPassed: apiChecks.length - failures.length,
      apiFailed: failures.length,
      failures,
      authGates: apiChecks.filter((entry) => entry.expected !== 200),
      contentUpdates,
      ids,
    };
    fs.writeFileSync(path.join(OUT, 'stack-api.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2).slice(0, 12000));

    expect(summary.apiFailed, 'API failures').toBe(0);
    expect(contentUpdates.filter((entry) => !entry.verified), 'content update failures').toEqual([]);
    expect(contentUpdates.find((entry) => entry.label === 'image upload')?.status, 'image upload').toBe(201);
    expect(uploadDeleteStatus, 'uploaded asset cleanup').toBe(200);
  });

  test('admin pages', async ({ page }) => {
    const errors: string[] = [];
    const pageErrors: string[] = [];
    const failedApi: Array<{ status: number; path: string }> = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        failedApi.push({ status: response.status(), path: new URL(response.url()).pathname });
      }
    });

    await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(accounts.admin.email);
    await page.getByLabel('Password').fill(accounts.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 });
    await page.waitForTimeout(1200);

    const routes = [
      '/admin',
      '/admin/gallery',
      '/admin/services',
      '/admin/portfolio',
      '/admin/blogs',
      '/admin/leads',
      '/admin/leads/list',
      '/admin/customers',
      '/admin/products',
      '/admin/orders',
      '/admin/orders/board',
      '/admin/staff',
      '/admin/finance',
      '/admin/invoices',
      '/admin/payments',
      '/admin/reports',
      '/admin/settings',
      '/admin/measurements',
      '/admin/users',
      '/admin/audit',
      '/admin/media',
      '/admin/profile',
    ];
    if (ids.lead) routes.push(`/admin/leads/${ids.lead}`);
    if (ids.customer) routes.push(`/admin/customers/${ids.customer}`);
    if (ids.order) routes.push(`/admin/orders/${ids.order}`);
    if (ids.invoice) routes.push(`/admin/invoices/${ids.invoice}`);
    routes.push('/admin/reports/orders-by-status');

    fs.mkdirSync(path.join(OUT, 'screenshots', 'stack'), { recursive: true });
    for (const route of routes) {
      const check = await collectPage(page, 'admin', route, errors, pageErrors, failedApi);
      pageChecks.push(check);
      if (['/admin', '/admin/services', '/admin/products', '/admin/gallery'].includes(route)) {
        await page.screenshot({
          path: path.join(OUT, 'screenshots', 'stack', `admin${route.replaceAll('/', '-') || '-dashboard'}.png`),
          animations: 'disabled',
        });
      }
    }
  });

  test('customer portal pages', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    const pageErrors: string[] = [];
    const failedApi: Array<{ status: number; path: string }> = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        failedApi.push({ status: response.status(), path: new URL(response.url()).pathname });
      }
    });

    await page.goto(`${BASE}/portal/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(accounts.portal.email);
    await page.getByLabel('Password').fill(accounts.portal.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/portal(\/|$)/, { timeout: 20000 });
    await page.waitForTimeout(1200);

    const routes = [
      '/portal',
      '/portal/dashboard',
      '/portal/orders',
      '/portal/measurements',
      '/portal/chat',
      '/portal/payments',
      '/portal/requests',
    ];
    if (ids.portalOrder) routes.push(`/portal/orders/${ids.portalOrder}`);

    for (const route of routes) {
      const check = await collectPage(page, 'portal', route, errors, pageErrors, failedApi);
      pageChecks.push(check);
      if (route === '/portal/dashboard') {
        await page.screenshot({
          path: path.join(OUT, 'screenshots', 'stack', 'portal-dashboard.png'),
          animations: 'disabled',
        });
      }
    }
    await context.close();
  });

  test('write the combined stack report', async () => {
    const summary = {
      adminPages: pageChecks.filter((p) => p.area === 'admin'),
      portalPages: pageChecks.filter((p) => p.area === 'portal'),
      adminFailed: pageChecks.filter((p) => p.area === 'admin' && !p.ok).length,
      portalFailed: pageChecks.filter((p) => p.area === 'portal' && !p.ok).length,
      api: JSON.parse(fs.readFileSync(path.join(OUT, 'stack-api.json'), 'utf8')),
      contentUpdates,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(OUT, 'stack-audit.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({ adminFailed: summary.adminFailed, portalFailed: summary.portalFailed, adminPages: summary.adminPages.length, portalPages: summary.portalPages.length, api: summary.api.apiChecks, apiFailed: summary.api.apiFailed }, null, 2));

    expect(summary.adminFailed, 'admin page failures').toBe(0);
    expect(summary.portalFailed, 'portal page failures').toBe(0);
    expect(summary.adminPages.every((p) => p.brokenImages === 0), 'admin broken images').toBe(true);
    expect(summary.portalPages.every((p) => p.brokenImages === 0), 'portal broken images').toBe(true);
    expect(summary.adminPages.every((p) => p.failedApi.length === 0), 'admin API errors').toBe(true);
    expect(summary.portalPages.every((p) => p.failedApi.length === 0), 'portal API errors').toBe(true);
  });
});
