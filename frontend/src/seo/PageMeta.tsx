import { Helmet } from 'react-helmet-async';
import { usePublicContentOptional } from '@/hooks/usePublicContent';
import {
  SITE_NAME,
  absoluteUrl,
  defaultDescription,
  pageTitle,
  DEFAULT_OG_IMAGE,
  resolveSeoFromSettings,
} from './site';
import type { SeoMeta } from './pageMeta';

export type PageMetaProps = SeoMeta;

/**
 * Per-route document head. On public site, merges Module 14 SEO defaults from settings.
 */
export function PageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  robots,
  publishedTime,
  modifiedTime,
  titleAbsolute = false,
}: PageMetaProps) {
  const publicContent = usePublicContentOptional();
  const seo = publicContent
    ? resolveSeoFromSettings(publicContent.settings.seo)
    : undefined;

  const siteName = seo?.siteName || SITE_NAME;
  const fullTitle =
    titleAbsolute && title
      ? title
      : seo?.formatTitle(title) || pageTitle(title, siteName);
  const desc = description || seo?.defaultDescription || defaultDescription;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image || seo?.defaultOgImage || DEFAULT_OG_IMAGE);
  const robotsContent = robots || seo?.robots || 'index, follow';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robotsContent} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {publishedTime ? (
        <meta property="article:published_time" content={publishedTime} />
      ) : null}
      {modifiedTime ? (
        <meta property="article:modified_time" content={modifiedTime} />
      ) : null}
    </Helmet>
  );
}
