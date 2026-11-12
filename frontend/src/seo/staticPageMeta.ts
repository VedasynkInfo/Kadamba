import { brand } from '@/pages/home/data';
import { DEFAULT_OG_IMAGE } from './site';

export interface SeoMeta {
  title?: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** When true, `title` is the full document title (skip site template). */
  titleAbsolute?: boolean;
}

/** Static marketing-route SEO copy. */
export const staticPageMeta = {
  home: {
    title: 'Bridal Boutique & Tailoring in Kurnool',
    path: '/',
    description:
      'Kadamba’s Designer Studio is a bridal boutique and custom tailoring studio in Kurnool. Bridal lehengas, designer blouses, sarees, festive wear and made-to-measure pieces.',
    image: DEFAULT_OG_IMAGE,
  },
  about: {
    title: 'About the Kurnool Atelier',
    path: '/about',
    description: `Meet ${brand.name} in ${brand.location} — a boutique for bridal lehengas, traditional wear, designer blouses and custom tailoring, with fittings in the studio.`,
  },
  services: {
    title: 'Bridal & Custom Tailoring',
    path: '/services',
    description: `Bridal couture, traditional wear, designer blouse stitching and custom tailoring at ${brand.name}, ${brand.location}. Two fittings included.`,
  },
  products: {
    title: 'Bridal Lehengas & Blouses',
    path: '/products',
    description: `Explore bridal lehengas, designer blouses, kurtis, gowns and made-to-measure collections from ${brand.name} in ${brand.location}.`,
  },
  gallery: {
    title: 'Bridal & Traditional Gallery',
    path: '/gallery',
    description: `Browse bridal lehengas, festive sarees, maggam work and atelier finishes from ${brand.name} in ${brand.location}.`,
  },
  portfolio: {
    title: 'Kurnool Bridal Portfolio',
    path: '/portfolio',
    description: `Client stories and finished bridal looks — lehengas, sarees and custom tailoring crafted at ${brand.name}, ${brand.location}.`,
  },
  blogs: {
    title: 'Bridal & Fabric Journal',
    path: '/blogs',
    description: `Bridal fitting tips, fabric guidance, blouse fitting notes and festive trends from ${brand.name} in ${brand.location}.`,
  },
  contact: {
    title: 'Contact the Kurnool Studio',
    path: '/contact',
    description: `Visit or message ${brand.name} in ${brand.location} for bridal appointments, measurements, blouse stitching and consultations.`,
  },
  requestService: {
    title: 'Book a Bridal Consultation',
    path: '/request-service',
    description: `Request bridal, traditional or custom tailoring from ${brand.name} in ${brand.location}. Share the date, occasion and budget to plan your fitting.`,
  },
  kurnool: {
    title: 'Boutique in Kurnool',
    path: '/kurnool',
    description: `One studio in Kurnool city, and the district it dresses — what a bridal commission takes and how to plan a fitting from Adoni, Nandyal, Yemmiganur or Dhone.`,
  },
  designSystem: {
    title: 'Design System',
    path: '/design-system',
    description: 'Internal design system reference for Kadamba.',
    robots: 'noindex, nofollow',
  },
  admin: {
    title: 'Admin',
    path: '/admin',
    description: 'Kadamba admin console.',
    robots: 'noindex, nofollow',
  },
} as const satisfies Record<string, SeoMeta>;
