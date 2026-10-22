import type { Page, Route } from '@playwright/test';

/**
 * A scriptable stand-in for the API.
 *
 * The end-to-end suite drives the *console*, not the database: a deploy must
 * be able to prove the admin journey, the portal journey and the Kanban board
 * work in the real browser, without a live Mongo in the loop. Every request
 * the app makes is intercepted here and answered from a small, explicit
 * fixture set, so a broken journey fails for a reason a developer can read.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  status: 'active';
  permissions: string[];
}

export const ADMIN_USER: MockUser = {
  id: '65f0000000000000000000a1',
  name: 'Studio Admin',
  email: 'admin@kadambasstudio.com',
  role: 'admin',
  status: 'active',
  permissions: ['*'],
};

export const CUSTOMER_USER: MockUser = {
  id: '65f0000000000000000000c1',
  name: 'Divya Reddy',
  email: 'divya@example.com',
  role: 'customer',
  status: 'active',
  permissions: [],
};

export interface MockOptions {
  /** Which user a successful sign-in returns. */
  user?: MockUser;
  /** Emails that sign in successfully; everything else is rejected. */
  validEmails?: string[];
  /** Require a second factor after the password step. */
  mfaRequired?: boolean;
  /** Extra routes, matched before the built-in ones. */
  routes?: Record<string, unknown | ((route: Route) => unknown)>;
}

const EMPTY_PAGE = { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };

/**
 * A complete settings document.
 *
 * The settings service parses the response against the shared contract, so a
 * partial document is a parse failure rather than a partial read. The mock
 * therefore returns the whole shape.
 */
const SETTINGS = {
  studioName: "Kadamba's Designer Studio",
  shortName: 'Kadamba',
  tagline: "Kurnool's boutique for women's traditional & bridal wear",
  logoUrl: '',
  logoDarkUrl: '',
  location: 'Kurnool',
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  phoneAltDisplay: '',
  phoneAltTel: '',
  email: 'hello@kadambasstudio.com',
  addressLines: ["Kadamba's Designer Studio", 'Kurnool'],
  landmark: '',
  locality: '',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '',
  hours: [{ day: 'Mon – Sat', time: '10:00 AM – 7:00 PM' }],
  whatsappNumber: '919876543210',
  whatsappPrefill: 'Hi, I would like to enquire.',
  mapEmbedUrl: '',
  mapLink: 'https://maps.google.com/?q=Kurnool',
  social: [],
  socialNamed: {},
  seo: { siteName: "Kadamba's Designer Studio" },
  media: { defaultUnit: 'in', bannerPresets: [] },
  theme: { primary: '#b8892b' },
};

const DASHBOARD_SUMMARY = {
  range: { from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  metrics: {
    leadsOpen: 4,
    enquiriesPending: 2,
    ordersActive: 3,
    deliverablesDue: 1,
    revenueMtd: 45000,
    outstandingBalance: 12000,
    pendingMeasurementApprovals: 1,
    overdueOrders: 0,
  },
  series: {
    leadsByMonth: [{ month: '2026-05', count: 4 }],
    revenueByMonth: [{ month: '2026-05', amount: 45000 }],
    ordersByStatus: [{ status: 'confirmed', count: 2 }],
    leadsBySource: [{ source: 'WhatsApp', count: 3 }],
    visitors: null,
  },
  recentLeads: [],
  actionOrders: [],
};

const PRODUCT = {
  id: '65f0000000000000000000p1',
  code: 'BR-LH',
  name: 'Bridal Lehenga',
  slug: 'bridal-lehenga',
  description: 'A hand-finished bridal lehenga.',
  publicDescription: 'A hand-finished bridal lehenga.',
  indicativePriceRange: '₹50,000 – ₹80,000',
  leadTimeDays: 21,
  active: true,
  featured: true,
  sortOrder: 1,
  categoryId: '65f0000000000000000000c2',
  gallery: [],
  variants: [],
  tags: ['bridal'],
  seo: { metaTitle: '', metaDescription: '' },
  measurementTemplateId: '65f0000000000000000000m1',
  sku: '',
  stockItem: '',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const ORDER = {
  id: '65f0000000000000000000o1',
  orderNumber: 7001,
  referenceId: 'KDS-2026-7001',
  customerId: '65f0000000000000000000c1',
  title: 'Bridal Lehenga',
  status: 'stitching',
  priority: 'normal',
  lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
  measurementProfileIds: [],
  assignedStaff: [],
  tags: [],
  notes: [],
  timeline: [],
  paymentSummary: { totalQuoted: 50000, advance: 10000, totalPaid: 10000, balance: 40000 },
  attachments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-02T00:00:00.000Z',
};

/** Requests the suite made, so a test can assert what was sent. */
export interface MockApi {
  requests: Array<{ method: string; path: string; body: unknown }>;
  /** The product list the mock serves; mutate it to simulate a publish. */
  products: Record<string, unknown>[];
  /**
   * Whether the mock holds a session.
   *
   * A successful sign-in sets it, and the refresh endpoint exchanges it for a
   * token — which is what lets a page *reload* stay signed in, exactly as the
   * real httpOnly refresh cookie does.
   */
  signedIn: boolean;
}

function pathOf(url: string): string {
  const withoutOrigin = url.replace(/^https?:\/\/[^/]+/, '');
  const withoutQuery = withoutOrigin.split('?')[0];
  return withoutQuery.replace(/^\/api/, '') || '/';
}

/**
 * Intercept every API call the app makes.
 *
 * Returns a handle the test can inspect afterwards.
 */
export async function mockApi(page: Page, options: MockOptions = {}): Promise<MockApi> {
  const user = options.user ?? ADMIN_USER;
  const validEmails = options.validEmails ?? [user.email];
  const handle: MockApi = { requests: [], products: [PRODUCT], signedIn: false };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = pathOf(request.url());
    let body: unknown = undefined;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData() ?? undefined;
    }
    handle.requests.push({ method, path, body });

    // A test-supplied route wins.
    const custom = options.routes?.[`${method} ${path}`] ?? options.routes?.[path];
    if (custom) {
      if (typeof custom === 'function') {
        await route.fulfill({ json: (custom as (r: Route) => unknown)(route) });
      } else {
        await route.fulfill({ json: custom });
      }
      return;
    }

    const json = (payload: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });

    // ── Auth ────────────────────────────────────────────────────────────────
    if (path === '/auth/refresh') {
      // The refresh cookie only exists after a sign-in, exactly like the real
      // httpOnly cookie the server sets.
      if (!handle.signedIn) {
        await json({ success: false, code: 'UNAUTHENTICATED', message: 'No session' }, 401);
        return;
      }
      await json({
        success: true,
        message: 'Session refreshed',
        data: { user, token: 'e2e-access-token', expiresIn: 3600 },
      });
      return;
    }

    if (path === '/auth/login') {
      const email = String((body as { email?: string })?.email ?? '').toLowerCase();
      const password = String((body as { password?: string })?.password ?? '');
      if (!validEmails.includes(email) || password.length < 4) {
        await json(
          { success: false, code: 'UNAUTHENTICATED', message: 'Invalid email or password' },
          401,
        );
        return;
      }
      if (options.mfaRequired) {
        await json({
          success: true,
          message: 'Two-factor required',
          data: { mfaRequired: true, mfaTicket: 'e2e-mfa-ticket', user },
        });
        return;
      }
      await json({
        success: true,
        message: 'Login successful',
        data: { user, token: 'e2e-access-token', expiresIn: 3600 },
      });
      handle.signedIn = true;
      return;
    }

    if (path === '/auth/login/mfa') {
      await json({
        success: true,
        message: 'Verified',
        data: { user, token: 'e2e-access-token', expiresIn: 3600 },
      });
      return;
    }

    if (path === '/auth/me') {
      await json({ success: true, message: 'Current user', data: { user } });
      return;
    }

    if (path === '/auth/logout') {
      handle.signedIn = false;
      await json({ success: true, message: 'Signed out' });
      return;
    }

    // ── Admin console ───────────────────────────────────────────────────────
    if (path === '/admin/dashboard/summary') {
      await json({ success: true, message: 'Summary', data: DASHBOARD_SUMMARY });
      return;
    }

    if (path === '/admin/dashboard/badges') {
      await json({
        success: true,
        message: 'Badges',
        data: { leads: 4, measurements: 1, chat: 0 },
      });
      return;
    }

    if (path === '/admin/products/categories') {
      await json({
        success: true,
        data: [
          { id: '65f0000000000000000000c2', code: 'BRIDAL', name: 'Bridal Collection', sortOrder: 1 },
        ],
      });
      return;
    }

    if (path === '/admin/products/product-types') {
      await json({
        success: true,
        data: { items: handle.products, pagination: { page: 1, limit: 20, total: handle.products.length, pages: 1 } },
      });
      return;
    }

    if (path.endsWith('/usage')) {
      await json({
        success: true,
        data: { orderCount: 0, openOrderCount: 0, serviceCount: 0, services: [] },
      });
      return;
    }

    if (path.startsWith('/admin/products/product-types/')) {
      await json({ success: true, data: handle.products[0] });
      return;
    }

    if (path === '/admin/orders') {
      await json({
        success: true,
        data: { items: [ORDER], pagination: { page: 1, limit: 20, total: 1, pages: 1 } },
      });
      return;
    }

    if (path.startsWith('/admin/orders/')) {
      await json({ success: true, data: ORDER });
      return;
    }

    if (path === '/admin/leads') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/customers') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/measurements') {
      await json({ success: true, data: [] });
      return;
    }

    if (path === '/admin/measurement-templates') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/measurement-templates') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/staff') {
      await json({ success: true, data: [] });
      return;
    }

    if (path === '/admin/gallery' || path === '/admin/blogs' || path === '/admin/services') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/portfolio') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/media') {
      await json({ success: true, data: { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } } });
      return;
    }

    if (path === '/admin/users') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/admin/settings') {
      await json({
        success: true,
        data: { ...SETTINGS, emailConfig: { pass: '', passSet: false } },
      });
      return;
    }

    if (path.startsWith('/admin/finance')) {
      await json({ success: true, data: { items: [], summary: {} } });
      return;
    }

    if (path.startsWith('/admin/reports')) {
      await json({ success: true, data: { rows: [], summary: {} } });
      return;
    }

    if (path === '/admin/audit') {
      await json({ success: true, data: { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } } });
      return;
    }

    // ── Public site ─────────────────────────────────────────────────────────
    if (path === '/settings/public') {
      await json({ success: true, data: SETTINGS });
      return;
    }

    if (path === '/products') {
      await json({
        success: true,
        data: { categories: [], products: handle.products },
      });
      return;
    }

    if (path.startsWith('/products/')) {
      await json({ success: true, data: handle.products[0] });
      return;
    }

    if (path === '/services') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/gallery') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/portfolio') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    if (path === '/blogs') {
      await json({ success: true, data: EMPTY_PAGE });
      return;
    }

    // ── Customer portal ─────────────────────────────────────────────────────
    if (path === '/portal/refresh') {
      if (!handle.signedIn) {
        await json({ success: false, code: 'UNAUTHENTICATED', message: 'No session' }, 401);
        return;
      }
      await json({
        success: true,
        message: 'Session refreshed',
        data: { user, token: 'e2e-portal-token', expiresIn: 3600 },
      });
      return;
    }

    if (path === '/portal/login') {
      await json({
        success: true,
        message: 'Signed in',
        data: { user, token: 'e2e-portal-token', expiresIn: 3600 },
      });
      handle.signedIn = true;
      return;
    }

    if (path === '/portal/dashboard') {
      await json({
        success: true,
        data: {
          referenceId: 'KDS-2026-7001',
          customerName: CUSTOMER_USER.name,
          totalOrderCount: 1,
          activeOrderCount: 1,
          pendingMeasurementCount: 0,
          totalOutstanding: 40000,
        },
      });
      return;
    }

    if (path === '/portal/orders') {
      await json({ success: true, data: [ORDER] });
      return;
    }

    if (path.startsWith('/portal/orders/')) {
      await json({ success: true, data: ORDER });
      return;
    }

    if (path === '/portal/measurements') {
      await json({ success: true, data: [] });
      return;
    }

    if (path === '/portal/measurement-templates') {
      await json({ success: true, data: [] });
      return;
    }

    if (path === '/portal/chat') {
      await json({ success: true, data: [] });
      return;
    }

    if (path === '/portal/payments') {
      await json({
        success: true,
        data: { outstandingBalance: 40000, invoices: [], payments: [] },
      });
      return;
    }

    if (path === '/portal/requests') {
      await json({ success: true, data: { id: '65f0000000000000000000r1', status: 'New' } });
      return;
    }

    if (path === '/portal/catalog') {
      await json({ success: true, data: { categories: [], products: handle.products } });
      return;
    }

    // Anything else: a successful, empty answer. A journey that depends on
    // real data will fail on its own assertion, not on a 404.
    if (process.env.E2E_DEBUG) {
      console.log('unmocked', method, path);
    }
    await json({ success: true, data: EMPTY_PAGE });
  });

  return handle;
}
