import mongoose from 'mongoose';
import { GalleryItem, GALLERY_CATEGORIES, type IGalleryItem, type GalleryCategory, type GalleryMediaType } from '../models/GalleryItem';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { parseBooleanQuery, searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';
import { resolveClientSlug } from '../utils/slugify';
import { generateSeoWithSettings } from '../utils/generateSeo';

export type GalleryDto = {
  id: string;
  slug: string;
  title: string;
  category: string;
  alt: string;
  mediaType: string;
  src: string;
  poster?: string;
  width: number;
  height: number;
  published: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
};

function serialize(doc: IGalleryItem | Record<string, unknown>): GalleryDto {
  return toDto<GalleryDto>(doc);
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }
  return Boolean(await GalleryItem.exists(filter));
}

export async function listGalleryItems(
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
    filter.$or = [{ title: q }, { alt: q }, { slug: q }];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'newest'
      ? { createdAt: -1 }
      : { sortOrder: 1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    GalleryItem.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    GalleryItem.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serialize(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getGalleryItem(idOrSlug: string, options: { admin: boolean }) {
  const filter: Record<string, unknown> = mongoose.isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  if (!options.admin) filter.published = true;

  const doc = await GalleryItem.findOne(filter).lean();
  if (!doc) throw new ApiError(404, 'Gallery item not found');
  return serialize(doc);
}

export async function createGalleryItem(input: Partial<GalleryDto> & { title: string }) {
  const slug = await resolveClientSlug(input.title, input.slug, (s) => slugExists(s));
  const category = (GALLERY_CATEGORIES as readonly string[]).includes(String(input.category))
    ? (input.category as GalleryCategory)
    : 'Bridal';
  const mediaType: GalleryMediaType =
    input.mediaType === 'video' ? 'video' : 'image';

  const seo = await generateSeoWithSettings({
    title: input.title,
    imageUrl: String(input.src || ''),
  });

  const doc = await GalleryItem.create({
    title: input.title,
    slug,
    category,
    alt: input.alt || seo.imageAlt,
    mediaType,
    src: input.src || '',
    poster: input.poster,
    width: input.width ?? 1200,
    height: input.height ?? 1600,
    published: input.published ?? true,
    sortOrder: input.sortOrder ?? 0,
    metaTitle: input.metaTitle || seo.metaTitle,
    metaDescription: input.metaDescription || seo.metaDescription,
    ogTitle: input.ogTitle || seo.ogTitle,
    ogDescription: input.ogDescription || seo.ogDescription,
    ogImage: input.ogImage || seo.ogImage || input.src || '',
    twitterTitle: input.twitterTitle || seo.twitterTitle,
    twitterDescription: input.twitterDescription || seo.twitterDescription,
    twitterImage: input.twitterImage || seo.twitterImage || input.src || '',
  });
  return serialize(doc);
}

export async function updateGalleryItem(id: string, input: Partial<GalleryDto>) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid gallery id');
  const existing = await GalleryItem.findById(id);
  if (!existing) throw new ApiError(404, 'Gallery item not found');

  if (input.slug || input.title) {
    const nextSlug = await resolveClientSlug(
      input.title || existing.title,
      input.slug || existing.slug,
      (s) => slugExists(s, id),
    );
    existing.slug = nextSlug;
  }

  const fields: (keyof GalleryDto)[] = [
    'title',
    'category',
    'alt',
    'mediaType',
    'src',
    'poster',
    'width',
    'height',
    'published',
    'sortOrder',
    'metaTitle',
    'metaDescription',
    'ogTitle',
    'ogDescription',
    'ogImage',
    'twitterTitle',
    'twitterDescription',
    'twitterImage',
  ];
  for (const key of fields) {
    if (input[key] !== undefined) {
      (existing as unknown as Record<string, unknown>)[key] = input[key];
    }
  }

  if (!existing.metaTitle || !existing.metaDescription) {
    const seo = await generateSeoWithSettings({
      title: existing.title,
      imageUrl: existing.src,
    });
    if (!existing.metaTitle) existing.metaTitle = seo.metaTitle;
    if (!existing.metaDescription) existing.metaDescription = seo.metaDescription;
    if (!existing.ogTitle) existing.ogTitle = seo.ogTitle;
    if (!existing.ogDescription) existing.ogDescription = seo.ogDescription;
    if (!existing.ogImage) existing.ogImage = seo.ogImage || existing.src;
    if (!existing.twitterTitle) existing.twitterTitle = seo.twitterTitle;
    if (!existing.twitterDescription) existing.twitterDescription = seo.twitterDescription;
    if (!existing.twitterImage) existing.twitterImage = seo.twitterImage || existing.src;
    if (!existing.alt) existing.alt = seo.imageAlt;
  }

  await existing.save();
  return serialize(existing);
}

export async function deleteGalleryItem(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid gallery id');
  const doc = await GalleryItem.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Gallery item not found');
  return serialize(doc);
}
