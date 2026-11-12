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
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    telephone: studioContact.phoneTel,
    email: studioContact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress:
        'First Floor, H.No. 40/808 B1, near Gulp, Sreenivas Nagar, Prakash Nagar',
      addressLocality: 'Kurnool',
      addressRegion: 'Andhra Pradesh',
      postalCode: '518004',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 15.83866,
      longitude: 78.038834,
    },
    hasMap: studioContact.mapLink,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    ],
    areaServed: ['Kurnool', 'Adoni', 'Nandyal', 'Yemmiganur', 'Dhone'],
    priceRange: '₹₹',
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
      logo: { '@type': 'ImageObject', url: absoluteUrl('/media/brand/kadamba-logo.png') },
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

/**
 * Product rich result for a catalogue garment.
 *
 * The studio publishes an indicative range, not a checkout price. Extract the
 * numbers into an `AggregateOffer` so Search Console gets a valid offer; when
 * the range has no numbers (for example "On request"), omit `offers` rather
 * than emitting a price-less Offer.
 */
export function productJsonLd(input: {
  name: string;
  description: string;
  path: string;
  image?: string;
  category?: string;
  priceRange?: string;
}): JsonLdObject {
  const prices = (input.priceRange?.match(/\d[\d,]*/g) ?? [])
    .map((value) => Number(value.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const highPrice = prices.length > 1 ? Math.max(...prices) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: absoluteUrl(input.image || DEFAULT_OG_IMAGE),
    category: input.category,
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: absoluteUrl(input.path),
    ...(lowPrice
      ? {
          offers: {
            '@type': 'AggregateOffer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'INR',
            lowPrice,
            ...(highPrice ? { highPrice } : {}),
            url: absoluteUrl(input.path),
            seller: { '@type': 'Organization', name: SITE_NAME },
          },
        }
      : {}),
  };
}

/** FAQ page markup. `items` should be the same copy rendered on the page. */
export function faqJsonLd(items: readonly { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** A listing page's ordered set of products. */
export function itemListJsonLd(input: {
  name: string;
  items: readonly { name: string; path: string }[];
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** A gallery of studio work, so image search can associate the plates. */
export function imageGalleryJsonLd(input: {
  name: string;
  description: string;
  path: string;
  images: readonly { url: string; alt: string }[];
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.images.map((image) => absoluteUrl(image.url)),
  };
}
