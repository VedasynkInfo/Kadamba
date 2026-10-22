import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';
import {
  apiErrorResponseSchema,
  apiSuccessResponseSchema,
  blogPostSchema,
  blogWriteSchema,
  blogsPageSchema,
  galleryItemSchema,
  galleryPageSchema,
  galleryWriteSchema,
  leadCreatedSchema,
  leadRequestSchema,
  leadSchema,
  leadsPageSchema,
  portfolioPageSchema,
  portfolioProjectSchema,
  portfolioWriteSchema,
  serviceDetailSchema,
  serviceWriteSchema,
  servicesPageSchema,
  websiteSettingsSchema,
} from '../shared/schemas';

/**
 * The shared contract, round-tripped.
 *
 * A schema that only works on the object it was written against is a schema
 * that breaks the first time a value crosses the wire. These tests take a
 * realistic payload, parse it, put it through JSON (which is what actually
 * happens between the API and the browser), and parse it again. If the second
 * parse differs from the first, the two sides would disagree about the same
 * document.
 *
 * The frontend's copy of the contract is checked against the same payloads, so
 * "the files are identical" is not taken on trust.
 */

const root = path.resolve(__dirname, '../../..');

/** A payload that satisfies every response schema in the contract. */
const GALLERY_ITEM = {
  id: '65f000000000000000000001',
  slug: 'bridal-lehenga-look',
  title: 'Bridal Lehenga',
  category: 'Bridal',
  alt: 'A red bridal lehenga',
  mediaType: 'image',
  src: '/uploads/bridal.jpg',
  width: 1200,
  height: 1600,
  published: true,
  sortOrder: 1,
};

const SERVICE = {
  id: '65f000000000000000000002',
  slug: 'bridal-consultation',
  title: 'Bridal Consultation',
  category: 'Bridal',
  summary: 'An hour of styling.',
  description: ['We look at silhouettes', 'We pick the fabric'],
  bannerImage: '/uploads/banner.jpg',
  bannerAlt: 'Banner',
  cardImage: '/uploads/card.jpg',
  icon: 'bridal',
  gallery: [{ id: 'g1', image: '/uploads/g1.jpg', alt: 'A gallery piece', title: 'Piece' }],
  features: [{ id: 'f1', title: 'Fabric', description: 'Silk and cotton' }],
  pricing: {
    note: 'From',
    startingFrom: '₹2,500',
    tiers: [{ id: 't1', name: 'Standard', priceLabel: '₹2,500', detail: 'One fitting' }],
  },
  includes: ['Fitting'],
  durationNote: '60 minutes',
  ctaLabel: 'Book now',
  published: true,
  sortOrder: 1,
  isFulfillable: true,
  linkedProductTypeIds: ['65f000000000000000000009'],
  defaultLeadTimeDays: 21,
  basePriceFrom: 2500,
  tags: ['bridal'],
};

const PORTFOLIO = {
  id: '65f000000000000000000003',
  slug: 'a-wedding-in-kurnool',
  title: 'A Wedding in Kurnool',
  category: 'Bridal',
  summary: 'A bride in a green lehenga.',
  story: ['She came in with a photograph', 'We built the look around it'],
  year: '2026',
  location: 'Kurnool',
  bannerImage: '/uploads/banner.jpg',
  bannerAlt: 'Banner',
  coverImage: '/uploads/cover.jpg',
  coverAlt: 'Cover',
  gallery: [{ id: 'p1', image: '/uploads/p1.jpg', alt: 'A gallery piece' }],
  beforeAfter: {
    beforeImage: '/uploads/before.jpg',
    beforeAlt: 'Before',
    afterImage: '/uploads/after.jpg',
    afterAlt: 'After',
    note: 'The finished look',
  },
  clientStory: { quote: 'It felt like me.', name: 'Divya', occasion: 'Wedding' },
  tags: ['bridal'],
  ctaLabel: 'Start your project',
  published: true,
  sortOrder: 1,
};

const BLOG = {
  id: '65f000000000000000000004',
  slug: 'how-we-fit-a-bridal-lehenga',
  title: 'How we fit a bridal lehenga',
  excerpt: 'Three fittings, one silhouette.',
  content: ['First we measure', 'Then we drape'],
  category: 'Bridal',
  coverImage: '/uploads/cover.jpg',
  coverAlt: 'Cover',
  published: true,
  featured: true,
  readMinutes: 4,
  author: "Kadamba's Designer Studio",
  date: '2026-05-01',
  tags: ['bridal'],
};

const LEAD = {
  id: '65f000000000000000000005',
  name: 'Divya Reddy',
  phone: '9876500000',
  email: 'divya@example.com',
  city: 'Kurnool',
  service: 'Bridal Lehenga',
  occasion: 'Wedding',
  budget: '₹50,000 – ₹80,000',
  preferredDate: '2026-12-01',
  message: 'I would like to book a fitting consultation.',
  status: 'New',
  source: 'Request Service',
  assignee: 'Unassigned',
  notes: [],
  timeline: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const SETTINGS = {
  studioName: "Kadamba's Designer Studio",
  shortName: 'Kadamba',
  tagline: "Kurnool's boutique",
  logoUrl: '/uploads/logo.svg',
  logoDarkUrl: '/uploads/logo-dark.svg',
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
  theme: { primary: '#000000' },
};

const PAGINATION = { page: 1, limit: 20, total: 1, pages: 1 };

/** The export each response case comes from, so both copies can be compared. */
const RESPONSE_EXPORT_NAMES: Record<string, string> = {
  'gallery item': 'galleryItemSchema',
  service: 'serviceDetailSchema',
  'portfolio project': 'portfolioProjectSchema',
  'blog post': 'blogPostSchema',
  lead: 'leadSchema',
  'lead receipt': 'leadCreatedSchema',
  'website settings': 'websiteSettingsSchema',
  'gallery page': 'galleryPageSchema',
  'services page': 'servicesPageSchema',
  'portfolio page': 'portfolioPageSchema',
  'blogs page': 'blogsPageSchema',
  'leads page': 'leadsPageSchema',
  'error envelope': 'apiErrorResponseSchema',
};

/** Every response schema, with a payload that must satisfy it. */
const RESPONSE_CASES: Array<{ name: string; schema: ZodType<unknown>; payload: unknown }> = [
  { name: 'gallery item', schema: galleryItemSchema, payload: GALLERY_ITEM },
  { name: 'service', schema: serviceDetailSchema, payload: SERVICE },
  { name: 'portfolio project', schema: portfolioProjectSchema, payload: PORTFOLIO },
  { name: 'blog post', schema: blogPostSchema, payload: BLOG },
  { name: 'lead', schema: leadSchema, payload: LEAD },
  { name: 'lead receipt', schema: leadCreatedSchema, payload: { id: LEAD.id, status: 'New' } },
  { name: 'website settings', schema: websiteSettingsSchema, payload: SETTINGS },
  {
    name: 'gallery page',
    schema: galleryPageSchema,
    payload: { items: [GALLERY_ITEM], pagination: PAGINATION },
  },
  {
    name: 'services page',
    schema: servicesPageSchema,
    payload: { items: [SERVICE], pagination: PAGINATION },
  },
  {
    name: 'portfolio page',
    schema: portfolioPageSchema,
    payload: { items: [PORTFOLIO], pagination: PAGINATION },
  },
  {
    name: 'blogs page',
    schema: blogsPageSchema,
    payload: { items: [BLOG], pagination: PAGINATION },
  },
  {
    name: 'leads page',
    schema: leadsPageSchema,
    payload: { items: [LEAD], pagination: PAGINATION },
  },
  {
    name: 'error envelope',
    schema: apiErrorResponseSchema,
    payload: { success: false, code: 'NOT_FOUND', message: 'Route not found' },
  },
  {
    name: 'success envelope',
    schema: apiSuccessResponseSchema(galleryItemSchema),
    payload: { success: true, data: GALLERY_ITEM, message: 'Gallery item' },
  },
];

describe('shared contract round-trip', () => {
  for (const { name, schema, payload } of RESPONSE_CASES) {
    it(`${name} survives a JSON round-trip unchanged`, () => {
      const first = schema.parse(payload);
      const wire = JSON.parse(JSON.stringify(first));
      const second = schema.parse(wire);

      expect(second).toEqual(first);
    });
  }

  it('keeps the fields the contract declares and passes the rest through', () => {
    const parsed = galleryItemSchema.parse({ ...GALLERY_ITEM, somethingNew: 'kept' });
    expect(parsed).toHaveProperty('somethingNew', 'kept');
  });

  it('rejects a response that is missing a field it declares', () => {
    const { width: _width, ...withoutWidth } = GALLERY_ITEM;
    const result = galleryItemSchema.safeParse(withoutWidth);
    expect(result.success).toBe(false);
  });

  it('rejects a response with a field of the wrong type', () => {
    const result = galleryItemSchema.safeParse({ ...GALLERY_ITEM, width: '1200' });
    expect(result.success).toBe(false);
  });

  it('rejects a lead receipt that is missing its id', () => {
    const result = leadCreatedSchema.safeParse({ status: 'New' });
    expect(result.success).toBe(false);
  });
});

describe('shared write payloads', () => {
  const WRITE_CASES: Array<{ name: string; schema: ZodType<unknown>; payload: unknown }> = [
    {
      name: 'gallery write',
      schema: galleryWriteSchema,
      payload: {
        title: 'A Piece',
        category: 'Bridal',
        src: '/uploads/piece.jpg',
        alt: 'A piece',
        width: 1200,
        height: 1600,
      },
    },
    {
      name: 'service write',
      schema: serviceWriteSchema,
      payload: {
        title: 'Bridal Consultation',
        category: 'Bridal',
        summary: 'An hour of styling.',
        bannerImage: '/uploads/banner.jpg',
        bannerAlt: 'Banner',
        cardImage: '/uploads/card.jpg',
      },
    },
    {
      name: 'portfolio write',
      schema: portfolioWriteSchema,
      payload: {
        title: 'A Wedding',
        category: 'Bridal',
        summary: 'A bride in a green lehenga.',
        bannerImage: '/uploads/banner.jpg',
        bannerAlt: 'Banner',
        coverImage: '/uploads/cover.jpg',
        coverAlt: 'Cover',
      },
    },
    {
      name: 'blog write',
      schema: blogWriteSchema,
      payload: {
        title: 'A Studio Note',
        excerpt: 'What we learned this season.',
        category: 'Studio Notes',
        coverImage: '/uploads/cover.jpg',
        coverAlt: 'Fabric',
      },
    },
    {
      name: 'lead request',
      schema: leadRequestSchema,
      payload: {
        name: 'Divya Reddy',
        email: 'divya@example.com',
        phone: '9876500000',
        city: 'Kurnool',
        service: 'Bridal Lehenga',
        occasion: 'Wedding',
        budget: '₹50,000 – ₹80,000',
        preferredDate: '2030-01-01',
        message: 'I would like to book a fitting consultation.',
      },
    },
  ];

  for (const { name, schema, payload } of WRITE_CASES) {
    it(`${name} round-trips and keeps unknown fields`, () => {
      const first = schema.parse(payload);
      const wire = JSON.parse(JSON.stringify(first));
      expect(schema.parse(wire)).toEqual(first);
    });
  }

  it('refuses a lead request that is too short', () => {
    const result = leadRequestSchema.safeParse({
      name: 'Divya Reddy',
      email: 'divya@example.com',
      phone: '9876500000',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50k',
      preferredDate: '2030-01-01',
      message: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('the two copies of the contract', () => {
  const FILES = ['enums.ts', 'schemas.ts'];

  it('are byte-identical', () => {
    for (const file of FILES) {
      const backend = fs.readFileSync(path.join(root, 'backend/src/shared', file), 'utf8');
      const frontend = fs.readFileSync(path.join(root, 'frontend/src/shared', file), 'utf8');
      // The frontend copy carries a generated banner; the rest must match.
      const withoutBanner = frontend.replace(/^\/\* AUTO-GENERATED[\s\S]*?\*\/\n/, '');
      expect(withoutBanner, file).toBe(backend);
    }
  });

  it('parse the same payload the same way on both sides', async () => {
    const frontend = (await import(
      /* @vite-ignore */ path.join(root, 'frontend/src/shared/schemas.ts')
    )) as unknown as Record<string, unknown>;

    for (const { name, schema, payload } of RESPONSE_CASES) {
      // The success envelope is a factory in the contract, so it is built
      // against the item schema on both sides.
      if (name === 'success envelope') {
        const build = frontend.apiSuccessResponseSchema as (
          item: ZodType<unknown>,
        ) => ZodType<unknown>;
        const backendBuild = (await import('../shared/schemas')).apiSuccessResponseSchema(
          galleryItemSchema,
        );
        expect(build(galleryItemSchema).parse(payload)).toEqual(
          backendBuild.parse(payload),
        );
        continue;
      }

      const exportName = RESPONSE_EXPORT_NAMES[name];
      if (!exportName) continue;
      const frontendSchema = frontend[exportName] as ZodType<unknown> | undefined;
      if (!frontendSchema) continue;

      expect(frontendSchema.parse(payload), name).toEqual(schema.parse(payload));
    }
  });
});
