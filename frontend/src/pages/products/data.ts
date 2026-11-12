import { brand } from '@/pages/home/data';
import type { PublicProduct } from '@/services/products/publicProductService';

/**
 * Images for catalogue categories.
 *
 * Product types carry an optional `image` field, but most workshop records do
 * not: they were created for measurement and order entry, not for the website.
 * A category-level photograph keeps the storefront composed until the studio
 * uploads a photograph of every garment.
 */
const categoryImages: Record<string, string> = {
  BRIDAL: '/media/photos/bridal-red-lehenga.jpg',
  BLOUSES: '/media/photos/fabric-embroidery.jpg',
  KURTIS: '/media/photos/saree-portrait-2.jpg',
  GOWNS: '/media/photos/gown-red.jpg',
  SALWAR: '/media/photos/saree-green.jpg',
  SKIRTS: '/media/photos/fabric-ivory.jpg',
  KIDS: '/media/photos/kids-lehenga.jpg',
  CUSTOM: '/media/photos/atelier-sewing.jpg',
};

const fallback = '/media/photos/bridal-red-lehenga.jpg';

export function productImage(product: PublicProduct): string {
  if (product.image) return product.image;
  if (product.gallery?.[0]?.url) return product.gallery[0].url;
  return categoryImages[product.category?.code ?? ''] ?? fallback;
}

export function productPath(product: Pick<PublicProduct, 'slug'>): string {
  return `/products/${product.slug}`;
}

export const productsHero = {
  image: '/media/photos/bridal-red-lehenga.jpg',
  alt: 'Bridal and traditional garments from the Kadamba atelier',
  eyebrow: `${brand.location} - Made to measure`,
  headline: 'The collection, garment by garment',
  copy: 'Bridal lehengas, designer blouses, festive kurtis and tailored sets - each piece begins with a measurement and ends in a fitting.',
} as const;

export const productsCatalogIntro = {
  title: 'Atelier catalogue',
  description:
    'Filter by category to see the silhouettes we cut, stitch and finish in Kurnool. Every garment is made to order.',
} as const;

export const productsCta = {
  eyebrow: 'Not sure where to begin?',
  title: 'Bring us the occasion. We will find the silhouette.',
  description:
    'Share your date, budget and the look you have in mind. The studio will suggest a garment, fabric and fitting schedule.',
  primaryHref: '/request-service',
  primaryLabel: 'Request a consultation',
} as const;

export const productFaqs = [
  {
    question: 'Are the pieces ready to wear?',
    answer:
      'No. Every garment in the catalogue is made to order in Kurnool: first measurement, then stitching, then a fitting.',
  },
  {
    question: 'Can I choose a different fabric?',
    answer:
      'Yes. The listed price range is for the silhouette and work; fabric selection is confirmed at the consultation.',
  },
  {
    question: 'How long does a bridal order take?',
    answer:
      'Bridal work usually needs six to ten weeks depending on embroidery. Festive and everyday pieces are typically quicker.',
  },
  {
    question: 'Do you take outstation orders?',
    answer:
      'Yes, with measurements shared at the boutique or through the customer portal. Final fittings are best in person.',
  },
] as const;

export const productDetailCopy = {
  detailsTitle: 'Atelier notes',
  processTitle: 'How this piece is made',
  relatedTitle: 'Other pieces in this category',
  ctaTitle: 'Make this silhouette yours',
  ctaBody:
    'Send the studio your occasion and timeline. We will confirm fabric, measurements and the fitting calendar.',
} as const;
