import { brand } from '@/pages/home/data';

/**
 * Phase 6 Gallery — CRUD-ready shapes.
 * Admin UI deferred to Phase 12; API layer to Phase 13.
 * Media URLs are relative API paths (`/uploads/...`) or absolute same-origin
 * URLs once the upload pipeline stores them.
 */

export type GalleryCategory =
  | 'Bridal'
  | 'Traditional'
  | 'Festive'
  | 'Tailoring'
  | 'Details';

export type GalleryMediaType = 'image' | 'video';

export interface GalleryItem {
  id: string;
  slug: string;
  title: string;
  category: GalleryCategory;
  alt: string;
  mediaType: GalleryMediaType;
  /** Delivery URL (uploaded file or bundled placeholder). */
  src: string;
  /** Poster / thumbnail for video items. */
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
}

export const galleryCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
] as const;

export type GalleryFilter = (typeof galleryCategories)[number];

/** Fashion / bridal placeholders until real gallery assets are uploaded. */
const media = {
  bridal:
    '/media/photos/bridal-red-lehenga.jpg',
  bridal2:
    '/media/photos/bridal-steps.jpg',
  lehenga:
    '/media/photos/bridal-seated.jpg',
  saree:
    '/media/photos/saree-jodhpur.jpg',
  saree2:
    '/media/photos/saree-green.jpg',
  fabric:
    '/media/photos/fabric-ivory.jpg',
  stitching:
    '/media/photos/atelier-machine.jpg',
  jewelry:
    '/media/photos/jewelry-bridal.jpg',
  embroidery:
    '/media/photos/fabric-embroidery.jpg',
  festive:
    '/media/photos/wedding-three.jpg',
  detail:
    '/media/photos/atelier-sewing.jpg',
  atelier:
    '/media/photos/atelier-seamstress.jpg',
};

export const galleryHero = {
  brand: brand.shortName,
  locationLine: `${brand.location} · Lookbook`,
  headline: 'The atelier lookbook',
  copy: 'Bridal silhouettes, traditional drapes, and hand-finished details from our Kurnool boutique.',
  image: media.atelier,
  alt: 'Soft light on curated fabrics and garments in a boutique atelier',
  ctaLabel: 'Browse the gallery',
} as const;

export const galleryCta = {
  eyebrow: 'Visit the boutique',
  title: 'See a piece you love?',
  description:
    'Book a consultation in Kurnool — we will tailor bridal and traditional wear around your measurements, occasion, and style.',
} as const;

/**
 * Published gallery items in studio order. The inventory comes from the API;
 * this only sorts and filters what it is given.
 */
export function getPublishedGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return items
    .filter((item) => item.published !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
