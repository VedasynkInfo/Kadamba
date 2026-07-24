import {
  defaultSeoAutoFlags,
  generateSeoFromTitle,
  type SeoAutoFlags,
  type SeoPack,
  type SeoSiteDefaults,
} from '@/seo/generateSeo';
import type { WebsiteSettings } from '../data';

export function getSiteSeoDefaults(seo: WebsiteSettings['seo']): SeoSiteDefaults {
  return {
    siteName: seo.siteName,
    titleTemplate: seo.titleTemplate,
    defaultDescription: seo.defaultDescription,
    defaultOgImage: seo.defaultOgImage,
    localityPhrase: seo.localityPhrase,
  };
}

export function buildSeoPack(
  title: string,
  summary: string | undefined,
  imageUrl: string | undefined,
  site: SeoSiteDefaults,
): SeoPack {
  return generateSeoFromTitle({ title, summary, imageUrl, site });
}

export interface SeoFormSlice {
  slug: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  imageAlt?: string;
}

export function inferSeoAutoFlags(
  values: SeoFormSlice,
  site: SeoSiteDefaults,
): { slugAuto: boolean; seoAuto: SeoAutoFlags } {
  const pack = buildSeoPack(values.title, values.summary, values.imageUrl, site);
  return {
    slugAuto: !values.slug || values.slug === pack.slug,
    seoAuto: {
      metaTitle: !values.metaTitle || values.metaTitle === pack.metaTitle,
      metaDescription:
        !values.metaDescription || values.metaDescription === pack.metaDescription,
      ogTitle: !values.ogTitle || values.ogTitle === pack.ogTitle,
      ogDescription: !values.ogDescription || values.ogDescription === pack.ogDescription,
      ogImage: !values.ogImage || values.ogImage === pack.ogImage,
      twitterTitle: !values.twitterTitle || values.twitterTitle === pack.twitterTitle,
      twitterDescription:
        !values.twitterDescription || values.twitterDescription === pack.twitterDescription,
      twitterImage: !values.twitterImage || values.twitterImage === pack.twitterImage,
      imageAlt: !values.imageAlt || values.imageAlt === pack.imageAlt,
    },
  };
}

export function applySeoPack<T>(
  form: T,
  pack: SeoPack,
  seoAuto: SeoAutoFlags,
  slugAuto: boolean,
  altKeys: string | string[],
): T {
  const next: Record<string, unknown> = { ...(form as Record<string, unknown>) };
  if (slugAuto && seoAuto.slug !== false) next.slug = pack.slug;
  if (seoAuto.metaTitle !== false) next.metaTitle = pack.metaTitle;
  if (seoAuto.metaDescription !== false) next.metaDescription = pack.metaDescription;
  if (seoAuto.ogTitle !== false) next.ogTitle = pack.ogTitle;
  if (seoAuto.ogDescription !== false) next.ogDescription = pack.ogDescription;
  if (seoAuto.ogImage !== false) next.ogImage = pack.ogImage;
  if (seoAuto.twitterTitle !== false) next.twitterTitle = pack.twitterTitle;
  if (seoAuto.twitterDescription !== false) next.twitterDescription = pack.twitterDescription;
  if (seoAuto.twitterImage !== false) next.twitterImage = pack.twitterImage;
  if (seoAuto.imageAlt !== false) {
    const keys = Array.isArray(altKeys) ? altKeys : [altKeys];
    for (const key of keys) next[key] = pack.imageAlt;
  }
  return next as T;
}

export { defaultSeoAutoFlags };
