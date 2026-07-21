import { brand } from '@/pages/home/data';
import { DEFAULT_OG_IMAGE, defaultDescription } from './site';

export interface SeoMeta {
  title?: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/** Static marketing-route SEO copy. */
export const staticPageMeta = {
  home: {
    path: '/',
    description: defaultDescription,
    image: DEFAULT_OG_IMAGE,
  },
  about: {
    title: 'About',
    path: '/about',
    description: `Meet ${brand.name} in ${brand.location} — a trusted boutique for women's traditional wear, bridal fittings, and custom tailoring.`,
  },
  services: {
    title: 'Services',
    path: '/services',
    description: `Bridal wear, traditional ethnic, custom tailoring, and boutique styling at ${brand.name}, ${brand.location}.`,
  },
  gallery: {
    title: 'Gallery',
    path: '/gallery',
    description: `Browse bridal lehengas, festive sarees, and atelier finishes from ${brand.name} in ${brand.location}.`,
  },
  portfolio: {
    title: 'Portfolio',
    path: '/portfolio',
    description: `Client stories and finished looks — bridal and traditional wear crafted at ${brand.name}, ${brand.location}.`,
  },
  blogs: {
    title: 'Journal',
    path: '/blogs',
    description: `Bridal fitting tips, fabric guidance, and festive trends from ${brand.name} in ${brand.location}.`,
  },
  contact: {
    title: 'Contact',
    path: '/contact',
    description: `Visit or message ${brand.name} in ${brand.location} for measurements, trials, and bridal appointments.`,
  },
  requestService: {
    title: 'Request a Service',
    path: '/request-service',
    description: `Request bridal, traditional, or custom tailoring from ${brand.name} in ${brand.location}.`,
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
