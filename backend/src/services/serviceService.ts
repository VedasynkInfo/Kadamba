import mongoose from 'mongoose';
import { Service, SERVICE_CATEGORIES, type IService, type ServiceCategory } from '../models/Service';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { parseBooleanQuery, searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';
import { uniqueSlug } from '../utils/slugify';

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

  if (typeof query.category === 'string' && query.category && query.category !== 'All') {
    filter.category = query.category;
  }

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [{ title: q }, { summary: q }, { slug: q }];
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
  const slug = await uniqueSlug(
    input.title,
    (s) => slugExists(s),
    typeof input.slug === 'string' ? input.slug : undefined,
  );
  const category = (SERVICE_CATEGORIES as readonly string[]).includes(String(input.category))
    ? (input.category as ServiceCategory)
    : 'Boutique';
  const doc = await Service.create({
    title: input.title,
    slug,
    category,
    summary: String(input.summary ?? ''),
    description: Array.isArray(input.description) ? (input.description as string[]) : [],
    bannerImage: String(input.bannerImage ?? ''),
    bannerAlt: String(input.bannerAlt ?? ''),
    cardImage: String(input.cardImage ?? ''),
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
  });
  return serialize(doc);
}

export async function updateService(id: string, input: Record<string, unknown>) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid service id');
  const existing = await Service.findById(id);
  if (!existing) throw new ApiError(404, 'Service not found');

  if (input.slug || input.title) {
    existing.slug = await uniqueSlug(
      String(input.title || existing.title),
      (s) => slugExists(s, id),
      typeof input.slug === 'string' ? input.slug : existing.slug,
    );
  }

  const skip = new Set(['id', '_id', 'slug', 'createdAt', 'updatedAt']);
  for (const [key, value] of Object.entries(input)) {
    if (skip.has(key) || value === undefined) continue;
    (existing as unknown as Record<string, unknown>)[key] = value;
  }

  await existing.save();
  return serialize(existing);
}

export async function deleteService(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid service id');
  const doc = await Service.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Service not found');
  return serialize(doc);
}
