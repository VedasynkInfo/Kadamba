import mongoose from 'mongoose';
import {
  Portfolio,
  PORTFOLIO_CATEGORIES,
  type IPortfolio,
  type PortfolioCategory,
  type IPortfolioBeforeAfter,
  type IPortfolioClientStory,
} from '../models/Portfolio';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { parseBooleanQuery, searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';
import { uniqueSlug } from '../utils/slugify';

export type PortfolioDto = Record<string, unknown> & { id: string; slug: string; title: string };

function serialize(doc: IPortfolio | Record<string, unknown>): PortfolioDto {
  return toDto<PortfolioDto>(doc);
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }
  return Boolean(await Portfolio.exists(filter));
}

export async function listPortfolio(
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
    filter.$or = [{ title: q }, { summary: q }, { slug: q }, { tags: q }];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'newest'
      ? { createdAt: -1 }
      : { sortOrder: 1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    Portfolio.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Portfolio.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serialize(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getPortfolio(idOrSlug: string, options: { admin: boolean }) {
  const filter: Record<string, unknown> = mongoose.isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  if (!options.admin) filter.published = true;

  const doc = await Portfolio.findOne(filter).lean();
  if (!doc) throw new ApiError(404, 'Portfolio project not found');
  return serialize(doc);
}

export async function createPortfolio(input: Record<string, unknown> & { title: string }) {
  const slug = await uniqueSlug(
    input.title,
    (s) => slugExists(s),
    typeof input.slug === 'string' ? input.slug : undefined,
  );
  const category = (PORTFOLIO_CATEGORIES as readonly string[]).includes(String(input.category))
    ? (input.category as PortfolioCategory)
    : 'Bridal';
  const doc = await Portfolio.create({
    title: input.title,
    slug,
    category,
    summary: String(input.summary ?? ''),
    story: Array.isArray(input.story) ? (input.story as string[]) : [],
    year: String(input.year ?? ''),
    location: String(input.location || 'Kurnool'),
    bannerImage: String(input.bannerImage ?? ''),
    bannerAlt: String(input.bannerAlt ?? ''),
    coverImage: String(input.coverImage ?? ''),
    coverAlt: String(input.coverAlt ?? ''),
    gallery: Array.isArray(input.gallery) ? input.gallery : [],
    beforeAfter: input.beforeAfter
      ? (input.beforeAfter as IPortfolioBeforeAfter)
      : undefined,
    clientStory: input.clientStory
      ? (input.clientStory as IPortfolioClientStory)
      : undefined,
    tags: Array.isArray(input.tags) ? (input.tags as string[]) : [],
    ctaLabel: String(input.ctaLabel || 'Start your project'),
    published: Boolean(input.published ?? true),
    sortOrder: Number(input.sortOrder ?? 0),
  });
  return serialize(doc);
}

export async function updatePortfolio(id: string, input: Record<string, unknown>) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid portfolio id');
  const existing = await Portfolio.findById(id);
  if (!existing) throw new ApiError(404, 'Portfolio project not found');

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

export async function deletePortfolio(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid portfolio id');
  const doc = await Portfolio.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Portfolio project not found');
  return serialize(doc);
}
