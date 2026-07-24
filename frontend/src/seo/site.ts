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
export function pageTitle(title?: string, siteName = SITE_NAME): string {
  if (!title) return `${siteName} | ${brand.location} — Traditional & Bridal Wear`;
  return `${title} | ${siteName}`;
}

/**
 * Apply Settings SEO defaults (Module 14) when generating meta.
 * Used by CMS/SEO generators — brand prose stays in home/data.ts.
 */
export function resolveSeoFromSettings(seo?: {
  siteName?: string;
  titleTemplate?: string;
  defaultDescription?: string;
  defaultOgImage?: string;
  localityPhrase?: string;
  robotsIndex?: boolean;
}) {
  const siteName = seo?.siteName?.trim() || SITE_NAME;
  const titleTemplate = seo?.titleTemplate || '{{title}} | {{siteName}}';
  return {
    siteName,
    titleTemplate,
    defaultDescription: seo?.defaultDescription?.trim() || brand.summary,
    defaultOgImage: seo?.defaultOgImage?.trim() || DEFAULT_OG_IMAGE,
    localityPhrase: seo?.localityPhrase?.trim() || brand.location,
    robots: seo?.robotsIndex === false ? 'noindex, nofollow' : 'index, follow',
    formatTitle: (title?: string) => {
      if (!title) return pageTitle(undefined, siteName);
      return titleTemplate
        .replace(/\{\{\s*title\s*\}\}/g, title)
        .replace(/\{\{\s*siteName\s*\}\}/g, siteName);
    },
  };
}

export const defaultDescription = brand.summary;
