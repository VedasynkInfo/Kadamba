import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until gallery assets are wired. */
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
};

export type ServiceCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Boutique';

export type ServiceIcon = 'bridal' | 'traditional' | 'tailoring' | 'boutique';

export interface ServiceGalleryImage {
  id: string;
  image: string;
  alt: string;
  title: string;
}

export interface ServiceFeature {
  id: string;
  title: string;
  description: string;
}

export interface ServicePricingTier {
  id: string;
  name: string;
  priceLabel: string;
  detail: string;
}

export interface ServicePricing {
  note: string;
  startingFrom: string;
  tiers: ServicePricingTier[];
}

/**
 * CRUD-ready service record — maps cleanly to a future Mongo Service model.
 */
export interface ServiceDetail {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  summary: string;
  description: string[];
  bannerImage: string;
  bannerAlt: string;
  cardImage: string;
  icon: ServiceIcon;
  gallery: ServiceGalleryImage[];
  features: ServiceFeature[];
  pricing: ServicePricing;
  includes: string[];
  durationNote: string;
  ctaLabel: string;
  published?: boolean;
  isFulfillable?: boolean;
  linkedProductTypeIds?: string[];
  defaultLeadTimeDays?: number;
  basePriceFrom?: number;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export const serviceCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Tailoring',
  'Boutique',
] as const;

export type ServiceCategoryFilter = (typeof serviceCategories)[number];

export const servicesHero = {
  image: img.embroidery,
  alt: 'Hand-finished traditional embroidery on ethnic wear',
  brandName: brand.name,
  locationLine: `${brand.location} · Boutique & Tailoring`,
  headline: 'Crafted traditions, worn with grace',
  copy: 'Bridal, festive, and custom-tailored ethnic wear — measured, fitted, and finished in our Kurnool atelier.',
} as const;

export const servicesAuthenticity = {
  title: 'Authenticity you can feel',
  lede: 'Every service at Kadamba begins in the fitting room — not a catalogue. Local craft, honest timelines, celebration-ready finish.',
  image: img.stitching,
  imageAlt: 'Tailor finishing a traditional garment by hand',
  pillars: [
    {
      id: 'a1',
      title: 'Measured in-house',
      description:
        'Your measurements stay with our atelier — pattern notes for bridal and traditional wear, not one-size approximations.',
    },
    {
      id: 'a2',
      title: 'Trials before the day',
      description:
        'Fittings and adjustments until the silhouette sits with confidence — for weddings, festivals, and family occasions.',
    },
    {
      id: 'a3',
      title: 'Finish that lasts',
      description:
        'Hems, lining, and embellishment refined so the look holds through the celebration, not only the first try-on.',
    },
  ],
} as const;

export const servicesCatalogIntro = {
  title: 'Our services',
  description:
    'Bridal ensembles, traditional wear, custom tailoring, and boutique styling — rooted in Kurnool craft.',
} as const;

export const servicesPageCta = {
  eyebrow: brand.shortName,
  title: 'Book a studio consultation',
  description:
    'Share your occasion and preferred look — we will guide fabric, fit, and finishing at our Kurnool boutique.',
} as const;

/** Looks up a service by slug from the collection the caller loaded. */
export function getServiceBySlug(
  slug: string,
  items: ServiceDetail[],
): ServiceDetail | undefined {
  return items.find((s) => s.slug === slug);
}

export function filterServices(
  query: string,
  category: ServiceCategoryFilter,
  items: ServiceDetail[],
): ServiceDetail[] {
  const q = query.trim().toLowerCase();
  return items.filter((service) => {
    const categoryOk = category === 'All' || service.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [
      service.title,
      service.summary,
      service.category,
      ...service.features.map((f) => f.title),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function consultationServiceOptions(items: ServiceDetail[]) {
  return items.map((s) => ({
    value: s.slug,
    label: `${s.title} — from ${s.pricing.startingFrom}`,
  }));
}
