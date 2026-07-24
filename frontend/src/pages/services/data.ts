import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until gallery assets are wired. */
const img = {
  bridal:
    'https://images.unsplash.com/photo-1594552072238-8dcd8a33f848?auto=format&fit=crop&w=2400&q=80',
  lehenga:
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=80',
  saree:
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
  fabric:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1600&q=80',
  stitching:
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80',
  boutique:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  embroidery:
    'https://images.unsplash.com/photo-1572804013309-59aec7c2c2c4?auto=format&fit=crop&w=1600&q=80',
  jewelry:
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
  detail:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80',
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
  'Bridal',
  'Traditional',
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

/** Static seed until Phase 12/13 admin + API. */
export const serviceDetails: ServiceDetail[] = [
  {
    id: 'svc-bridal',
    slug: 'bridal-wear',
    title: 'Bridal Wear',
    category: 'Bridal',
    summary:
      'Wedding lehengas, sarees, and bridal sets designed and tailored for your day in Kurnool.',
    description: [
      "At Kadamba's Designer Studio, bridal wear begins with listening — the ceremony, the season, and the silhouette you want to carry.",
      'We guide fabric choices, embroidery weight, and cut so your lehenga or saree feels celebration-ready through every trial.',
      'From first measurement to final finishing, fittings stay personal — the craft families in Kurnool trust for wedding wardrobes.',
    ],
    bannerImage: img.bridal,
    bannerAlt: 'Bridal attire with rich traditional detailing',
    cardImage: img.bridal,
    icon: 'bridal',
    gallery: [
      {
        id: 'bg1',
        image: img.lehenga,
        alt: 'Bridal lehenga with ornate detailing',
        title: 'Bridal lehenga',
      },
      {
        id: 'bg2',
        image: img.embroidery,
        alt: 'Embroidered bridal ensemble detail',
        title: 'Embroidery detail',
      },
      {
        id: 'bg3',
        image: img.jewelry,
        alt: 'Bridal finishing accents',
        title: 'Bridal accents',
      },
      {
        id: 'bg4',
        image: img.saree,
        alt: 'Bridal saree drape',
        title: 'Bridal saree',
      },
    ],
    features: [
      {
        id: 'bf1',
        title: 'Ceremony-ready silhouettes',
        description: 'Lehengas, sarees, and bridal sets shaped for the wedding day and related events.',
      },
      {
        id: 'bf2',
        title: 'Guided fabric & finish',
        description: 'Help choosing weight, sheen, and embellishment that suit the season and venue.',
      },
      {
        id: 'bf3',
        title: 'Multiple fittings',
        description: 'Trials and adjustments in-house so the bridal look sits with confidence.',
      },
    ],
    pricing: {
      startingFrom: '₹28,000',
      note: 'Final pricing depends on fabric, embroidery density, and number of pieces. Quoted after consultation.',
      tiers: [
        {
          id: 'bp1',
          name: 'Bridal blouse & finish',
          priceLabel: 'From ₹8,500',
          detail: 'Custom blouse, lining, and finishing for your bridal saree.',
        },
        {
          id: 'bp2',
          name: 'Bridal saree ensemble',
          priceLabel: 'From ₹28,000',
          detail: 'Saree styling with tailored blouse and celebration-ready finish.',
        },
        {
          id: 'bp3',
          name: 'Bridal lehenga set',
          priceLabel: 'From ₹45,000',
          detail: 'Lehenga, blouse, and dupatta — measured, fitted, and finished in-house.',
        },
      ],
    },
    includes: [
      'Style consultation at the boutique',
      'In-house measurements & pattern notes',
      'At least two fitting trials',
      'Final finishing before delivery',
    ],
    durationNote: 'Typical bridal timeline: 4–8 weeks depending on embroidery and season.',
    ctaLabel: 'Book bridal consultation',
  },
  {
    id: 'svc-traditional',
    slug: 'traditional-wear',
    title: 'Traditional Wear',
    category: 'Traditional',
    summary:
      'Festive and everyday ethnic wear — classic silhouettes with refined finishing for Kurnool occasions.',
    description: [
      'Traditional wear at Kadamba covers sarees, lehengas, and festive ensembles for celebrations large and small.',
      'We keep cuts wearable and finishes careful — so ethnic looks feel polished without losing comfort.',
      'Whether you need a festival outfit or an everyday ethnic piece, the boutique floor and tailoring room work together.',
    ],
    bannerImage: img.saree,
    bannerAlt: 'Elegant traditional saree drape',
    cardImage: img.saree,
    icon: 'traditional',
    gallery: [
      {
        id: 'tg1',
        image: img.saree,
        alt: 'Traditional silk saree styling',
        title: 'Silk saree',
      },
      {
        id: 'tg2',
        image: img.embroidery,
        alt: 'Festive embroidered traditional outfit',
        title: 'Festive ensemble',
      },
      {
        id: 'tg3',
        image: img.fabric,
        alt: 'Selected fabrics for traditional wear',
        title: 'Fabric edit',
      },
      {
        id: 'tg4',
        image: img.lehenga,
        alt: 'Festive lehenga silhouette',
        title: 'Festive lehenga',
      },
    ],
    features: [
      {
        id: 'tf1',
        title: 'Festive & everyday ethnic',
        description: 'Looks for pujas, festivals, and occasions that call for traditional grace.',
      },
      {
        id: 'tf2',
        title: 'Classic cuts, refined finish',
        description: 'Silhouettes that honour tradition with careful hems, lining, and detail.',
      },
      {
        id: 'tf3',
        title: 'Boutique guidance',
        description: 'In-store help matching fabric and style to the event and the wearer.',
      },
    ],
    pricing: {
      startingFrom: '₹6,500',
      note: 'Pricing varies by fabric and occasion complexity. Shared clearly before stitching begins.',
      tiers: [
        {
          id: 'tp1',
          name: 'Festive blouse',
          priceLabel: 'From ₹2,800',
          detail: 'Custom blouse for silk or festive sarees with neat lining.',
        },
        {
          id: 'tp2',
          name: 'Traditional ensemble',
          priceLabel: 'From ₹6,500',
          detail: 'Ethnic outfit tailored for festivals and family occasions.',
        },
        {
          id: 'tp3',
          name: 'Festive lehenga',
          priceLabel: 'From ₹18,000',
          detail: 'Lehenga set for celebrations — measured and trial-fitted.',
        },
      ],
    },
    includes: [
      'Occasion-led style advice',
      'Fabric guidance on the boutique floor',
      'Custom stitching & fittings',
      'Finishing for comfort and drape',
    ],
    durationNote: 'Typical turnaround: 2–4 weeks for festive wear; rush options when capacity allows.',
    ctaLabel: 'Book traditional consult',
  },
  {
    id: 'svc-tailoring',
    slug: 'custom-tailoring',
    title: 'Custom Tailoring',
    category: 'Tailoring',
    summary:
      'Precise measurements, fittings, and alterations for a perfect personal fit — bridal or traditional.',
    description: [
      'Custom tailoring is the heart of Kadamba — measurements taken carefully, patterns adjusted, and trials scheduled until the fit feels right.',
      'Blouses, lehengas, alterations, and full ensembles all move through the same disciplined fitting process.',
      'Clients return because finishing holds up through the celebration, not just the first try-on.',
    ],
    bannerImage: img.stitching,
    bannerAlt: 'Tailoring and fitting work in progress',
    cardImage: img.stitching,
    icon: 'tailoring',
    gallery: [
      {
        id: 'cg1',
        image: img.stitching,
        alt: 'Hand finishing on a garment',
        title: 'Hand finish',
      },
      {
        id: 'cg2',
        image: img.fabric,
        alt: 'Fabrics prepared for custom stitching',
        title: 'Fabric prep',
      },
      {
        id: 'cg3',
        image: img.detail,
        alt: 'Close detail of tailored finish',
        title: 'Finish detail',
      },
      {
        id: 'cg4',
        image: img.boutique,
        alt: 'Boutique fitting space',
        title: 'Fitting room',
      },
    ],
    features: [
      {
        id: 'cf1',
        title: 'Precise measurements',
        description: 'In-house measuring with notes that travel with every garment.',
      },
      {
        id: 'cf2',
        title: 'Trials & adjustments',
        description: 'Scheduled fittings so silhouette and comfort are locked before delivery.',
      },
      {
        id: 'cf3',
        title: 'Alterations welcome',
        description: 'Bring pieces for length, blouse, or fit updates — handled with care.',
      },
    ],
    pricing: {
      startingFrom: '₹1,200',
      note: 'Alteration and stitching rates depend on garment type and work involved. Quoted at the studio.',
      tiers: [
        {
          id: 'cp1',
          name: 'Simple alterations',
          priceLabel: 'From ₹1,200',
          detail: 'Hem, length, or minor fit adjustments on ethnic wear.',
        },
        {
          id: 'cp2',
          name: 'Custom blouse stitching',
          priceLabel: 'From ₹2,500',
          detail: 'Measured blouse with lining and neat finishing.',
        },
        {
          id: 'cp3',
          name: 'Full custom stitch',
          priceLabel: 'From ₹7,500',
          detail: 'Complete garment from your fabric — pattern, trials, finish.',
        },
      ],
    },
    includes: [
      'Detailed measurements',
      'Pattern work in-house',
      'Fitting trials as needed',
      'Clean finishing & delivery check',
    ],
    durationNote: 'Alterations: often 3–7 days. Full custom pieces: 2–5 weeks.',
    ctaLabel: 'Book a fitting',
  },
  {
    id: 'svc-boutique',
    slug: 'boutique-styling',
    title: 'Boutique Styling',
    category: 'Boutique',
    summary:
      'In-store guidance to choose fabrics, cuts, and looks that suit the occasion — at our Kurnool studio.',
    description: [
      'Boutique styling at Kadamba means walking the floor with someone who knows traditional and bridal wear.',
      'We help narrow fabrics, colours, and silhouettes for weddings, festivals, and family occasions.',
      'When custom work is needed, styling flows straight into the tailoring room — one conversation, one studio.',
    ],
    bannerImage: img.boutique,
    bannerAlt: 'Boutique interior with curated traditional wear',
    cardImage: img.boutique,
    icon: 'boutique',
    gallery: [
      {
        id: 'sg1',
        image: img.boutique,
        alt: 'Curated boutique display',
        title: 'Boutique floor',
      },
      {
        id: 'sg2',
        image: img.fabric,
        alt: 'Fabric selection for styling',
        title: 'Fabric guidance',
      },
      {
        id: 'sg3',
        image: img.jewelry,
        alt: 'Styling accents and finishing',
        title: 'Styling accents',
      },
      {
        id: 'sg4',
        image: img.embroidery,
        alt: 'Embroidered boutique piece',
        title: 'Boutique edit',
      },
    ],
    features: [
      {
        id: 'sf1',
        title: 'Occasion-led edits',
        description: 'Looks shaped around the event — wedding, festival, or everyday ethnic.',
      },
      {
        id: 'sf2',
        title: 'Fabric & colour advice',
        description: 'Clear guidance so choices feel confident before stitching begins.',
      },
      {
        id: 'sf3',
        title: 'Seamless handoff to tailoring',
        description: 'When custom fit is needed, styling notes move straight to the atelier.',
      },
    ],
    pricing: {
      startingFrom: 'Complimentary',
      note: 'Studio styling guidance is complimentary with a consultation. Custom stitching is priced separately.',
      tiers: [
        {
          id: 'sp1',
          name: 'Walk-in styling',
          priceLabel: 'Complimentary',
          detail: 'Fabric and silhouette guidance on the boutique floor.',
        },
        {
          id: 'sp2',
          name: 'Occasion consult',
          priceLabel: 'Complimentary',
          detail: 'Wedding or festival edit planning — then optional tailoring quote.',
        },
        {
          id: 'sp3',
          name: 'Styling + custom stitch',
          priceLabel: 'Tailoring rates apply',
          detail: 'Styling notes handed to the atelier for measured custom work.',
        },
      ],
    },
    includes: [
      'Personal styling on the floor',
      'Occasion & colour guidance',
      'Fabric shortlisting',
      'Optional handoff to custom tailoring',
    ],
    durationNote: 'Most styling visits: 30–60 minutes. Book ahead during wedding season.',
    ctaLabel: 'Book styling visit',
  },
];

export function getServiceBySlug(
  slug: string,
  items: ServiceDetail[] = serviceDetails,
): ServiceDetail | undefined {
  return items.find((s) => s.slug === slug);
}

export function filterServices(
  query: string,
  category: ServiceCategoryFilter,
  items: ServiceDetail[] = serviceDetails,
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

export function consultationServiceOptions(items: ServiceDetail[] = serviceDetails) {
  return items.map((s) => ({
    value: s.slug,
    label: `${s.title} — from ${s.pricing.startingFrom}`,
  }));
}
