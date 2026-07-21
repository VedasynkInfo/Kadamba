import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until Cloudinary gallery assets are wired. */
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
  runway:
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80',
  fitting:
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80',
};

export type PortfolioCategory =
  | 'Bridal'
  | 'Traditional'
  | 'Before/After'
  | 'Fashion'
  | 'Client Stories';

export interface PortfolioGalleryImage {
  id: string;
  image: string;
  alt: string;
  caption?: string;
}

export interface PortfolioBeforeAfter {
  beforeImage: string;
  beforeAlt: string;
  afterImage: string;
  afterAlt: string;
  note: string;
}

export interface PortfolioClientStory {
  quote: string;
  name: string;
  occasion: string;
}

/**
 * CRUD-ready portfolio project — maps to a future Mongo Portfolio model.
 */
export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  category: PortfolioCategory;
  summary: string;
  story: string[];
  year: string;
  location: string;
  bannerImage: string;
  bannerAlt: string;
  coverImage: string;
  coverAlt: string;
  gallery: PortfolioGalleryImage[];
  beforeAfter?: PortfolioBeforeAfter;
  clientStory?: PortfolioClientStory;
  tags: string[];
  ctaLabel: string;
}

export const portfolioCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
] as const;

export type PortfolioCategoryFilter = (typeof portfolioCategories)[number];

/** Editorial listing hero — distinct from About/Services left-stack heroes. */
export const portfolioHero = {
  image: img.bridal,
  alt: 'Bridal lehenga showcase from Kadamba atelier fittings',
  brandName: brand.shortName,
  locationLine: `${brand.location} · Atelier archive`,
  headline: 'Stories stitched for the celebration',
  copy: 'Bridal ensembles, traditional collections, and client transformations from our Kurnool boutique.',
} as const;

export const portfolioCatalogIntro = {
  title: 'Selected work',
  description:
    'Browse bridal projects, traditional collections, before-and-after fittings, fashion showcases, and client stories.',
} as const;

export const portfolioPageCta = {
  eyebrow: brand.shortName,
  title: 'Begin your own project',
  description:
    'Share your occasion — we will guide silhouette, fabric, and finishing at our Kurnool studio.',
} as const;

/** Static seed until Phase 12/13 admin + API. */
export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'pf-bridal-meenakshi',
    slug: 'meenakshi-bridal-lehenga',
    title: 'Meenakshi bridal lehenga',
    category: 'Bridal',
    summary:
      'A heavy-embroidery bridal lehenga tailored for a Kurnool wedding — measured, fitted, and finished in-house.',
    story: [
      'Meenakshi wanted a classic red-and-gold silhouette that felt ceremonial without overwhelming her frame.',
      'We balanced embroidery weight across the lehenga and blouse, then refined the fall through three studio trials.',
      'Final finishing included hand-checked hems and lining so the look held from pheras through the reception.',
    ],
    year: '2025',
    location: brand.location,
    bannerImage: img.bridal,
    bannerAlt: 'Bridal lehenga with rich traditional embroidery',
    coverImage: img.lehenga,
    coverAlt: 'Bridal lehenga cover',
    gallery: [
      {
        id: 'g1',
        image: img.lehenga,
        alt: 'Bridal lehenga full look',
        caption: 'Ceremony silhouette',
      },
      {
        id: 'g2',
        image: img.embroidery,
        alt: 'Embroidery close-up',
        caption: 'Hand detailing',
      },
      {
        id: 'g3',
        image: img.jewelry,
        alt: 'Bridal accents',
        caption: 'Finishing accents',
      },
      {
        id: 'g4',
        image: img.detail,
        alt: 'Fabric detail',
        caption: 'Fabric depth',
      },
    ],
    clientStory: {
      quote:
        'Every fitting felt personal. The lehenga moved with me — not against me — on the wedding day.',
      name: 'Meenakshi R.',
      occasion: 'Wedding · Kurnool',
    },
    tags: ['bridal', 'lehenga', 'embroidery'],
    ctaLabel: 'Request bridal consultation',
  },
  {
    id: 'pf-traditional-festive',
    slug: 'festive-saree-collection',
    title: 'Festive saree collection',
    category: 'Traditional',
    summary:
      'A curated set of festive sarees and blouses for family celebrations — draped, fitted, and finished locally.',
    story: [
      'This collection grew from seasonal requests for sarees that felt festive yet wearable through long family days.',
      'We focused on blouse fits, fall placements, and fabric choices that photograph well under warm indoor light.',
      'Each piece was trialled for comfort — because traditional wear should feel as good as it looks.',
    ],
    year: '2025',
    location: brand.location,
    bannerImage: img.saree,
    bannerAlt: 'Traditional festive saree drape',
    coverImage: img.saree,
    coverAlt: 'Festive saree',
    gallery: [
      {
        id: 'g1',
        image: img.saree,
        alt: 'Festive saree drape',
        caption: 'Festive drape',
      },
      {
        id: 'g2',
        image: img.fabric,
        alt: 'Saree fabric texture',
        caption: 'Fabric texture',
      },
      {
        id: 'g3',
        image: img.embroidery,
        alt: 'Blouse embroidery',
        caption: 'Blouse detail',
      },
    ],
    tags: ['traditional', 'saree', 'festive'],
    ctaLabel: 'Book a fitting',
  },
  {
    id: 'pf-before-after-ananya',
    slug: 'ananya-silhouette-transformation',
    title: 'Ananya silhouette transformation',
    category: 'Before/After',
    summary:
      'From a loose ready-made fit to a tailored bridal silhouette — measurements, structure, and finishing redone.',
    story: [
      'Ananya arrived with a ready-made ensemble that needed structure, proportion, and confidence in the drape.',
      'We rebuilt the pattern notes from fresh measurements, adjusted the waist-to-hem balance, and refined the blouse.',
      'The after look kept her preferred colour story while giving a cleaner bridal line for photographs and rituals.',
    ],
    year: '2024',
    location: brand.location,
    bannerImage: img.fitting,
    bannerAlt: 'Tailored bridal silhouette after studio fittings',
    coverImage: img.fitting,
    coverAlt: 'Silhouette transformation',
    gallery: [
      {
        id: 'g1',
        image: img.fitting,
        alt: 'After fitting silhouette',
        caption: 'After · fitted line',
      },
      {
        id: 'g2',
        image: img.stitching,
        alt: 'Studio stitching process',
        caption: 'Atelier process',
      },
      {
        id: 'g3',
        image: img.detail,
        alt: 'Finishing detail',
        caption: 'Finish detail',
      },
    ],
    beforeAfter: {
      beforeImage: img.boutique,
      beforeAlt: 'Before — unshaped ready-made fit',
      afterImage: img.fitting,
      afterAlt: 'After — tailored bridal silhouette',
      note: 'Structure and proportion refined across two trials.',
    },
    clientStory: {
      quote: 'I finally recognized myself in the mirror — the fit felt intentional, not borrowed.',
      name: 'Ananya S.',
      occasion: 'Bridal fitting · Kurnool',
    },
    tags: ['before-after', 'bridal', 'fit'],
    ctaLabel: 'Start your transformation',
  },
  {
    id: 'pf-fashion-showcase',
    slug: 'atelier-evening-showcase',
    title: 'Atelier evening showcase',
    category: 'Fashion',
    summary:
      'A studio evening featuring contemporary ethnic silhouettes — lehengas, sarees, and statement drapes.',
    story: [
      'Our evening showcase brought together pieces from recent bridal and festive commissions.',
      'Guests walked the looks under soft atelier lighting — a chance to see movement, embellishment, and finish up close.',
      'Several fittings booked that night became full bridal wardrobes for the following season.',
    ],
    year: '2025',
    location: brand.location,
    bannerImage: img.runway,
    bannerAlt: 'Fashion showcase of ethnic wear',
    coverImage: img.runway,
    coverAlt: 'Evening showcase',
    gallery: [
      {
        id: 'g1',
        image: img.runway,
        alt: 'Showcase look on the floor',
        caption: 'Showcase moment',
      },
      {
        id: 'g2',
        image: img.lehenga,
        alt: 'Lehenga on display',
        caption: 'Lehenga look',
      },
      {
        id: 'g3',
        image: img.jewelry,
        alt: 'Styling accents',
        caption: 'Styling accents',
      },
    ],
    tags: ['fashion', 'showcase', 'ethnic'],
    ctaLabel: 'Discuss a custom look',
  },
  {
    id: 'pf-client-priya',
    slug: 'priya-family-occasion',
    title: 'Priya · family occasion wardrobe',
    category: 'Client Stories',
    summary:
      'A mother–daughter festive pairing tailored for a family function — coordinated without matching identically.',
    story: [
      'Priya wanted coordination with her daughter that felt intentional, not costume-matching.',
      'We chose complementary fabrics and embroidery scales, then fitted both ensembles over shared trial days.',
      'The result photographed as a pair while each silhouette stayed true to the wearer.',
    ],
    year: '2024',
    location: brand.location,
    bannerImage: img.embroidery,
    bannerAlt: 'Coordinated festive ensembles for a family occasion',
    coverImage: img.embroidery,
    coverAlt: 'Family occasion wardrobe',
    gallery: [
      {
        id: 'g1',
        image: img.embroidery,
        alt: 'Coordinated embroidery detail',
        caption: 'Shared motif language',
      },
      {
        id: 'g2',
        image: img.saree,
        alt: 'Mother saree look',
        caption: 'Mother · saree',
      },
      {
        id: 'g3',
        image: img.lehenga,
        alt: 'Daughter lehenga look',
        caption: 'Daughter · lehenga',
      },
    ],
    clientStory: {
      quote:
        'We looked like a family — not a matching set. That balance is exactly what we hoped for.',
      name: 'Priya K.',
      occasion: 'Family function · Kurnool',
    },
    tags: ['client-story', 'festive', 'family'],
    ctaLabel: 'Plan your wardrobe',
  },
  {
    id: 'pf-bridal-reception',
    slug: 'reception-pastel-lehenga',
    title: 'Reception pastel lehenga',
    category: 'Bridal',
    summary:
      'A lighter reception lehenga with soft pastel embroidery — built for movement and evening light.',
    story: [
      'After the ceremony look, the bride wanted something softer for the reception dance floor.',
      'We reduced embroidery density, opened the silhouette slightly, and chose fabrics that caught warm lighting.',
      'Two quick trials locked the comfort — celebration-ready without sacrificing presence.',
    ],
    year: '2025',
    location: brand.location,
    bannerImage: img.lehenga,
    bannerAlt: 'Pastel reception lehenga',
    coverImage: img.lehenga,
    coverAlt: 'Reception lehenga',
    gallery: [
      {
        id: 'g1',
        image: img.lehenga,
        alt: 'Reception lehenga look',
        caption: 'Reception look',
      },
      {
        id: 'g2',
        image: img.fabric,
        alt: 'Pastel fabric detail',
        caption: 'Soft fabric',
      },
      {
        id: 'g3',
        image: img.jewelry,
        alt: 'Evening accents',
        caption: 'Evening accents',
      },
    ],
    tags: ['bridal', 'reception', 'pastel'],
    ctaLabel: 'Request bridal consultation',
  },
];

export function getProjectBySlug(
  slug: string,
  items: PortfolioProject[] = portfolioProjects,
): PortfolioProject | undefined {
  return items.find((project) => project.slug === slug);
}

export function filterProjects(
  query: string,
  category: PortfolioCategoryFilter,
  items: PortfolioProject[] = portfolioProjects,
): PortfolioProject[] {
  const q = query.trim().toLowerCase();
  return items.filter((project) => {
    const categoryOk = category === 'All' || project.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [
      project.title,
      project.summary,
      project.category,
      ...project.tags,
      project.location,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
