import type { GalleryCategory, GalleryItem } from '@/pages/gallery/data';

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
];

export type GalleryFormData = Omit<GalleryItem, 'id'>;

export const createEmptyGalleryForm = (): GalleryFormData => ({
  slug: '',
  title: '',
  category: 'Bridal',
  alt: '',
  mediaType: 'image',
  src: '',
  width: 1200,
  height: 1500,
  published: true,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
});

export interface GalleryMetricsData {
  total: number;
  published: number;
  drafts: number;
  videos: number;
}
