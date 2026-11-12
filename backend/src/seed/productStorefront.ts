/**
 * Storefront data for catalogue records that were created for the workshop
 * rather than the website.
 *
 * The product type is a tailoring record first: code, fit card, stages. These
 * helpers add the marketing layer a public page needs — a three-frame gallery,
 * an indicative price range, variants and a lead time — without pretending the
 * studio has already photographed every garment. The images are the branded
 * atelier placeholders until a real shoot replaces them.
 */

export interface StorefrontGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface StorefrontVariant {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  active: boolean;
}

export interface StorefrontMeta {
  gallery: StorefrontGalleryImage[];
  variants: StorefrontVariant[];
  indicativePriceRange: string;
  leadTimeDays: number;
  leadTimeNote: string;
}

interface CategoryMeta {
  images: Array<{ file: string; label: string }>;
  priceRange: string;
  variants: Array<{ name: string; description: string; priceRange: string }>;
  leadTimeDays: number;
  leadTimeNote: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  BRIDAL: {
    images: [
      { file: 'bridal-red-lehenga.jpg', label: 'bridal silhouette' },
      { file: 'bridal-seated.jpg', label: 'lehenga detail' },
      { file: 'jewelry-bridal.jpg', label: 'bridal finishing and jewellery' },
    ],
    priceRange: '₹18,000 – ₹65,000',
    variants: [
      { name: 'Standard fit', description: 'Cut to the studio block, with two fittings.', priceRange: '₹18,000 – ₹32,000' },
      { name: 'Made to measure', description: 'A personal pattern and three fittings.', priceRange: '₹28,000 – ₹48,000' },
      { name: 'Hand-worked', description: 'Maggam, zardozi or zari work by the atelier.', priceRange: '₹45,000 – ₹65,000' },
    ],
    leadTimeDays: 45,
    leadTimeNote: 'Bridal work usually needs six to ten weeks; hand-work can take longer.',
  },
  BLOUSES: {
    images: [
      { file: 'fabric-embroidery.jpg', label: 'embroidered blouse detail' },
      { file: 'atelier-machine.jpg', label: 'blouse construction' },
      { file: 'fabric-ivory.jpg', label: 'fabric and lining selection' },
    ],
    priceRange: '₹1,800 – ₹8,500',
    variants: [
      { name: 'Standard fit', description: 'Cut to your measurements with one fitting.', priceRange: '₹1,800 – ₹3,500' },
      { name: 'Designer', description: 'Lined, shaped and finished for a specific neckline.', priceRange: '₹3,200 – ₹6,000' },
      { name: 'Hand-worked', description: 'Embroidery, maggam or zari detailing.', priceRange: '₹5,500 – ₹8,500' },
    ],
    leadTimeDays: 12,
    leadTimeNote: 'Usually one to two weeks after the fabric is confirmed.',
  },
  KURTIS: {
    images: [
      { file: 'fabric-ivory.jpg', label: 'fabric study' },
      { file: 'atelier-machine.jpg', label: 'kurti construction' },
      { file: 'wedding-three.jpg', label: 'festive styling' },
    ],
    priceRange: '₹2,500 – ₹7,500',
    variants: [
      { name: 'Everyday', description: 'A simple, comfortable cut in your chosen fabric.', priceRange: '₹2,500 – ₹4,200' },
      { name: 'Festive', description: 'Lined, finished and detailed for an occasion.', priceRange: '₹3,800 – ₹7,500' },
    ],
    leadTimeDays: 14,
    leadTimeNote: 'About two weeks, depending on fabric and finishing.',
  },
  GOWNS: {
    images: [
      { file: 'gown-red.jpg', label: 'gown silhouette' },
      { file: 'bridal-seated.jpg', label: 'occasion styling' },
      { file: 'saree-portrait-1.jpg', label: 'finished gown portrait' },
    ],
    priceRange: '₹8,000 – ₹25,000',
    variants: [
      { name: 'Standard fit', description: 'A shaped, lined gown with one fitting.', priceRange: '₹8,000 – ₹14,000' },
      { name: 'Made to measure', description: 'A personal pattern and two fittings.', priceRange: '₹13,000 – ₹25,000' },
    ],
    leadTimeDays: 30,
    leadTimeNote: 'Allow four to six weeks for a fitted occasion gown.',
  },
  SALWAR: {
    images: [
      { file: 'saree-green.jpg', label: 'suit fabric and drape' },
      { file: 'fabric-ivory.jpg', label: 'fabric selection' },
      { file: 'wedding-three.jpg', label: 'festive suit styling' },
    ],
    priceRange: '₹3,500 – ₹12,000',
    variants: [
      { name: 'Two-piece', description: 'Kurta and bottom, cut to measure.', priceRange: '₹3,500 – ₹7,000' },
      { name: 'Three-piece', description: 'With a matching dupatta and lining.', priceRange: '₹6,500 – ₹12,000' },
    ],
    leadTimeDays: 18,
    leadTimeNote: 'Two to three weeks, including one fitting.',
  },
  SKIRTS: {
    images: [
      { file: 'fabric-ivory.jpg', label: 'skirt fabric' },
      { file: 'atelier-machine.jpg', label: 'pleating and construction' },
      { file: 'saree-jodhpur.jpg', label: 'styled with traditional wear' },
    ],
    priceRange: '₹2,500 – ₹9,000',
    variants: [
      { name: 'Standard fit', description: 'Cut to your waist and length.', priceRange: '₹2,500 – ₹5,000' },
      { name: 'Occasion', description: 'Lined and finished for a celebration.', priceRange: '₹4,500 – ₹9,000' },
    ],
    leadTimeDays: 14,
    leadTimeNote: 'About two weeks after measurements.',
  },
  KIDS: {
    images: [
      { file: 'atelier-seamstress.jpg', label: 'childrenswear fitting' },
      { file: 'boutique-racks.jpg', label: 'boutique styling' },
      { file: 'wedding-three.jpg', label: 'festive childrenswear' },
    ],
    priceRange: '₹1,500 – ₹5,500',
    variants: [
      { name: 'Standard fit', description: 'Cut with room to move and grow.', priceRange: '₹1,500 – ₹3,500' },
      { name: 'Occasion', description: 'Lined and finished for a family celebration.', priceRange: '₹3,000 – ₹5,500' },
    ],
    leadTimeDays: 10,
    leadTimeNote: 'Usually one to two weeks.',
  },
  CUSTOM: {
    images: [
      { file: 'atelier-sewing.jpg', label: 'atelier pattern work' },
      { file: 'boutique-racks.jpg', label: 'boutique consultation' },
      { file: 'atelier-seamstress.jpg', label: 'fitting and finishing' },
    ],
    priceRange: '₹2,000 – ₹15,000',
    variants: [
      { name: 'Made to measure', description: 'A personal pattern from your measurements.', priceRange: '₹2,000 – ₹8,000' },
      { name: 'Atelier', description: 'A complex silhouette with detailed finishing.', priceRange: '₹7,000 – ₹15,000' },
    ],
    leadTimeDays: 21,
    leadTimeNote: 'Confirmed after the consultation and fabric selection.',
  },
};

const FALLBACK = CATEGORY_META.CUSTOM;

/**
 * Build the public storefront fields. `seed` keeps gallery ids deterministic
 * across the seed and the backfill so a re-run does not create duplicates.
 */
export function buildStorefrontMeta(input: {
  categoryCode?: string;
  code: string;
  name: string;
  description?: string;
  seed?: boolean;
}): StorefrontMeta {
  const meta = CATEGORY_META[input.categoryCode ?? ''] ?? FALLBACK;
  const base = input.code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const suffix = input.seed ? '' : `-${Date.now().toString(36).slice(-4)}`;

  return {
    gallery: meta.images.map((image, index) => ({
      id: `${base}-image-${index + 1}${suffix}`,
      url: `/media/photos/${image.file}`,
      alt: `${input.name} — ${image.label}`,
    })),
    variants: meta.variants.map((variant, index) => ({
      id: `${base}-variant-${index + 1}`,
      name: variant.name,
      description: variant.description,
      priceRange: variant.priceRange,
      active: true,
    })),
    indicativePriceRange: meta.priceRange,
    leadTimeDays: meta.leadTimeDays,
    leadTimeNote: meta.leadTimeNote,
  };
}

export function publicDescriptionFor(name: string, description?: string): string {
  const lead = description?.trim() || `${name}, cut and finished in the Kurnool atelier.`;
  return `${lead} Made to measure at Kadamba's Designer Studio; fabric and finishing are confirmed at the consultation.`;
}
