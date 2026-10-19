import { brand } from '@/pages/home/data';

export { brand };

export type BlogCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Studio Notes';

/**
 * CRUD-ready blog record — maps cleanly to a future Mongo Blog model.
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogCategory;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  date: string;
  readMinutes: number;
  author: string;
  featured?: boolean;
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export const blogCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Tailoring',
  'Studio Notes',
] as const;

export type BlogCategoryFilter = (typeof blogCategories)[number];

export const blogsHero = {
  brandName: brand.shortName,
  journalLabel: 'Journal',
  locationLine: `${brand.location} · Boutique notes`,
  lede: 'Guides on bridal styling, traditional wear, and custom tailoring from our Kurnool atelier floor.',
  browseLabel: 'Browse posts',
} as const;

export const blogsCatalogIntro = {
  title: 'All posts',
  description:
    'Practical notes from fittings, fabric choices, and festive looks — written for Kurnool celebrations.',
} as const;

export const blogsPageCta = {
  eyebrow: brand.shortName,
  title: 'Ready to plan your look?',
  description:
    'Bring an idea from the journal — we will shape fabric, fit, and finishing at our Kurnool boutique.',
} as const;

/** Looks up a post by slug from the collection the caller loaded. */
export function getBlogBySlug(
  slug: string,
  items: BlogPost[],
): BlogPost | undefined {
  return items.find((post) => post.slug === slug);
}

export function getFeaturedBlog(items: BlogPost[]): BlogPost | undefined {
  if (!items.length) return undefined;
  return items.find((post) => post.featured) ?? items[0];
}

export function filterBlogs(
  query: string,
  category: BlogCategoryFilter,
  items: BlogPost[],
): BlogPost[] {
  const q = query.trim().toLowerCase();
  return items.filter((post) => {
    const categoryOk = category === 'All' || post.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [post.title, post.excerpt, post.category, ...post.tags, ...post.content]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getRelatedBlogs(
  post: BlogPost,
  limit = 3,
  items: BlogPost[],
): BlogPost[] {
  const sameCategory = items.filter(
    (p) => p.id !== post.id && p.category === post.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const extras = items.filter(
    (p) => p.id !== post.id && !sameCategory.some((s) => s.id === p.id),
  );
  return [...sameCategory, ...extras].slice(0, limit);
}

export function formatBlogDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
