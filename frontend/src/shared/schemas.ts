/* AUTO-GENERATED — do not edit directly.
 * Source: backend/src/shared/schemas.ts
 * Regenerate: node scripts/sync-shared.mjs
 */
/**
 * Single source of truth for the shapes that cross the API boundary.
 *
 * `shared/enums.ts` describes *domain vocabulary* (statuses, roles, error
 * codes); this file describes *payloads* — the response envelopes, the CMS
 * collections and the write payloads. Both are copied verbatim into the
 * frontend by `scripts/sync-shared.mjs`, so a field can never mean one thing on
 * the server and another in the SPA.
 *
 * Two rules keep this module usable from both sides:
 *
 * 1. **Dependency-light.** Only `zod` and `./enums` are imported. The backend
 *    compiles this with `rootDir: ./src` as CommonJS; the frontend bundles the
 *    copy through Vite. Anything else (a model, a service, a `node:` builtin)
 *    would break one of those builds.
 * 2. **Tolerant where the API is tolerant.** Responses are parsed with
 *    `looseObject` so a field the server adds later passes through instead of
 *    invalidating a whole collection, and write payloads are also `looseObject`
 *    so fields this contract does not police still reach the service untouched.
 *
 * The straight-typed CMS fields are transcribed from the Mongoose models (which
 * are the storage truth) and cross-checked by `__tests__/contract.test.ts`,
 * which creates a record through the API and parses the response with these
 * schemas — a real server response is the only proof a contract is accurate.
 */
import { z } from 'zod';
import {
  ERROR_CODES,
  LEAD_QUALITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from './enums';

/* -------------------------------------------------------------------------- */
/* Response envelopes                                                         */
/* -------------------------------------------------------------------------- */

export const errorCodeSchema = z.enum(ERROR_CODES);

export const paginationMetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

/** `{ items, pagination }` — the shape every list endpoint nests in `data`. */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), pagination: paginationMetaSchema });
}

/** Every failure response. Kept separate from the success envelope on purpose. */
export const apiErrorResponseSchema = z.looseObject({
  success: z.literal(false),
  code: errorCodeSchema,
  message: z.string(),
  errors: z.array(z.unknown()).optional(),
  requestId: z.string().optional(),
});

/** Every success response, wrapping a caller-supplied `data` schema. */
export function apiSuccessResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.looseObject({
    success: z.literal(true),
    data,
    message: z.string().optional(),
  });
}

/* -------------------------------------------------------------------------- */
/* Shared field helpers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * JSON booleans, plus the string forms an HTML form or a query string produces.
 *
 * `z.coerce.boolean()` would be wrong here: `"false"` is a truthy string, so it
 * would silently become `true`. These are the only three falsy spellings.
 */
const booleanLike = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal(0), z.literal(1)])
  .transform((value) => value === true || value === 'true' || value === 1);

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Not a valid id');

/** SEO overrides; every one of them is optional on every CMS record. */
const seoFields = {
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
};

/* -------------------------------------------------------------------------- */
/* CMS vocabulary                                                             */
/* -------------------------------------------------------------------------- */
/* These mirror the `*_CATEGORIES` constants on the models. They are transcribed
 * rather than imported because this module may not reach into `models/`; the
 * contract test asserts they still match value for value.                     */

export const galleryCategorySchema = z.enum([
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
]);

export const galleryMediaTypeSchema = z.enum(['image', 'video']);

export const serviceCategorySchema = z.enum(['Bridal', 'Traditional', 'Tailoring', 'Boutique']);

export const serviceIconSchema = z.enum(['bridal', 'traditional', 'tailoring', 'boutique']);

export const portfolioCategorySchema = z.enum([
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
]);

export const blogCategorySchema = z.enum(['Bridal', 'Traditional', 'Tailoring', 'Studio Notes']);

/* -------------------------------------------------------------------------- */
/* CMS records                                                                */
/* -------------------------------------------------------------------------- */

export const galleryItemSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: galleryCategorySchema,
  alt: z.string(),
  mediaType: galleryMediaTypeSchema,
  src: z.string(),
  poster: z.string().optional(),
  width: z.number(),
  height: z.number(),
  published: z.boolean(),
  sortOrder: z.number(),
  ...seoFields,
});

const serviceGalleryImageSchema = z.object({
  id: z.string(),
  image: z.string(),
  alt: z.string(),
  title: z.string(),
});

const serviceFeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

const servicePricingTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceLabel: z.string(),
  detail: z.string(),
});

export const serviceDetailSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: serviceCategorySchema,
  summary: z.string(),
  description: z.array(z.string()),
  bannerImage: z.string(),
  bannerAlt: z.string(),
  cardImage: z.string(),
  icon: serviceIconSchema,
  gallery: z.array(serviceGalleryImageSchema),
  features: z.array(serviceFeatureSchema),
  pricing: z.object({
    note: z.string(),
    startingFrom: z.string(),
    tiers: z.array(servicePricingTierSchema),
  }),
  includes: z.array(z.string()),
  durationNote: z.string(),
  ctaLabel: z.string(),
  published: z.boolean(),
  sortOrder: z.number(),
  isFulfillable: z.boolean().optional(),
  linkedProductTypeIds: z.array(z.string()).optional(),
  defaultLeadTimeDays: z.number().optional(),
  basePriceFrom: z.number().optional(),
  tags: z.array(z.string()).optional(),
  ...seoFields,
});

const portfolioGalleryImageSchema = z.object({
  id: z.string(),
  image: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const portfolioBeforeAfterSchema = z.object({
  beforeImage: z.string(),
  beforeAlt: z.string(),
  afterImage: z.string(),
  afterAlt: z.string(),
  note: z.string(),
});

const portfolioClientStorySchema = z.object({
  quote: z.string(),
  name: z.string(),
  occasion: z.string(),
});

export const portfolioProjectSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: portfolioCategorySchema,
  summary: z.string(),
  story: z.array(z.string()),
  year: z.string(),
  location: z.string(),
  bannerImage: z.string(),
  bannerAlt: z.string(),
  coverImage: z.string(),
  coverAlt: z.string(),
  gallery: z.array(portfolioGalleryImageSchema),
  beforeAfter: portfolioBeforeAfterSchema.optional(),
  clientStory: portfolioClientStorySchema.optional(),
  tags: z.array(z.string()),
  ctaLabel: z.string(),
  published: z.boolean(),
  sortOrder: z.number(),
  ...seoFields,
});

export const blogPostSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.array(z.string()),
  category: blogCategorySchema,
  tags: z.array(z.string()),
  coverImage: z.string(),
  coverAlt: z.string(),
  /** Date-only (`YYYY-MM-DD`) — the API slices the ISO timestamp. */
  date: z.string(),
  readMinutes: z.number(),
  author: z.string(),
  featured: z.boolean(),
  published: z.boolean(),
  ...seoFields,
});

/* -------------------------------------------------------------------------- */
/* Website settings                                                           */
/* -------------------------------------------------------------------------- */

const settingsHourSchema = z.object({ day: z.string(), time: z.string() });
const settingsSocialSchema = z.object({ href: z.string(), label: z.string() });
const settingsBannerPresetSchema = z.object({
  label: z.string(),
  width: z.number(),
  height: z.number(),
  aspect: z.string().optional(),
});
const settingsEmailTemplateSchema = z.object({
  key: z.string(),
  subject: z.string(),
  bodyHtml: z.string(),
  bodyText: z.string(),
  updatedAt: z.string().optional(),
});

/**
 * The settings document.
 *
 * Sections are `.partial()` on purpose. The studio edits settings one section at
 * a time, so a document mid-edit can legitimately hold `{ theme: { accent } }`
 * with the rest implied; the client deep-merges its own defaults over whatever
 * arrives (`mergeWebsiteSettings`). Requiring every nested key here would turn a
 * half-configured studio into a page that refuses to render.
 */
export const websiteSettingsSchema = z.looseObject({
  studioName: z.string(),
  shortName: z.string(),
  tagline: z.string(),
  logoUrl: z.string(),
  logoDarkUrl: z.string(),
  location: z.string(),
  phoneDisplay: z.string(),
  phoneTel: z.string(),
  phoneAltDisplay: z.string(),
  phoneAltTel: z.string(),
  email: z.string(),
  addressLines: z.array(z.string()),
  landmark: z.string(),
  locality: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  hours: z.array(settingsHourSchema),
  whatsappNumber: z.string(),
  whatsappPrefill: z.string(),
  mapEmbedUrl: z.string(),
  mapLink: z.string(),
  social: z.array(settingsSocialSchema),
  socialNamed: z
    .object({
      instagram: z.string(),
      facebook: z.string(),
      youtube: z.string(),
      whatsappLink: z.string(),
      googleBusiness: z.string(),
    })
    .partial(),
  seo: z
    .object({
      siteName: z.string(),
      titleTemplate: z.string(),
      defaultDescription: z.string(),
      defaultOgImage: z.string(),
      localityPhrase: z.string(),
      robotsIndex: z.boolean(),
    })
    .partial(),
  media: z
    .object({
      defaultUnit: z.enum(['in', 'cm']),
      bannerPresets: z.array(settingsBannerPresetSchema),
      maxUploadBytes: z.number(),
    })
    .partial(),
  /** Absent from the public settings response — it carries SMTP credentials. */
  emailConfig: z
    .object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      user: z.string(),
      pass: z.string(),
      passSet: z.boolean().optional(),
      fromName: z.string(),
      fromEmail: z.string(),
      adminTo: z.string(),
      templates: z.array(settingsEmailTemplateSchema),
    })
    .partial()
    .optional(),
  theme: z
    .object({
      primary: z.string(),
      primaryHover: z.string(),
      primaryText: z.string(),
      accent: z.string(),
      publicBg: z.string(),
      publicText: z.string(),
      publicCard: z.string(),
      publicCardText: z.string(),
      publicSurface: z.string(),
      adminBg: z.string(),
      adminText: z.string(),
      adminCard: z.string(),
      adminCardText: z.string(),
      adminSidebar: z.string(),
      adminSidebarText: z.string(),
      adminPrimary: z.string(),
      adminPrimaryText: z.string(),
      adminAccent: z.string(),
      fontFamily: z.string(),
    })
    .partial(),
});

/* -------------------------------------------------------------------------- */
/* Write payloads                                                             */
/* -------------------------------------------------------------------------- */
/* These mirror the `express-validator` chains the CMS routes used to carry, so
 * swapping the validator for these is behaviour-preserving. They are
 * `looseObject`s: a field this contract does not police (a service's `gallery`
 * or `pricing`, say) still reaches the service untouched rather than being
 * silently stripped by a strict parse. `.partial()` is the update variant.      */

export const galleryWriteSchema = z.looseObject({
  title: z.string().trim().min(2).max(160),
  category: galleryCategorySchema,
  src: z.string().trim().min(1),
  alt: z.string().trim().max(200).optional(),
  mediaType: galleryMediaTypeSchema.optional(),
  width: z.coerce.number().int().min(1).optional(),
  height: z.coerce.number().int().min(1).optional(),
  published: booleanLike.optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const serviceWriteSchema = z.looseObject({
  title: z.string().trim().min(2).max(160),
  category: serviceCategorySchema,
  summary: z.string().trim().min(2).max(500),
  bannerImage: z.string().trim().min(1),
  bannerAlt: z.string().trim().optional(),
  cardImage: z.string().trim().optional(),
  icon: serviceIconSchema.optional(),
  published: booleanLike.optional(),
  sortOrder: z.coerce.number().int().optional(),
  isFulfillable: booleanLike.optional(),
  linkedProductTypeIds: z.array(mongoId).optional(),
  defaultLeadTimeDays: z.coerce.number().int().min(0).optional(),
  basePriceFrom: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  description: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  durationNote: z.string().optional(),
  ctaLabel: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
});

export const portfolioWriteSchema = z.looseObject({
  title: z.string().trim().min(2).max(160),
  category: portfolioCategorySchema,
  summary: z.string().trim().min(2).max(500),
  bannerImage: z.string().trim().min(1),
  bannerAlt: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  coverAlt: z.string().trim().min(1),
  published: booleanLike.optional(),
  sortOrder: z.coerce.number().int().optional(),
  story: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
});

export const blogWriteSchema = z.looseObject({
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().min(2).max(500),
  category: blogCategorySchema,
  coverImage: z.string().trim().min(1),
  coverAlt: z.string().trim().min(1),
  published: booleanLike.optional(),
  featured: booleanLike.optional(),
  readMinutes: z.coerce.number().int().min(1).optional(),
  sortOrder: z.coerce.number().int().optional(),
  content: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().trim().optional(),
  date: z.string().trim().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
});

/**
 * The public enquiry form.
 *
 * All fields arrive as strings (the request is multipart because of the
 * inspiration images), so nothing here coerces a type. The two business rules
 * `express-validator` used to carry — a reachable phone number and no date in
 * the past — are expressed as refinements so the SPA can run the identical
 * checks before it submits.
 */
export const leadRequestSchema = z
  .looseObject({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be 2-80 characters')
      .max(80, 'Name must be 2-80 characters'),
    email: z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Valid email is required'),
    phone: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, '').length >= 10, 'Valid phone number is required'),
    city: z.string().trim().min(2, 'City is required').max(80, 'City is required'),
    locality: z.string().trim().max(120).optional(),
    service: z.string().trim().min(2, 'Service is required').max(120, 'Service is required'),
    garmentType: z.string().trim().max(120).optional(),
    fabricStatus: z.string().trim().max(120).optional(),
    occasion: z.string().trim().min(2, 'Occasion is required').max(120, 'Occasion is required'),
    budget: z.string().trim().min(2, 'Budget is required').max(80, 'Budget is required'),
    preferredDate: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Valid preferred date is required')
      .refine((value) => {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate(),
        ).padStart(2, '0')}`;
        return value.slice(0, 10) >= today;
      }, 'Preferred date cannot be in the past'),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be 10-2000 characters')
      .max(2000, 'Message must be 10-2000 characters'),
  });

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

const leadNoteSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: z.string(),
  createdAt: z.string(),
});

const leadTimelineEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['created', 'status', 'note', 'assigned', 'export']),
  label: z.string(),
  detail: z.string().optional(),
  createdAt: z.string(),
});

const leadScoreBreakdownSchema = z.object({
  budgetScore: z.number(),
  timelineScore: z.number(),
  serviceScore: z.number(),
  detailsScore: z.number(),
  contactScore: z.number(),
});

const leadFollowUpSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  type: z.enum(['call', 'whatsapp', 'email', 'in_person_consultation']),
  notes: z.string(),
  status: z.enum(['pending', 'completed', 'cancelled', 'rescheduled']),
  completedAt: z.string().optional(),
  outcome: z.string().optional(),
  createdBy: z.string().optional(),
});

export const leadSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  city: z.string(),
  service: z.string(),
  occasion: z.string(),
  budget: z.string(),
  preferredDate: z.string(),
  message: z.string(),
  status: z.enum(LEAD_STATUSES),
  source: z.enum(LEAD_SOURCES),
  assignee: z.string(),
  orderId: z.string().optional(),
  orderNumber: z.number().optional(),
  referenceId: z.string().optional(),
  notes: z.array(leadNoteSchema),
  timeline: z.array(leadTimelineEntrySchema),
  score: z.number().optional(),
  quality: z.enum(LEAD_QUALITIES).optional(),
  scoreBreakdown: leadScoreBreakdownSchema.optional(),
  followUps: z.array(leadFollowUpSchema).optional(),
  nextFollowUpDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** The trimmed receipt handed back to the public enquiry form. */
export const leadCreatedSchema = z.looseObject({
  id: z.string(),
  status: z.string(),
  orderId: z.string().optional(),
  orderNumber: z.number().optional(),
  referenceId: z.string().optional(),
});

/* -------------------------------------------------------------------------- */
/* Composed page responses                                                    */
/* -------------------------------------------------------------------------- */

export const galleryPageSchema = paginatedSchema(galleryItemSchema);
export const servicesPageSchema = paginatedSchema(serviceDetailSchema);
export const portfolioPageSchema = paginatedSchema(portfolioProjectSchema);
export const blogsPageSchema = paginatedSchema(blogPostSchema);
export const leadsPageSchema = paginatedSchema(leadSchema);
