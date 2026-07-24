import mongoose from 'mongoose';
import { Service, SERVICE_CATEGORIES, type IService, type ServiceCategory } from '../models/Service';
import { Order } from '../models/Order';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { parseBooleanQuery, searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';
import { resolveClientSlug } from '../utils/slugify';
import { generateSeoWithSettings } from '../utils/generateSeo';

export type ServiceDto = Record<string, unknown> & { id: string; slug: string; title: string };

function serialize(doc: IService | Record<string, unknown>): ServiceDto {
  return toDto<ServiceDto>(doc);
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }
  return Boolean(await Service.exists(filter));
}

async function applySeoDefaults(
  doc: Record<string, any>,
  opts?: { forceEmptyOnly?: boolean },
) {
  const seo = await generateSeoWithSettings({
    title: String(doc.title || ''),
    summary: String(doc.summary || ''),
    imageUrl: String(doc.bannerImage || ''),
  });
  const emptyOnly = opts?.forceEmptyOnly !== false;
  if (!emptyOnly || !doc.bannerAlt) doc.bannerAlt = doc.bannerAlt || seo.imageAlt;
  if (!emptyOnly || !doc.metaTitle) doc.metaTitle = doc.metaTitle || seo.metaTitle;
  if (!emptyOnly || !doc.metaDescription) {
    doc.metaDescription = doc.metaDescription || seo.metaDescription;
  }
  if (!emptyOnly || !doc.ogTitle) doc.ogTitle = doc.ogTitle || seo.ogTitle;
  if (!emptyOnly || !doc.ogDescription) doc.ogDescription = doc.ogDescription || seo.ogDescription;
  if (!emptyOnly || !doc.ogImage) doc.ogImage = doc.ogImage || seo.ogImage;
  if (!emptyOnly || !doc.twitterTitle) doc.twitterTitle = doc.twitterTitle || seo.twitterTitle;
  if (!emptyOnly || !doc.twitterDescription) {
    doc.twitterDescription = doc.twitterDescription || seo.twitterDescription;
  }
  if (!emptyOnly || !doc.twitterImage) doc.twitterImage = doc.twitterImage || seo.twitterImage;
}

export async function listServices(
  query: Record<string, unknown>,
  options: { admin: boolean },
) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};

  if (!options.admin) {
    filter.published = true;
  } else {
    const published = parseBooleanQuery(query.published);
    if (published !== undefined) filter.published = published;
  }

  const fulfillable = parseBooleanQuery(query.fulfillable);
  if (fulfillable !== undefined) {
    filter.isFulfillable = fulfillable;
  }

  if (typeof query.category === 'string' && query.category && query.category !== 'All') {
    filter.category = query.category;
  }

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [{ title: q }, { summary: q }, { slug: q }, { tags: q }];
  }

  const sort: Record<string, 1 | -1> =
      query.sort === 'newest'
          ? { createdAt: -1 }
          : { sortOrder: 1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serialize(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getService(idOrSlug: string, options: { admin: boolean }) {
  const filter: Record<string, unknown> = mongoose.isValidObjectId(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

  if (!options.admin) filter.published = true;

  const doc = await Service.findOne(filter).lean();
  if (!doc) throw new ApiError(404, 'Service not found');
  return serialize(doc);
}

export async function createService(input: Record<string, unknown> & { title: string }) {
  const slug = await resolveClientSlug(
      input.title,
      typeof input.slug === 'string' ? input.slug : undefined,
      (s) => slugExists(s),
  );
  const category = (SERVICE_CATEGORIES as readonly string[]).includes(String(input.category))
      ? (input.category as ServiceCategory)
      : 'Boutique';

  const linkedProductTypeIds = Array.isArray(input.linkedProductTypeIds)
      ? input.linkedProductTypeIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(String(id)))
      : [];

  const rawDoc: Record<string, any> = {
    title: input.title,
    slug,
    category,
    summary: String(input.summary ?? ''),
    description: Array.isArray(input.description) ? (input.description as string[]) : [],
    bannerImage: String(input.bannerImage ?? ''),
    bannerAlt: String(input.bannerAlt ?? ''),
    cardImage: String(input.cardImage || input.bannerImage || ''),
    icon: (['bridal', 'traditional', 'tailoring', 'boutique'].includes(String(input.icon))
        ? input.icon
        : 'boutique') as 'bridal' | 'traditional' | 'tailoring' | 'boutique',
    gallery: Array.isArray(input.gallery) ? input.gallery : [],
    features: Array.isArray(input.features) ? input.features : [],
    pricing: {
      note: String((input.pricing as { note?: string } | undefined)?.note ?? ''),
      startingFrom: String(
          (input.pricing as { startingFrom?: string } | undefined)?.startingFrom ?? '',
      ),
      tiers: Array.isArray((input.pricing as { tiers?: unknown } | undefined)?.tiers)
          ? ((input.pricing as { tiers: Array<{ id: string; name: string; priceLabel: string; detail: string }> }).tiers)
          : [],
    },
    includes: Array.isArray(input.includes) ? (input.includes as string[]) : [],
    durationNote: String(input.durationNote ?? ''),
    ctaLabel: String(input.ctaLabel || 'Request consultation'),
    published: Boolean(input.published ?? true),
    sortOrder: Number(input.sortOrder ?? 0),
    isFulfillable: Boolean(input.isFulfillable ?? true),
    linkedProductTypeIds,
    defaultLeadTimeDays: Number(input.defaultLeadTimeDays ?? 0),
    basePriceFrom: Number(input.basePriceFrom ?? 0),
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    metaTitle: String(input.metaTitle ?? ''),
    metaDescription: String(input.metaDescription ?? ''),
    ogTitle: String(input.ogTitle ?? ''),
    ogDescription: String(input.ogDescription ?? ''),
    ogImage: String(input.ogImage ?? ''),
    twitterTitle: String(input.twitterTitle ?? ''),
    twitterDescription: String(input.twitterDescription ?? ''),
    twitterImage: String(input.twitterImage ?? ''),
  };

  await applySeoDefaults(rawDoc);

  const doc = await Service.create(rawDoc);
  return serialize(doc);
}

export async function updateService(id: string, input: Record<string, unknown>) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid service id');
  const existing = await Service.findById(id);
  if (!existing) throw new ApiError(404, 'Service not found');

  if (input.slug || input.title) {
    existing.slug = await resolveClientSlug(
        String(input.title || existing.title),
        typeof input.slug === 'string' ? input.slug : existing.slug,
        (s) => slugExists(s, id),
    );
  }

  const skip = new Set(['id', '_id', 'slug', 'createdAt', 'updatedAt']);
  for (const [key, value] of Object.entries(input)) {
    if (skip.has(key) || value === undefined) continue;
    if (key === 'linkedProductTypeIds' && Array.isArray(value)) {
      existing.linkedProductTypeIds = value
          .filter((v) => mongoose.isValidObjectId(v))
          .map((v) => new mongoose.Types.ObjectId(String(v)));
    } else {
      (existing as unknown as Record<string, unknown>)[key] = value;
    }
  }

  if (!existing.cardImage) {
    existing.cardImage = existing.bannerImage || '';
  }

  const rawDocObj = existing.toObject() as Record<string, unknown>;
  await applySeoDefaults(rawDocObj);
  for (const field of [
    'bannerAlt',
    'metaTitle',
    'metaDescription',
    'ogTitle',
    'ogDescription',
    'ogImage',
    'twitterTitle',
    'twitterDescription',
    'twitterImage',
  ] as const) {
    (existing as unknown as Record<string, unknown>)[field] = rawDocObj[field];
  }

  await existing.save();
  return serialize(existing);
}

export async function deleteService(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid service id');

  // Block hard delete if open or closed orders reference this service
  const orderExists = await Order.exists({ 'lineItems.serviceId': id });
  if (orderExists) {
    throw new ApiError(
        400,
        'Cannot delete service because it is referenced by existing orders. Please unpublish/archive it instead.'
    );
  }

  const doc = await Service.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Service not found');
  return serialize(doc);
}
