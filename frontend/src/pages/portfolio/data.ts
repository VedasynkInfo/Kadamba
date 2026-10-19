import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until real gallery assets are uploaded. */
const img = {
  bridal:
    '/media/placeholders/bridal.jpg',
  lehenga:
    '/media/placeholders/lehenga.jpg',
  saree:
    '/media/placeholders/saree.jpg',
  fabric:
    '/media/placeholders/fabric.jpg',
  stitching:
    '/media/placeholders/stitching.jpg',
  boutique:
    '/media/placeholders/boutique.jpg',
  embroidery:
    '/media/placeholders/embroidery.jpg',
  jewelry:
    '/media/placeholders/jewelry.jpg',
  detail:
    '/media/placeholders/fabric.jpg',
  runway:
    '/media/placeholders/runway.jpg',
  fitting:
    '/media/placeholders/fitting.jpg',
};

export type PortfolioCategory =
  | 'Bridal'
  | 'Traditional'
  | 'Before/After'
  | 'Fashion'
  | 'Client Stories';

export interface PortfolioGalleryImage {
  id: string;
  image: string;
  alt: string;
  caption?: string;
}

export interface PortfolioBeforeAfter {
  beforeImage: string;
  beforeAlt: string;
  afterImage: string;
  afterAlt: string;
  note: string;
}

export interface PortfolioClientStory {
  quote: string;
  name: string;
  occasion: string;
}

/**
 * CRUD-ready portfolio project — maps to a future Mongo Portfolio model.
 */
export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  category: PortfolioCategory;
  summary: string;
  story: string[];
  year: string;
  location: string;
  bannerImage: string;
  bannerAlt: string;
  coverImage: string;
  coverAlt: string;
  gallery: PortfolioGalleryImage[];
  beforeAfter?: PortfolioBeforeAfter;
  clientStory?: PortfolioClientStory;
  tags: string[];
  ctaLabel: string;
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

export const portfolioCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
] as const;

export type PortfolioCategoryFilter = (typeof portfolioCategories)[number];

/** Editorial listing hero — distinct from About/Services left-stack heroes. */
export const portfolioHero = {
  image: img.bridal,
  alt: 'Bridal lehenga showcase from Kadamba atelier fittings',
  brandName: brand.shortName,
  locationLine: `${brand.location} · Atelier archive`,
  headline: 'Stories stitched for the celebration',
  copy: 'Bridal ensembles, traditional collections, and client transformations from our Kurnool boutique.',
} as const;

export const portfolioCatalogIntro = {
  title: 'Selected work',
  description:
    'Browse bridal projects, traditional collections, before-and-after fittings, fashion showcases, and client stories.',
} as const;

export const portfolioPageCta = {
  eyebrow: brand.shortName,
  title: 'Begin your own project',
  description:
    'Share your occasion — we will guide silhouette, fabric, and finishing at our Kurnool studio.',
} as const;

/** Looks up a project by slug from the collection the caller loaded. */
export function getProjectBySlug(
  slug: string,
  items: PortfolioProject[],
): PortfolioProject | undefined {
  return items.find((project) => project.slug === slug);
}

export function filterProjects(
  query: string,
  category: PortfolioCategoryFilter,
  items: PortfolioProject[],
): PortfolioProject[] {
  const q = query.trim().toLowerCase();
  return items.filter((project) => {
    const categoryOk = category === 'All' || project.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [
      project.title,
      project.summary,
      project.category,
      ...project.tags,
      project.location,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
