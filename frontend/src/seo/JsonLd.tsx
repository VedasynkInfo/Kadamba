import { Helmet } from 'react-helmet-async';
import { brand } from '@/pages/home/data';
import { studioContact } from '@/pages/contact/data';
import { SITE_NAME, SITE_URL, absoluteUrl, DEFAULT_OG_IMAGE } from './site';

type JsonLdObject = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[];
}

/** Injects one or more Schema.org JSON-LD graphs into the document head. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {payload.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

/** LocalBusiness / Organization for the boutique. */
export function localBusinessJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: SITE_NAME,
    description: brand.summary,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    telephone: studioContact.phoneTel,
    email: studioContact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: brand.location,
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    areaServed: brand.location,
    priceRange: '$$',
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    image: absoluteUrl(input.image || DEFAULT_OG_IMAGE),
    datePublished: input.datePublished,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.svg') },
    },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  image?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    image: absoluteUrl(input.image || DEFAULT_OG_IMAGE),
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: brand.location,
    url: absoluteUrl(input.path),
  };
}

export function creativeWorkJsonLd(input: {
  name: string;
  description: string;
  path: string;
  image?: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    image: absoluteUrl(input.image || DEFAULT_OG_IMAGE),
    url: absoluteUrl(input.path),
    creator: { '@type': 'Organization', name: SITE_NAME },
  };
}
