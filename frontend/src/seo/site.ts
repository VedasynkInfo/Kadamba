import { brand } from '@/pages/home/data';

/** Production site origin — override via VITE_SITE_URL. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://kadambastudio.com'
).replace(/\/$/, '');

export const SITE_NAME = brand.name;

/** Default share image (hero bridal placeholder until studio OG asset is set). */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1594552072238-8dcd8a33f848?auto=format&fit=crop&w=1200&q=80';

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Page title: "Section | Brand" or brand alone for home. */
export function pageTitle(title?: string): string {
  if (!title) return `${SITE_NAME} | ${brand.location} — Traditional & Bridal Wear`;
  return `${title} | ${SITE_NAME}`;
}

export const defaultDescription = brand.summary;
