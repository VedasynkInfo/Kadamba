import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';
import { createApp } from '../app';
import { BLOG_CATEGORIES } from '../models/Blog';
import { GALLERY_CATEGORIES } from '../models/GalleryItem';
import { PORTFOLIO_CATEGORIES } from '../models/Portfolio';
import { SERVICE_CATEGORIES } from '../models/Service';
import {
  apiErrorResponseSchema,
  blogCategorySchema,
  blogPostSchema,
  blogsPageSchema,
  galleryCategorySchema,
  galleryItemSchema,
  galleryPageSchema,
  leadCreatedSchema,
  leadRequestSchema,
  leadsPageSchema,
  portfolioCategorySchema,
  portfolioPageSchema,
  portfolioProjectSchema,
  serviceCategorySchema,
  serviceDetailSchema,
  servicesPageSchema,
  websiteSettingsSchema,
} from '../shared/schemas';
import { registerAdminAndGetToken } from './helpers/auth';
import {
  allowedOrderTransitions,
  canTransitionOrder,
  isOrderStatusTerminal,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
} from '../shared/enums';

const app = createApp();

/** Parse `res.body.data` and report the failing paths when it does not match. */
function expectContract(schema: ZodType<unknown>, value: unknown, label: string) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `${label} does not satisfy the shared contract:\n` +
        result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n'),
    );
  }
}

/**
 * The shared contract is only worth having if it describes *real* responses.
 * These tests drive the API and parse what it returns, so a field the models
 * stop returning — or start returning with a different type — fails here rather
 * than silently in the browser.
 */
describe('shared response contract', () => {
  it('keeps the CMS category vocabulary identical to the models', () => {
    expect(galleryCategorySchema.options).toEqual([...GALLERY_CATEGORIES]);
    expect(serviceCategorySchema.options).toEqual([...SERVICE_CATEGORIES]);
    expect(portfolioCategorySchema.options).toEqual([...PORTFOLIO_CATEGORIES]);
    expect(blogCategorySchema.options).toEqual([...BLOG_CATEGORIES]);
  });

  it('describes a created gallery item and the gallery list', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Contract Piece',
        category: 'Bridal',
        src: '/media/placeholders/bridal.jpg',
        alt: 'A bridal piece',
        width: 1200,
        height: 1600,
      });

    expect(created.status).toBe(201);
    expectContract(galleryItemSchema, created.body.data, 'POST /api/gallery data');

    const fetched = await request(app)
      .get(`/api/gallery/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expectContract(galleryItemSchema, fetched.body.data, 'GET /api/gallery/:id data');

    const list = await request(app)
      .get('/api/gallery')
      .set('Authorization', `Bearer ${token}`);
    expectContract(galleryPageSchema, list.body.data, 'GET /api/gallery data');
  });

  it('describes a created service and the services list', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Contract Service',
        category: 'Bridal',
        summary: 'A service written by the contract test.',
        bannerImage: '/media/placeholders/embroidery.jpg',
        bannerAlt: 'Embroidery',
        cardImage: '/media/placeholders/embroidery.jpg',
      });

    expect(created.status).toBe(201);
    expectContract(serviceDetailSchema, created.body.data, 'POST /api/services data');

    const list = await request(app)
      .get('/api/services')
      .set('Authorization', `Bearer ${token}`);
    expectContract(servicesPageSchema, list.body.data, 'GET /api/services data');
  });

  it('describes a created portfolio project and the portfolio list', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Contract Project',
        category: 'Traditional',
        summary: 'A project written by the contract test.',
        bannerImage: '/media/placeholders/saree.jpg',
        bannerAlt: 'Saree',
        coverImage: '/media/placeholders/saree.jpg',
        coverAlt: 'Saree',
      });

    expect(created.status).toBe(201);
    expectContract(portfolioProjectSchema, created.body.data, 'POST /api/portfolio data');

    const list = await request(app)
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${token}`);
    expectContract(portfolioPageSchema, list.body.data, 'GET /api/portfolio data');
  });

  it('describes a created post and the journal list', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Contract Post',
        excerpt: 'A post written by the contract test.',
        category: 'Studio Notes',
        coverImage: '/media/placeholders/fabric.jpg',
        coverAlt: 'Fabric',
      });

    expect(created.status).toBe(201);
    expectContract(blogPostSchema, created.body.data, 'POST /api/blogs data');

    const list = await request(app)
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);
    expectContract(blogsPageSchema, list.body.data, 'GET /api/blogs data');
  });

  it('describes the settings document the public site reads', async () => {
    const res = await request(app).get('/api/settings/public');
    expect(res.status).toBe(200);
    // `null` is legitimate before a studio has saved anything; the client merges
    // its own defaults over it.
    if (res.body.data !== null) {
      expectContract(websiteSettingsSchema, res.body.data, 'GET /api/settings/public data');
    }
  });

  it('describes the receipt the enquiry form gets back, and the leads desk', async () => {
    const created = await request(app).post('/api/leads').send({
      name: 'Contract Lead',
      email: 'contract@example.com',
      phone: '+91 90000 00000',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '₹50,000 – ₹80,000',
      preferredDate: '2030-01-01',
      message: 'A message long enough to satisfy the enquiry form rules.',
    });

    expect(created.status).toBe(201);
    expectContract(leadCreatedSchema, created.body.data, 'POST /api/leads data');

    const token = await registerAdminAndGetToken(app);
    const list = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${token}`);
    expectContract(leadsPageSchema, list.body.data, 'GET /api/leads data');
  });

  it('rejects a bad write with the shared error envelope, naming the field', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ok title', category: 'NotACategory', src: '/x.jpg', width: 10, height: 10 });

    expect(res.status).toBe(400);
    expectContract(apiErrorResponseSchema, res.body, 'validation failure envelope');
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(res.body.errors)).toContain('category');
  });

  it('applies the enquiry rules the shared schema states', async () => {
    const base = {
      name: 'Contract Lead',
      email: 'contract@example.com',
      phone: '9000000000',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50000',
      preferredDate: '2030-01-01',
      message: 'A message long enough to satisfy the enquiry rules.',
    };

    // The schema is satisfied by a well-formed payload…
    expect(leadRequestSchema.safeParse(base).success).toBe(true);

    // …and the route refuses exactly what the schema refuses.
    const tooShort = await request(app)
      .post('/api/leads')
      .send({ ...base, message: 'short' });
    expect(tooShort.status).toBe(400);
    expect(tooShort.body.code).toBe('VALIDATION_FAILED');

    const pastDate = await request(app)
      .post('/api/leads')
      .send({ ...base, preferredDate: '2000-01-01' });
    expect(pastDate.status).toBe(400);

    const badEmail = await request(app)
      .post('/api/leads')
      .send({ ...base, email: 'not-an-email' });
    expect(badEmail.status).toBe(400);
  });
});

/**
 * The order lifecycle is shared vocabulary, and both ends now derive from
 * `ORDER_STATUS_TRANSITIONS` — the server to enforce it, the console to decide
 * which moves to offer. These assertions are what keeps that map a machine.
 */
describe('order state machine', () => {
  it('only ever points at real statuses, and never at itself', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUS_TRANSITIONS[from]) {
        expect(ORDER_STATUSES, `${from} → ${to}`).toContain(to);
        expect(to, `${from} → ${to}`).not.toBe(from);
      }
    }
  });

  it('covers every status, so no state is undefined', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_TRANSITIONS[status], status).toBeDefined();
    }
  });

  it('leaves every status somewhere to go except the one that ends the story', () => {
    const stuck = ORDER_STATUSES.filter((status) => allowedOrderTransitions(status).length === 0);
    expect(stuck).toEqual(['delivery']);
  });

  it('answers canTransitionOrder from the same map the API enforces', () => {
    expect(canTransitionOrder('enquiry', 'confirmed')).toBe(true);
    expect(canTransitionOrder('enquiry', 'delivery')).toBe(false);
    expect(canTransitionOrder('delivery', 'finishing')).toBe(false);
    expect(canTransitionOrder('cancelled', 'enquiry')).toBe(true);

    expect(isOrderStatusTerminal('delivery')).toBe(true);
    expect(isOrderStatusTerminal('finishing')).toBe(false);
  });

  it('lets an order be paused or cancelled from anywhere it is still moving', () => {
    const pausable = ORDER_STATUSES.filter((status) => allowedOrderTransitions(status).length > 0);
    for (const status of pausable) {
      const allowed = allowedOrderTransitions(status);
      expect(allowed.includes('cancelled') || status === 'cancelled', status).toBe(true);
    }
  });
});
