import { brand } from '@/pages/home/data';

/**
 * Phase 6 Gallery — CRUD-ready shapes.
 * Admin UI deferred to Phase 12; API layer to Phase 13.
 * Media URLs are Cloudinary-ready (swap host when upload pipeline is live).
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
  /** Delivery URL (Cloudinary or CDN). */
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

/** Fashion / bridal placeholders until Cloudinary gallery assets are wired. */
const media = {
  bridal:
    'https://images.unsplash.com/photo-1594552072238-8dcd8a33f848?auto=format&fit=crop&w=1600&q=80',
  bridal2:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  lehenga:
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1400&q=80',
  saree:
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=80',
  saree2:
    'https://images.unsplash.com/photo-1583391733981-8b530b760759?auto=format&fit=crop&w=1200&q=80',
  fabric:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1400&q=80',
  stitching:
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80',
  jewelry:
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
  embroidery:
    'https://images.unsplash.com/photo-1572804013309-59aec7c2c2c4?auto=format&fit=crop&w=1400&q=80',
  festive:
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=80',
  detail:
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
  atelier:
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=2400&q=80',
  /** Soft ambient motion — swap for studio Cloudinary video when uploads go live. */
  atelierMotion:
    'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4',
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
 * Static gallery inventory — shapes match future admin CRUD + Cloudinary uploads.
 */
export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    slug: 'bridal-lehenga-evening',
    title: 'Bridal lehenga evening',
    category: 'Bridal',
    alt: 'Bridal lehenga with ornate detailing under soft light',
    mediaType: 'image',
    src: media.bridal,
    width: 1600,
    height: 2000,
    published: true,
    sortOrder: 1,
  },
  {
    id: 'g2',
    slug: 'silk-saree-drape',
    title: 'Silk saree drape',
    category: 'Traditional',
    alt: 'Traditional silk saree fold and drape',
    mediaType: 'image',
    src: media.saree,
    width: 1400,
    height: 1600,
    published: true,
    sortOrder: 2,
  },
  {
    id: 'g3',
    slug: 'festive-embroidery',
    title: 'Festive embroidery',
    category: 'Festive',
    alt: 'Close view of festive embroidered traditional wear',
    mediaType: 'image',
    src: media.embroidery,
    width: 1400,
    height: 1100,
    published: true,
    sortOrder: 3,
  },
  {
    id: 'g4',
    slug: 'atelier-motion',
    title: 'Atelier motion',
    category: 'Details',
    alt: 'Soft motion study of fabric and presence in the atelier',
    mediaType: 'video',
    src: media.atelierMotion,
    poster: media.detail,
    width: 1920,
    height: 1080,
    published: true,
    sortOrder: 4,
  },
  {
    id: 'g5',
    slug: 'ceremony-lehenga',
    title: 'Ceremony lehenga',
    category: 'Bridal',
    alt: 'Ceremony-ready lehenga silhouette',
    mediaType: 'image',
    src: media.lehenga,
    width: 1400,
    height: 1800,
    published: true,
    sortOrder: 5,
  },
  {
    id: 'g6',
    slug: 'fabric-selection',
    title: 'Fabric selection',
    category: 'Tailoring',
    alt: 'Selected fabrics prepared for custom stitching',
    mediaType: 'image',
    src: media.fabric,
    width: 1400,
    height: 1200,
    published: true,
    sortOrder: 6,
  },
  {
    id: 'g7',
    slug: 'hand-finishing',
    title: 'Hand finishing',
    category: 'Tailoring',
    alt: 'Tailor hand-finishing a garment in the studio',
    mediaType: 'image',
    src: media.stitching,
    width: 1200,
    height: 1500,
    published: true,
    sortOrder: 7,
  },
  {
    id: 'g8',
    slug: 'bridal-accents',
    title: 'Bridal accents',
    category: 'Details',
    alt: 'Bridal jewelry and finishing accents',
    mediaType: 'image',
    src: media.jewelry,
    width: 1200,
    height: 1200,
    published: true,
    sortOrder: 8,
  },
  {
    id: 'g9',
    slug: 'festive-ensemble',
    title: 'Festive ensemble',
    category: 'Festive',
    alt: 'Festive ethnic ensemble for celebration',
    mediaType: 'image',
    src: media.festive,
    width: 1200,
    height: 1600,
    published: true,
    sortOrder: 9,
  },
  {
    id: 'g10',
    slug: 'classic-saree-fold',
    title: 'Classic saree fold',
    category: 'Traditional',
    alt: 'Classic traditional saree styling',
    mediaType: 'image',
    src: media.saree2,
    width: 1200,
    height: 1400,
    published: true,
    sortOrder: 10,
  },
  {
    id: 'g11',
    slug: 'bridal-portrait-light',
    title: 'Bridal portrait light',
    category: 'Bridal',
    alt: 'Bridal wear captured in soft portrait light',
    mediaType: 'image',
    src: media.bridal2,
    width: 1200,
    height: 1500,
    published: true,
    sortOrder: 11,
  },
  {
    id: 'g12',
    slug: 'zari-detail',
    title: 'Zari detail',
    category: 'Details',
    alt: 'Close-up of zari and fabric texture',
    mediaType: 'image',
    src: media.detail,
    width: 1200,
    height: 1000,
    published: true,
    sortOrder: 12,
  },
];

export function getPublishedGalleryItems(
  items: GalleryItem[] = galleryItems,
): GalleryItem[] {
  return items
    .filter((item) => item.published !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
