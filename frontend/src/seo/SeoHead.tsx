import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  absoluteUrl,
  defaultDescription,
  pageTitle,
  DEFAULT_OG_IMAGE,
} from './site';
import type { SeoMeta } from './pageMeta';

export type PageMetaProps = SeoMeta;

/**
 * Per-route document head: title, description, canonical, OG, Twitter.
 */
export function PageMeta({
  title,
  description = defaultDescription,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  robots = 'index, follow',
  publishedTime,
  modifiedTime,
}: PageMetaProps) {
  const fullTitle = pageTitle(title);
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
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
