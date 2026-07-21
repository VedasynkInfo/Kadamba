import mongoose from 'mongoose';
import { Blog, type IBlog } from '../models/Blog';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { parseBooleanQuery, searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';
import { uniqueSlug } from '../utils/slugify';

export type BlogDto = Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  date: string;
};

function serialize(doc: IBlog | Record<string, unknown>): BlogDto {
  const dto = toDto<BlogDto>(doc);
  // Frontend expects date as YYYY-MM-DD or ISO; keep ISO and also expose date-only for display
  if (typeof dto.date === 'string' && dto.date.includes('T')) {
    dto.date = dto.date.slice(0, 10);
  }
  return dto;
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }
  return Boolean(await Blog.exists(filter));
}

export async function listBlogs(
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

  const featured = parseBooleanQuery(query.featured);
  if (featured !== undefined) filter.featured = featured;

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [{ title: q }, { excerpt: q }, { slug: q }, { tags: q }];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'oldest' ? { date: 1 } : { date: -1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    Blog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serialize(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getBlog(idOrSlug: string, options: { admin: boolean }) {
  const filter: Record<string, unknown> = mongoose.isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  if (!options.admin) filter.published = true;

  const doc = await Blog.findOne(filter).lean();
  if (!doc) throw new ApiError(404, 'Blog post not found');
  return serialize(doc);
}

export async function createBlog(input: Record<string, unknown> & { title: string }) {
  const slug = await uniqueSlug(
    input.title,
    (s) => slugExists(s),
    typeof input.slug === 'string' ? input.slug : undefined,
  );
  const doc = await Blog.create({
    title: input.title,
    excerpt: String(input.excerpt ?? ''),
    category: (input.category as 'Bridal' | 'Traditional' | 'Tailoring' | 'Studio Notes') || 'Studio Notes',
    coverImage: String(input.coverImage ?? ''),
    coverAlt: String(input.coverAlt ?? ''),
    slug,
    date: input.date ? new Date(String(input.date)) : new Date(),
    published: Boolean(input.published ?? true),
    featured: Boolean(input.featured ?? false),
    readMinutes: Number(input.readMinutes ?? 5),
    author: String(input.author || "Kadamba's Designer Studio"),
    content: Array.isArray(input.content) ? (input.content as string[]) : [],
    tags: Array.isArray(input.tags) ? (input.tags as string[]) : [],
  });
  return serialize(doc);
}

export async function updateBlog(id: string, input: Record<string, unknown>) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid blog id');
  const existing = await Blog.findById(id);
  if (!existing) throw new ApiError(404, 'Blog post not found');

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
    if (key === 'date') {
      existing.date = new Date(String(value));
      continue;
    }
    (existing as unknown as Record<string, unknown>)[key] = value;
  }

  await existing.save();
  return serialize(existing);
}

export async function deleteBlog(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid blog id');
  const doc = await Blog.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Blog post not found');
  return serialize(doc);
}
