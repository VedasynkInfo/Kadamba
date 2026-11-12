import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until gallery assets are wired. */
const img = {
  bridal:
    '/media/photos/bridal-red-lehenga.jpg',
  lehenga:
    '/media/photos/bridal-seated.jpg',
  saree:
    '/media/photos/saree-jodhpur.jpg',
  fabric:
    '/media/photos/fabric-ivory.jpg',
  stitching:
    '/media/photos/atelier-machine.jpg',
  boutique:
    '/media/photos/boutique-racks.jpg',
  embroidery:
    '/media/photos/fabric-embroidery.jpg',
  jewelry:
    '/media/photos/jewelry-bridal.jpg',
  detail:
    '/media/photos/fabric-ivory.jpg',
};

export type ServiceCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Boutique';

export type ServiceIcon = 'bridal' | 'traditional' | 'tailoring' | 'boutique';

export interface ServiceGalleryImage {
  id: string;
  image: string;
  alt: string;
  title: string;
}

export interface ServiceFeature {
  id: string;
  title: string;
  description: string;
}

export interface ServicePricingTier {
  id: string;
  name: string;
  priceLabel: string;
  detail: string;
}

export interface ServicePricing {
  note: string;
  startingFrom: string;
  tiers: ServicePricingTier[];
}

/**
 * CRUD-ready service record — maps cleanly to a future Mongo Service model.
 */
export interface ServiceDetail {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  summary: string;
  description: string[];
  bannerImage: string;
  bannerAlt: string;
  cardImage: string;
  icon: ServiceIcon;
  gallery: ServiceGalleryImage[];
  features: ServiceFeature[];
  pricing: ServicePricing;
  includes: string[];
  durationNote: string;
  ctaLabel: string;
  published?: boolean;
  isFulfillable?: boolean;
  linkedProductTypeIds?: string[];
  defaultLeadTimeDays?: number;
  basePriceFrom?: number;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export const serviceCategories = [
  'All',
  'Bridal',  'Traditional',
  'Tailoring',
  'Boutique',
] as const;

export type ServiceCategoryFilter = (typeof serviceCategories)[number];

export const servicesHero = {
  image: img.embroidery,
  alt: 'Hand-finished traditional embroidery on ethnic wear',
  brandName: brand.name,
  locationLine: `${brand.location} · Boutique & Tailoring`,
  headline: 'Crafted traditions, worn with grace',
  copy: 'Bridal, festive, and custom-tailored ethnic wear — measured, fitted, and finished in our Kurnool atelier.',
} as const;

export const servicesAuthenticity = {
  title: 'Authenticity you can feel',
  lede: 'Every service at Kadamba begins in the fitting room — not a catalogue. Local craft, honest timelines, celebration-ready finish.',
  image: img.stitching,
  imageAlt: 'Tailor finishing a traditional garment by hand',
  pillars: [
    {
      id: 'a1',
      title: 'Measured in-house',
      description:
        'Your measurements stay with our atelier — pattern notes for bridal and traditional wear, not one-size approximations.',
    },
    {
      id: 'a2',
      title: 'Trials before the day',
      description:
        'Fittings and adjustments until the silhouette sits with confidence — for weddings, festivals, and family occasions.',
    },
    {
      id: 'a3',
      title: 'Finish that lasts',
      description:
        'Hems, lining, and embellishment refined so the look holds through the celebration, not only the first try-on.',
    },
  ],
} as const;

export const servicesCatalogIntro = {
  title: 'Our services',
  description:
    'Bridal ensembles, traditional wear, custom tailoring, and boutique styling — rooted in Kurnool craft.',
} as const;

export const servicesPageCta = {
  eyebrow: brand.shortName,
  title: 'Book a studio consultation',
  description:
    'Share your occasion and preferred look — we will guide fabric, fit, and finishing at our Kurnool boutique.',
} as const;

/** Looks up a service by slug from the collection the caller loaded. */
export function getServiceBySlug(
  slug: string,
  items: ServiceDetail[],
): ServiceDetail | undefined {
  return items.find((s) => s.slug === slug);
}

export function filterServices(
  query: string,
  category: ServiceCategoryFilter,
  items: ServiceDetail[],
): ServiceDetail[] {
  const q = query.trim().toLowerCase();
  return items.filter((service) => {
    const categoryOk = category === 'All' || service.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [
      service.title,
      service.summary,
      service.category,
      ...service.features.map((f) => f.title),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function consultationServiceOptions(items: ServiceDetail[]) {
  return items.map((s) => ({
    value: s.slug,
    label: `${s.title} — from ${s.pricing.startingFrom}`,
  }));
}

/**
 * The questions each service is actually asked.
 *
 * These are the questions the studio answers at the counter, written down
 * where a reader can find them. They are also the `FAQPage` schema for the
 * service page — the same text, marked up, so the search engine can show
 * them and the reader can read them.
 */
export interface ServiceQuestion {
  question: string;
  answer: string;
}

export const serviceQuestions: Record<string, ServiceQuestion[]> = {
  'bridal-wear': [
    {
      question: 'How far ahead should I book a bridal lehenga?',
      answer:
        'Four to six months is comfortable, and three is workable. The studio is busiest between December and February, so an early booking is what secures the fabric you want and the number of fittings the garment needs.',
    },
    {
      question: 'How many fittings does a bridal lehenga need?',
      answer:
        'Two for a lehenga made from a bought fabric, and three when the design is new — a new blouse, a new drape, a new silhouette. The second fitting is the one that decides whether the garment works, and it is the one people rush.',
    },
    {
      question: 'Which fabric is right for a wedding in summer?',
      answer:
        'Lightweight silk with a structured lined skirt, or a georgette or chanderi dupatta over a raw silk skirt. A heavy fall and a wide border are beautiful at the mandap and are the reason a bride is exhausted by the fourth hour.',
    },
    {
      question: 'Can the blouse be changed later?',
      answer:
        'Yes, and it is often a good idea. A blouse made with a proper side seam can be let out or taken in without touching the outer fabric, so it can be fitted again if the body changes between the trial and the wedding.',
    },
    {
      question: 'Do you work with my own fabric?',
      answer:
        'We do. Sarees brought in are cut and worked on the cloth you already own, which is usually the cheapest way to get a garment that is entirely your own.',
    },
  ],
  'traditional-wear': [
    {
      question: 'How long does a saree blouse take?',
      answer:
        'Two weeks for a simple blouse in a plain fabric, and four to six for a blouse with a heavy border or a shaped neckline. A blouse fitted against the saree it will be worn with takes longer than one fitted on its own.',
    },
    {
      question: 'What should I bring to a blouse fitting?',
      answer:
        'The saree, the petticoat you will use with it, the bra under the blouse, and the shoes. The blouse is fitted against all four, and each of them changes the measurements.',
    },
    {
      question: 'Can you fix a blouse I already own?',
      answer:
        'Usually. A gape at the back, a bulge at the side, a slipping strap and a riding-up hem are all corrections, not a remake. Bring it in and we will tell you honestly which of them can be fixed.',
    },
    {
      question: 'Do you make petticoats?',
      answer:
        'Yes, and we recommend a separate petticoat for each saree, in the same colour. It is a small expense that makes the drape fall correctly instead of being held up all evening.',
    },
  ],
  'custom-tailoring': [
    {
      question: 'What is the difference between custom tailoring and alteration?',
      answer:
        'Alteration corrects a garment that is the right design and the wrong proportions, and it costs a fraction of a new one. It cannot change the design: a V-neck cannot be taken out of a round neck. A new garment is the answer when the design itself is wrong, or when it is for a wedding.',
    },
    {
      question: 'What measurements do you need from me?',
      answer:
        'The bust, waist, hip, shoulder, armhole, sleeve length, back length and height, and the neck size. All of them are taken on you, standing, over the undergarments you will wear with the finished piece.',
    },
    {
      question: 'How long does a custom order take?',
      answer:
        'Three to four weeks for a shirt or a suit, and six to eight for a full bridal garment. A hand-worked border is three weeks of embroidery on its own, and it cannot be hurried without it being done badly.',
    },
    {
      question: 'Will the garment need altering later?',
      answer:
        'Every garment should be alterable, and a little ease in the right places is what makes it so. A bodice with a side seam can be taken in or let out in a morning; a garment that cannot be opened becomes waste the first time the body changes.',
    },
  ],
  'boutique-styling': [
    {
      question: 'What does a styling appointment include?',
      answer:
        'An hour with the pieces you own and the ones you are considering, a written plan of what to keep and what to replace, and the alteration notes for the pieces worth changing. It is advice, not a sales pitch.',
    },
    {
      question: 'Do I bring my own clothes?',
      answer:
        'Bring what you wear now, including the pieces you are unsure about. The point of the appointment is to see what is already working, and a wardrobe in a bag tells us more than a description of it.',
    },
    {
      question: 'Is styling worth it for a single event?',
      answer:
        'For a wedding, yes. The photographs are made by other people, and the outfit is the one thing in your control that day. For an ordinary week, the same hour usually produces a simpler wardrobe that works for years.',
    },
    {
      question: 'Can you style for a photograph shoot?',
      answer:
        'Yes. Bring the brief and the reference images, and the plan will be written around what the camera actually does rather than around what looks good standing still.',
    },
  ],
};

/** The questions for a service, falling back to a general set. */
export function questionsForService(slug: string): ServiceQuestion[] {
  return (
    serviceQuestions[slug] ?? [
      {
        question: 'How do I begin?',
        answer:
          'Send a request with the occasion and the date, and the studio will call you within a working day to talk it through before anything is measured or ordered.',
      },
      {
        question: 'How long does it take?',
        answer:
          'The timeline depends on the fabric and the hand work. The studio quotes a time at the first meeting, and it is a time it controls rather than a hope.',
      },
      {
        question: 'Can I bring my own fabric?',
        answer:
          'Yes. Cloth brought in is cut and worked on as it is, which is usually the least expensive way to get a garment that is entirely your own.',
      },
    ]
  );
}
