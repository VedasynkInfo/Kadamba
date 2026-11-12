/**
 * CMS seed content — the demo content that used to live as client-side
 * fallbacks in the React layer.
 *
 * Why this exists: the public site previously rendered hardcoded demo arrays
 * from `frontend/src/pages/{gallery,services,portfolio,blogs,admin}/data.ts`
 * whenever the API returned nothing. Those silent fallbacks are being removed
 * (real empty states instead) so admins can own the content. This module holds
 * the same demo content as PLAIN DATA, shaped to match the backend models
 * exactly, so `npm run seed:cms` can insert it into MongoDB once.
 *
 * This file is deliberately dependency-free (no mongoose, no imports) so it can
 * be imported by scripts and tests without side effects. The literal union types
 * below mirror the enums declared in the models — keep them in sync.
 *
 * Faithful port notes (nothing was invented, improved, or dropped):
 *   - Media URLs are the committed local placeholders under `/media/placeholders`.
 *     No external/stock URL (unsplash, pexels, …) is referenced.
 *   - Frontend `id` fields have no counterpart on the models; the model uses
 *     `_id`/`slug`. They are omitted here and noted per collection.
 *   - Optional meta/SEO fields that the frontend left undefined are left unset
 *     here; the models supply their own defaults.
 *   - `sortOrder` is set from each array's index for collections whose frontend
 *     source had no explicit `sortOrder` (services, portfolio) so the intended
 *     display order is preserved.
 *
 * The one import here is the journal, which is plain data in its own module.
 * It is kept separate because the article set is long, and because it is
 * written rather than ported — the eight articles that were ported from the
 * frontend's demo data stay at the top of `blogs`, and the journal follows.
 */

import { journalArticles } from './journal';

export type GallerySeedCategory =
  | 'Bridal'
  | 'Traditional'
  | 'Festive'
  | 'Tailoring'
  | 'Details';

export type GallerySeedMediaType = 'image' | 'video';

/**
 * Mirrors `IGalleryItem` (models/GalleryItem.ts).
 * Frontend `id` (e.g. `g1`) has no model counterpart — omitted.
 */
export interface GallerySeedItem {
  slug: string;
  title: string;
  category: GallerySeedCategory;
  alt: string;
  mediaType: GallerySeedMediaType;
  src: string;
  poster?: string;
  width: number;
  height: number;
  published: boolean;
  sortOrder: number;
}

export type ServiceSeedCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Boutique';

export type ServiceSeedIcon = 'bridal' | 'traditional' | 'tailoring' | 'boutique';

export interface ServiceSeedGalleryImage {
  id: string;
  image: string;
  alt: string;
  title: string;
}

export interface ServiceSeedFeature {
  id: string;
  title: string;
  description: string;
}

export interface ServiceSeedPricingTier {
  id: string;
  name: string;
  priceLabel: string;
  detail: string;
}

export interface ServiceSeedPricing {
  note: string;
  startingFrom: string;
  tiers: ServiceSeedPricingTier[];
}

/**
 * Mirrors `IService` (models/Service.ts).
 * Frontend `id` (e.g. `svc-bridal`) has no model counterpart — omitted.
 * Optional frontend fields (isFulfillable, linkedProductTypeIds,
 * defaultLeadTimeDays, basePriceFrom, tags, meta/SEO) were left undefined in the
 * demo data, so they are left unset here and the model defaults apply.
 */
export interface ServiceSeedItem {
  slug: string;
  title: string;
  category: ServiceSeedCategory;
  summary: string;
  description: string[];
  bannerImage: string;
  bannerAlt: string;
  cardImage: string;
  icon: ServiceSeedIcon;
  gallery: ServiceSeedGalleryImage[];
  features: ServiceSeedFeature[];
  pricing: ServiceSeedPricing;
  includes: string[];
  durationNote: string;
  ctaLabel: string;
  published: boolean;
  sortOrder: number;
}

export type PortfolioSeedCategory =
  | 'Bridal'
  | 'Traditional'
  | 'Before/After'
  | 'Fashion'
  | 'Client Stories';

export interface PortfolioSeedGalleryImage {
  id: string;
  image: string;
  alt: string;
  caption?: string;
}

export interface PortfolioSeedBeforeAfter {
  beforeImage: string;
  beforeAlt: string;
  afterImage: string;
  afterAlt: string;
  note: string;
}

export interface PortfolioSeedClientStory {
  quote: string;
  name: string;
  occasion: string;
}

/**
 * Mirrors `IPortfolio` (models/Portfolio.ts).
 * Frontend `id` (e.g. `pf-bridal-meenakshi`) has no model counterpart — omitted.
 */
export interface PortfolioSeedItem {
  slug: string;
  title: string;
  category: PortfolioSeedCategory;
  summary: string;
  story: string[];
  year: string;
  location: string;
  bannerImage: string;
  bannerAlt: string;
  coverImage: string;
  coverAlt: string;
  gallery: PortfolioSeedGalleryImage[];
  beforeAfter?: PortfolioSeedBeforeAfter;
  clientStory?: PortfolioSeedClientStory;
  tags: string[];
  ctaLabel: string;
  published: boolean;
  sortOrder: number;
}

export type BlogSeedCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Studio Notes';

/**
 * Mirrors `IBlog` (models/Blog.ts). The model stores `date` as a `Date`; the
 * frontend kept it as a `YYYY-MM-DD` string, converted here (date-only ISO forms
 * are parsed as UTC). Frontend `id` (e.g. `blog-bridal-lehenga`) has no model
 * counterpart — omitted. The model has no `sortOrder`; ordering is by `date`.
 */
export interface BlogSeedItem {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogSeedCategory;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  date: Date;
  readMinutes: number;
  author: string;
  featured?: boolean;
  published: boolean;
}

export interface WebsiteSettingsHour {
  day: string;
  time: string;
}

export interface WebsiteSettingsSocial {
  href: string;
  label: string;
}

export interface WebsiteSettingsBannerPreset {
  label: string;
  width: number;
  height: number;
  aspect?: string;
}

export interface WebsiteSettingsEmailTemplate {
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

/**
 * Mirrors `IWebsiteSettings` (models/WebsiteSettings.ts).
 * `key` is the natural key (`'site'`).
 * Frontend `emailConfig.passSet` is a derived/display flag with no stored model
 * counterpart (the model computes it from `pass`) — omitted here.
 */
export interface WebsiteSettingsSeed {
  key: string;
  studioName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl: string;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  phoneAltDisplay: string;
  phoneAltTel: string;
  email: string;
  addressLines: string[];
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  hours: WebsiteSettingsHour[];
  whatsappNumber: string;
  whatsappPrefill: string;
  mapEmbedUrl: string;
  mapLink: string;
  social: WebsiteSettingsSocial[];
  socialNamed: {
    instagram: string;
    facebook: string;
    youtube: string;
    whatsappLink: string;
    googleBusiness: string;
  };
  seo: {
    siteName: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultOgImage: string;
    localityPhrase: string;
    robotsIndex: boolean;
  };
  media: {
    defaultUnit: 'in' | 'cm';
    bannerPresets: WebsiteSettingsBannerPreset[];
    maxUploadBytes: number;
  };
  emailConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
    adminTo: string;
    templates: WebsiteSettingsEmailTemplate[];
  };
  theme: {
    primary: string;
    primaryHover?: string;
    primaryText?: string;
    accent: string;
    publicBg?: string;
    publicText?: string;
    publicCard?: string;
    publicCardText?: string;
    publicSurface?: string;
    adminBg?: string;
    adminText?: string;
    adminCard?: string;
    adminCardText?: string;
    adminSidebar?: string;
    adminSidebarText?: string;
    adminPrimary?: string;
    adminPrimaryText?: string;
    adminAccent?: string;
    fontFamily?: string;
  };
}

export interface CmsSeedContent {
  gallery: GallerySeedItem[];
  services: ServiceSeedItem[];
  portfolio: PortfolioSeedItem[];
  blogs: BlogSeedItem[];
  settings: WebsiteSettingsSeed;
}

/** Local placeholder assets — mirrors `media` in frontend/src/pages/gallery/data.ts. */
const galleryMedia = {
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  bridal2: '/media/photos/bridal-steps.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  saree2: '/media/photos/saree-green.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
  festive: '/media/photos/wedding-three.jpg',
  detail: '/media/photos/atelier-sewing.jpg',
} as const;

/** Local placeholder assets — mirrors `img` in frontend/src/pages/services/data.ts. */
const serviceMedia = {
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  boutique: '/media/photos/boutique-racks.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
  detail: '/media/photos/fabric-ivory.jpg',
} as const;

/** Local placeholder assets — mirrors `img` in frontend/src/pages/portfolio/data.ts. */
const portfolioMedia = {
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  boutique: '/media/photos/boutique-racks.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
  detail: '/media/photos/fabric-ivory.jpg',
  runway: '/media/photos/gown-red.jpg',
  fitting: '/media/photos/atelier-seamstress.jpg',
} as const;

/** Local placeholder assets — mirrors `img` in frontend/src/pages/blogs/data.ts. */
const blogMedia = {
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  boutique: '/media/photos/boutique-racks.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
} as const;

const gallery: GallerySeedItem[] = [
  {
    slug: 'bridal-lehenga-evening',
    title: 'Bridal lehenga evening',
    category: 'Bridal',
    alt: 'Bridal lehenga with ornate detailing under soft light',
    mediaType: 'image',
    src: galleryMedia.bridal,
    width: 1600,
    height: 2000,
    published: true,
    sortOrder: 1,
  },
  {
    slug: 'silk-saree-drape',
    title: 'Silk saree drape',
    category: 'Traditional',
    alt: 'Traditional silk saree fold and drape',
    mediaType: 'image',
    src: galleryMedia.saree,
    width: 1400,
    height: 1600,
    published: true,
    sortOrder: 2,
  },
  {
    slug: 'festive-embroidery',
    title: 'Festive embroidery',
    category: 'Festive',
    alt: 'Close view of festive embroidered traditional wear',
    mediaType: 'image',
    src: galleryMedia.embroidery,
    width: 1400,
    height: 1100,
    published: true,
    sortOrder: 3,
  },
  {
    slug: 'atelier-detail',
    title: 'Atelier detail',
    category: 'Details',
    alt: 'Hand-finished detail from the atelier worktable',
    // Video items are supported end-to-end (admin upload, poster frame, and a
    // metadata-only lightbox player) but the demo inventory only ships stills:
    // there is no local video to point at. Kept as `image`, as in the frontend.
    mediaType: 'image',
    src: galleryMedia.detail,
    width: 1200,
    height: 750,
    published: true,
    sortOrder: 4,
  },
  {
    slug: 'ceremony-lehenga',
    title: 'Ceremony lehenga',
    category: 'Bridal',
    alt: 'Ceremony-ready lehenga silhouette',
    mediaType: 'image',
    src: galleryMedia.lehenga,
    width: 1400,
    height: 1800,
    published: true,
    sortOrder: 5,
  },
  {
    slug: 'fabric-selection',
    title: 'Fabric selection',
    category: 'Tailoring',
    alt: 'Selected fabrics prepared for custom stitching',
    mediaType: 'image',
    src: galleryMedia.fabric,
    width: 1400,
    height: 1200,
    published: true,
    sortOrder: 6,
  },
  {
    slug: 'hand-finishing',
    title: 'Hand finishing',
    category: 'Tailoring',
    alt: 'Tailor hand-finishing a garment in the studio',
    mediaType: 'image',
    src: galleryMedia.stitching,
    width: 1200,
    height: 1500,
    published: true,
    sortOrder: 7,
  },
  {
    slug: 'bridal-accents',
    title: 'Bridal accents',
    category: 'Details',
    alt: 'Bridal jewelry and finishing accents',
    mediaType: 'image',
    src: galleryMedia.jewelry,
    width: 1200,
    height: 1200,
    published: true,
    sortOrder: 8,
  },
  {
    slug: 'festive-ensemble',
    title: 'Festive ensemble',
    category: 'Festive',
    alt: 'Festive ethnic ensemble for celebration',
    mediaType: 'image',
    src: galleryMedia.festive,
    width: 1200,
    height: 1600,
    published: true,
    sortOrder: 9,
  },
  {
    slug: 'classic-saree-fold',
    title: 'Classic saree fold',
    category: 'Traditional',
    alt: 'Classic traditional saree styling',
    mediaType: 'image',
    src: galleryMedia.saree2,
    width: 1200,
    height: 1400,
    published: true,
    sortOrder: 10,
  },
  {
    slug: 'bridal-portrait-light',
    title: 'Bridal portrait light',
    category: 'Bridal',
    alt: 'Bridal wear captured in soft portrait light',
    mediaType: 'image',
    src: galleryMedia.bridal2,
    width: 1200,
    height: 1500,
    published: true,
    sortOrder: 11,
  },
  {
    slug: 'zari-detail',
    title: 'Zari detail',
    category: 'Details',
    alt: 'Close-up of zari and fabric texture',
    mediaType: 'image',
    src: galleryMedia.detail,
    width: 1200,
    height: 1000,
    published: true,
    sortOrder: 12,
  },
];

const services: ServiceSeedItem[] = [
  {
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
    bannerImage: serviceMedia.bridal,
    bannerAlt: 'Bridal attire with rich traditional detailing',
    cardImage: serviceMedia.bridal,
    icon: 'bridal',
    gallery: [
      {
        id: 'bg1',
        image: serviceMedia.lehenga,
        alt: 'Bridal lehenga with ornate detailing',
        title: 'Bridal lehenga',
      },
      {
        id: 'bg2',
        image: serviceMedia.embroidery,
        alt: 'Embroidered bridal ensemble detail',
        title: 'Embroidery detail',
      },
      {
        id: 'bg3',
        image: serviceMedia.jewelry,
        alt: 'Bridal finishing accents',
        title: 'Bridal accents',
      },
      {
        id: 'bg4',
        image: serviceMedia.saree,
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
    published: true,
    sortOrder: 1,
  },
  {
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
    bannerImage: serviceMedia.saree,
    bannerAlt: 'Elegant traditional saree drape',
    cardImage: serviceMedia.saree,
    icon: 'traditional',
    gallery: [
      {
        id: 'tg1',
        image: serviceMedia.saree,
        alt: 'Traditional silk saree styling',
        title: 'Silk saree',
      },
      {
        id: 'tg2',
        image: serviceMedia.embroidery,
        alt: 'Festive embroidered traditional outfit',
        title: 'Festive ensemble',
      },
      {
        id: 'tg3',
        image: serviceMedia.fabric,
        alt: 'Selected fabrics for traditional wear',
        title: 'Fabric edit',
      },
      {
        id: 'tg4',
        image: serviceMedia.lehenga,
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
    published: true,
    sortOrder: 2,
  },
  {
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
    bannerImage: serviceMedia.stitching,
    bannerAlt: 'Tailoring and fitting work in progress',
    cardImage: serviceMedia.stitching,
    icon: 'tailoring',
    gallery: [
      {
        id: 'cg1',
        image: serviceMedia.stitching,
        alt: 'Hand finishing on a garment',
        title: 'Hand finish',
      },
      {
        id: 'cg2',
        image: serviceMedia.fabric,
        alt: 'Fabrics prepared for custom stitching',
        title: 'Fabric prep',
      },
      {
        id: 'cg3',
        image: serviceMedia.detail,
        alt: 'Close detail of tailored finish',
        title: 'Finish detail',
      },
      {
        id: 'cg4',
        image: serviceMedia.boutique,
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
    published: true,
    sortOrder: 3,
  },
  {
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
    bannerImage: serviceMedia.boutique,
    bannerAlt: 'Boutique interior with curated traditional wear',
    cardImage: serviceMedia.boutique,
    icon: 'boutique',
    gallery: [
      {
        id: 'sg1',
        image: serviceMedia.boutique,
        alt: 'Curated boutique display',
        title: 'Boutique floor',
      },
      {
        id: 'sg2',
        image: serviceMedia.fabric,
        alt: 'Fabric selection for styling',
        title: 'Fabric guidance',
      },
      {
        id: 'sg3',
        image: serviceMedia.jewelry,
        alt: 'Styling accents and finishing',
        title: 'Styling accents',
      },
      {
        id: 'sg4',
        image: serviceMedia.embroidery,
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
    published: true,
    sortOrder: 4,
  },
];

const portfolio: PortfolioSeedItem[] = [
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.bridal,
    bannerAlt: 'Bridal lehenga with rich traditional embroidery',
    coverImage: portfolioMedia.lehenga,
    coverAlt: 'Bridal lehenga cover',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.lehenga,
        alt: 'Bridal lehenga full look',
        caption: 'Ceremony silhouette',
      },
      {
        id: 'g2',
        image: portfolioMedia.embroidery,
        alt: 'Embroidery close-up',
        caption: 'Hand detailing',
      },
      {
        id: 'g3',
        image: portfolioMedia.jewelry,
        alt: 'Bridal accents',
        caption: 'Finishing accents',
      },
      {
        id: 'g4',
        image: portfolioMedia.detail,
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
    published: true,
    sortOrder: 1,
  },
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.saree,
    bannerAlt: 'Traditional festive saree drape',
    coverImage: portfolioMedia.saree,
    coverAlt: 'Festive saree',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.saree,
        alt: 'Festive saree drape',
        caption: 'Festive drape',
      },
      {
        id: 'g2',
        image: portfolioMedia.fabric,
        alt: 'Saree fabric texture',
        caption: 'Fabric texture',
      },
      {
        id: 'g3',
        image: portfolioMedia.embroidery,
        alt: 'Blouse embroidery',
        caption: 'Blouse detail',
      },
    ],
    tags: ['traditional', 'saree', 'festive'],
    ctaLabel: 'Book a fitting',
    published: true,
    sortOrder: 2,
  },
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.fitting,
    bannerAlt: 'Tailored bridal silhouette after studio fittings',
    coverImage: portfolioMedia.fitting,
    coverAlt: 'Silhouette transformation',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.fitting,
        alt: 'After fitting silhouette',
        caption: 'After · fitted line',
      },
      {
        id: 'g2',
        image: portfolioMedia.stitching,
        alt: 'Studio stitching process',
        caption: 'Atelier process',
      },
      {
        id: 'g3',
        image: portfolioMedia.detail,
        alt: 'Finishing detail',
        caption: 'Finish detail',
      },
    ],
    beforeAfter: {
      beforeImage: portfolioMedia.boutique,
      beforeAlt: 'Before — unshaped ready-made fit',
      afterImage: portfolioMedia.fitting,
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
    published: true,
    sortOrder: 3,
  },
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.runway,
    bannerAlt: 'Fashion showcase of ethnic wear',
    coverImage: portfolioMedia.runway,
    coverAlt: 'Evening showcase',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.runway,
        alt: 'Showcase look on the floor',
        caption: 'Showcase moment',
      },
      {
        id: 'g2',
        image: portfolioMedia.lehenga,
        alt: 'Lehenga on display',
        caption: 'Lehenga look',
      },
      {
        id: 'g3',
        image: portfolioMedia.jewelry,
        alt: 'Styling accents',
        caption: 'Styling accents',
      },
    ],
    tags: ['fashion', 'showcase', 'ethnic'],
    ctaLabel: 'Discuss a custom look',
    published: true,
    sortOrder: 4,
  },
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.embroidery,
    bannerAlt: 'Coordinated festive ensembles for a family occasion',
    coverImage: portfolioMedia.embroidery,
    coverAlt: 'Family occasion wardrobe',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.embroidery,
        alt: 'Coordinated embroidery detail',
        caption: 'Shared motif language',
      },
      {
        id: 'g2',
        image: portfolioMedia.saree,
        alt: 'Mother saree look',
        caption: 'Mother · saree',
      },
      {
        id: 'g3',
        image: portfolioMedia.lehenga,
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
    published: true,
    sortOrder: 5,
  },
  {
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
    location: 'Kurnool',
    bannerImage: portfolioMedia.lehenga,
    bannerAlt: 'Pastel reception lehenga',
    coverImage: portfolioMedia.lehenga,
    coverAlt: 'Reception lehenga',
    gallery: [
      {
        id: 'g1',
        image: portfolioMedia.lehenga,
        alt: 'Reception lehenga look',
        caption: 'Reception look',
      },
      {
        id: 'g2',
        image: portfolioMedia.fabric,
        alt: 'Pastel fabric detail',
        caption: 'Soft fabric',
      },
      {
        id: 'g3',
        image: portfolioMedia.jewelry,
        alt: 'Evening accents',
        caption: 'Evening accents',
      },
    ],
    tags: ['bridal', 'reception', 'pastel'],
    ctaLabel: 'Request bridal consultation',
    published: true,
    sortOrder: 6,
  },
];

const blogs: BlogSeedItem[] = [
  {
    slug: 'choosing-bridal-lehenga-kurnool',
    title: 'Choosing a bridal lehenga for a Kurnool wedding',
    excerpt:
      'Fabric, season, and ceremony timing — a simple guide from our boutique floor.',
    content: [
      'A bridal lehenga for a Kurnool wedding has to move with the day — outdoor rituals, indoor receptions, and long hours on your feet. Start with season and venue before colour.',
      'Lightweight silks and georgettes breathe better in summer heat; richer brocades and heavier embroidery sit beautifully for evening receptions when the air cools.',
      'During your first visit, we map silhouette preferences, embroidery weight, and blouse comfort so trials feel purposeful — not endless catalogue flipping.',
      'Bring reference photos if you like, but leave room for what drapes well on you. The best bridal looks we finish are measured, tried, and refined until you walk out confident.',
      "Begin with the venue and the time of day. An outdoor muhurtham asks for lighter fabrics and less dense work; an indoor evening reception can carry a deeper colour and heavier embroidery. The lehenga should suit the room as well as the wearer.",
      "We recommend trying at least three silhouettes before deciding on a shape. A-line, fish-cut and straight cuts sit differently on the same body, and the right one is usually the one you can walk, sit and turn in without thinking about it.",
    ],
    category: 'Bridal',
    tags: ['lehenga', 'wedding', 'fabric'],
    coverImage: blogMedia.lehenga,
    coverAlt: 'Festive bridal lehenga with traditional embroidery',
    date: new Date('2026-06-12'),
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
    featured: true,
    published: true,
  },
  {
    slug: 'why-custom-tailoring-still-matters',
    title: 'Why custom tailoring still matters',
    excerpt:
      'How a proper fitting transforms traditional wear from beautiful to unforgettable.',
    content: [
      'Ready-made ethnic wear can look striking on a hanger and still sit awkwardly on the body. Custom tailoring closes that gap — length, ease, and shoulder line tuned to you.',
      'At our Kurnool atelier, measurements become pattern notes we keep for bridal and festive returns. That memory is what makes a second outfit feel familiar from the first trial.',
      'Finishing matters as much as cut: lining, hems, and closures that hold through dance floors and long ceremonies.',
      'If you are choosing between altering a store piece and commissioning from scratch, ask what the silhouette needs. Some looks only come alive when they are built for your frame.',
      "Ready-made sizing is built around an average that few bodies match. Custom tailoring adjusts the shoulder, bust, waist and hem to one person, which is why a simple garment can look more expensive than a complicated one that does not fit.",
      "It also lets you choose the fabric and finishing. You are not paying for a label or a trend cycle; you are paying for cloth that suits the climate and a fit that survives more than one season.",
    ],
    category: 'Tailoring',
    tags: ['fitting', 'atelier', 'custom'],
    coverImage: blogMedia.stitching,
    coverAlt: 'Tailor finishing a garment by hand',
    date: new Date('2026-05-28'),
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'festive-saree-blouse-trends',
    title: 'Festive saree blouse trends we love',
    excerpt: 'Classic necklines and finishes our clients request most this season.',
    content: [
      'Festive saree blouses in our studio still favour clean necklines with thoughtful detail — not every season needs a dramatic cut to feel new.',
      'Clients ask most for soft U-necks, structured boat necks, and elbow-length sleeves that photograph well and stay comfortable through long evenings.',
      'Fabric pairing matters: a heavily embroidered saree often wants a quieter blouse; a plain silk can carry statement sleeves or a subtle back detail.',
      'We always trial the drape with the blouse on. The right finish is the one that lets you move, sit, and celebrate without constant adjusting.',
      "This season we are seeing quieter blouses paired with louder sarees: a plain silk blouse with a contrast border, or a lightly embroidered sleeve against a richly worked pallu. It keeps the look festive without competing for attention.",
      "Necklines are also moving toward soft curves and square shapes that frame the jewellery. If you are unsure, choose a blouse that can be worn with two different drapes; that flexibility is worth more than a trend that lasts one season.",
    ],
    category: 'Traditional',
    tags: ['saree', 'blouse', 'festive'],
    coverImage: blogMedia.saree,
    coverAlt: 'Elegant traditional saree drape',
    date: new Date('2026-05-04'),
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'bridal-fitting-timeline',
    title: 'A realistic bridal fitting timeline',
    excerpt:
      'When to book measurements, trials, and final finishing before your wedding week.',
    content: [
      'Bridal timelines slip when fittings are left too late. For most Kurnool weddings, we recommend starting conversations 8–12 weeks out for custom bridal wear.',
      'First appointment: occasion details, fabric direction, and measurements. Second: muslin or first fabric trial for silhouette. Third: embroidery and finishing checks.',
      'Build buffer for family feedback and small changes. Rush finishing rarely looks as calm as a planned last trial.',
      'If you already have fabric or a inherited piece to restyle, tell us early — those projects need a different sequence than a full custom lehenga.',
      "Wedding-season calendars in Kurnool fill quickly, so the first appointment should happen before the fabric is bought. That gives us time to test a muslin, correct the shoulder and waist, and schedule embroidery without paying rush charges.",
      "Keep the final trial at least ten days before the wedding. It leaves room for a hem change, a blouse adjustment, or a finishing detail that only becomes visible when the full look is worn together.",
    ],
    category: 'Bridal',
    tags: ['timeline', 'fittings', 'wedding'],
    coverImage: blogMedia.bridal,
    coverAlt: 'Bridal attire with rich traditional detailing',
    date: new Date('2026-04-18'),
    readMinutes: 6,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'reading-fabric-for-traditional-wear',
    title: 'Reading fabric for traditional wear',
    excerpt:
      'What weight, drape, and finish mean when you choose silk, georgette, or tissue on the boutique floor.',
    content: [
      'Fabric choice shapes how a garment feels after hour three of a celebration. Weight and drape matter as much as colour.',
      'Silk with body holds structure for lehengas and structured blouses; softer georgettes and chiffons move beautifully for sarees and flowing layers.',
      'We encourage clients to touch and compare in person. Photographs flatten texture — the hand of the cloth is part of the decision.',
      'Ask about lining and season. A fabric that looks perfect in air-conditioned light can feel different under outdoor summer sun.',
      "For Kurnool summers, we often steer clients toward breathable silks, cotton-silk blends and lighter georgettes for day functions. For an evening reception, a tissue or brocade can carry more structure without feeling heavy. The trick is to match the fabric to the function rather than to a photograph.",
      "Bring a swatch to the consultation if you have one. We hold it against your skin tone in daylight, check how it falls over the hip, and tell you honestly whether it can carry the embroidery you want. A beautiful cloth that cannot hold the work is not a bargain.",
    ],
    category: 'Traditional',
    tags: ['fabric', 'silk', 'drape'],
    coverImage: blogMedia.fabric,
    coverAlt: 'Close-up of traditional fabric texture',
    date: new Date('2026-03-30'),
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'inside-the-kurnool-atelier',
    title: 'Inside the Kurnool atelier',
    excerpt:
      'A quiet look at how measurements, trials, and finishing unfold on an ordinary studio day.',
    content: [
      'Most mornings begin with fittings — bridal trials, festive alterations, and pattern notes for pieces still on the machine.',
      'Our floor is not a showroom of interiors; it is a working boutique where cloth, chalk, and conversation share the same space.',
      'Clients often remember the finishing conversation as much as the first sketch: how a hem sits, how a blouse closes, how embroidery catches light.',
      'If you visit, come with the occasion in mind and leave room for craft. The best outcomes are collaborative, not catalogue-picked.',
      "A normal day here moves between the cutting table and the fitting room. Morning light is best for colour matching; afternoons are for trials and hand-finishing. Nothing is rushed past the point where it can still be corrected.",
      "We keep the studio deliberately small so the person who measures you is also the person who answers when you call. That continuity is why a first fitting usually feels like a continuation of the conversation rather than a new appointment.",
    ],
    category: 'Studio Notes',
    tags: ['atelier', 'kurnool', 'studio'],
    coverImage: blogMedia.boutique,
    coverAlt: 'Boutique interior with curated traditional wear',
    date: new Date('2026-03-08'),
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'embroidery-weight-and-comfort',
    title: 'Embroidery weight and all-day comfort',
    excerpt: 'How we balance sparkle with wearability for bridal and festive ensembles.',
    content: [
      'Heavy embroidery photographs beautifully — and can tire shoulders by evening if it is not planned. Balance is craft, not compromise.',
      'We place denser work where structure helps (yokes, borders, panels) and keep high-movement areas lighter when the celebration is long.',
      'During trials, we check not only how the piece looks standing still, but how it sits when you walk, sit, and raise your arms.',
      'Tell us your ceremony sequence. A morning muhurtham and night reception may want different embroidery strategies on the same wardrobe plan.',
      "A useful rule is to distribute weight instead of piling it in one place. A heavily worked border can be balanced by a lighter yoke; a dense sleeve can be offset by a clean back. We also check how the piece behaves when seated, because that is where most discomfort shows up.",
      "If the ceremony runs from morning to night, ask for a second, lighter look or a change of drape. Comfort is not a compromise on craft; it is part of the design brief.",
    ],
    category: 'Bridal',
    tags: ['embroidery', 'comfort', 'bridal'],
    coverImage: blogMedia.embroidery,
    coverAlt: 'Hand-finished traditional embroidery detail',
    date: new Date('2026-02-14'),
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
    published: true,
  },
  {
    slug: 'pairing-jewellery-with-traditional-wear',
    title: 'Pairing jewellery with traditional wear',
    excerpt:
      'Simple pairing notes so necklines, embroidery, and ornaments support each other — not compete.',
    content: [
      'Jewellery should frame the outfit, not fight it. A heavily worked neckline often wants quieter earrings; a plain blouse can carry a stronger necklace.',
      'We talk pairing during fittings when the silhouette is clear — it is easier to decide once the neckline and sleeve length are set.',
      'Family heirlooms deserve space. Bring them to a trial so we can adjust blouse cut or embroidery clearance if needed.',
      'The goal is a composed look for photographs and a comfortable one for the day — both matter for traditional and bridal wear.',
      "Start with the neckline. A high collar or closed neck usually wants earrings and a maang tikka rather than a heavy necklace; a deep neckline can carry a broader piece. The goal is balance, not a display of everything at once.",
      "Bring the jewellery you plan to wear to the fitting. Metal and stone colours change how a fabric reads, and a blouse that looks right on its own can feel busy once the necklace is on.",
    ],
    category: 'Studio Notes',
    tags: ['jewellery', 'styling', 'neckline'],
    coverImage: blogMedia.jewelry,
    coverAlt: 'Traditional jewellery styled with ethnic wear',
    date: new Date('2026-01-22'),
    readMinutes: 3,
    author: "Kadamba's Designer Studio",
    published: true,
  },
];

/**
 * The journal, in full.
 *
 * The eight articles above are the studio's founding set. The journal module
 * holds the rest — the long tail that is how a woman who is not ready to
 * buy still finds the studio, and how a woman in Vijayawada decides to make
 * the trip to Kurnool.
 */
const journal: BlogSeedItem[] = journalArticles.map((article) => ({
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt,
  content: article.content,
  category: article.category,
  tags: article.tags,
  coverImage: blogMedia[article.cover],
  coverAlt: article.alt,
  date: new Date(article.date),
  readMinutes: article.readMinutes,
  author: "Kadamba's Designer Studio",
  ...(article.featured ? { featured: true } : {}),
  published: true,
}));

/**
 * Website settings — mirrors `defaultWebsiteSettings` in
 * frontend/src/pages/admin/data.ts, with `brand`/`studioContact`/`socialLinks`
 * values inlined from frontend/src/pages/home/data.ts and contact/data.ts.
 *
 * Note on email templates: the frontend demo shipped subjects with empty
 * `bodyHtml`/`bodyText`. That is ported faithfully here rather than copied from
 * the model's `DEFAULT_EMAIL_TEMPLATES`, so this stays a pure data port; admins
 * (or the model defaults) can supply bodies.
 */
const settings: WebsiteSettingsSeed = {
  key: 'site',
  studioName: "Kadamba's Designer Studio",
  shortName: 'Kadamba',
  tagline: "Kurnool's boutique for women's traditional & bridal wear",
  logoUrl: '',
  logoDarkUrl: '',
  location: 'Kurnool',
  phoneDisplay: '+91 90540 69489',
  phoneTel: '+919054069489',
  phoneAltDisplay: '',
  phoneAltTel: '',
  email: 'hello@kadambastudio.com',
  addressLines: [
    "Kadamba's Designer Studio",
    'First Floor, H.No. 40/808 B1, near Gulp',
    'Sreenivas Nagar, Prakash Nagar',
    'Kurnool, Andhra Pradesh 518004',
  ],
  landmark: 'Near Gulp, Sreenivas Nagar',
  locality: 'Prakash Nagar',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '518004',
  hours: [
    { day: 'Monday – Saturday', time: '10:00 AM – 7:00 PM' },
    { day: 'Sunday', time: 'By appointment' },
  ],
  whatsappNumber: '919054069489',
  whatsappPrefill:
    "Hi Kadamba's Designer Studio — I'd like to enquire about traditional / bridal wear.",
  mapEmbedUrl: 'https://maps.google.com/maps?q=15.83866%2C78.038834&z=17&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=15.83866%2C78.038834',
  social: [],
  socialNamed: {
    instagram: '',
    facebook: '',
    youtube: '',
    whatsappLink: '',
    googleBusiness: '',
  },
  seo: {
    siteName: "Kadamba's Designer Studio",
    titleTemplate: '{{title}} | {{siteName}}',
    defaultDescription:
      "Kadamba's Designer Studio in Kurnool is a well-known local boutique and tailoring business specializing in women's traditional and bridal wear.",
    defaultOgImage: '',
    localityPhrase: 'Kurnool',
    robotsIndex: true,
  },
  media: {
    defaultUnit: 'in',
    bannerPresets: [
      { label: 'Hero banner', width: 1920, height: 1080, aspect: '16:9' },
      { label: 'Gallery tile', width: 1200, height: 1500, aspect: '4:5' },
      { label: 'OG / share', width: 1200, height: 630, aspect: '1.91:1' },
      { label: 'Portrait lookbook', width: 1080, height: 1350, aspect: '4:5' },
    ],
    maxUploadBytes: 5 * 1024 * 1024,
  },
  emailConfig: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: "Kadamba's Designer Studio",
    fromEmail: '',
    adminTo: '',
    templates: [
      {
        key: 'enquiry_received',
        subject: "We received your consultation request — Kadamba's Designer Studio",
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'order_confirmed',
        subject: 'Order confirmed — Reference {{referenceId}}',
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'measurement_approved',
        subject: "Measurements approved — Kadamba's Designer Studio",
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'portal_activate',
        subject: 'Activate your customer portal — Reference {{referenceId}}',
        bodyText: '',
        bodyHtml: '',
      },
    ],
  },
  theme: {
    // The studio's light scheme: warm paper for the site and the console,
    // gold for the actions, and one type family for everything.
    primary: '#b8892b',
    primaryHover: '#a67a20',
    primaryText: '#17140f',
    accent: '#b8892b',
    publicBg: '#faf7f1',
    publicText: '#17140f',
    publicCard: '#ffffff',
    publicCardText: '#17140f',
    publicSurface: '#f3efe7',
    adminBg: '#f6f4f0',
    adminText: '#1b1815',
    adminCard: '#ffffff',
    adminCardText: '#1b1815',
    adminSidebar: '#fbf8f2',
    adminSidebarText: '#1b1815',
    adminPrimary: '#b8892b',
    adminPrimaryText: '#17140f',
    adminAccent: '#c9a227',
    fontFamily: 'Syne, sans-serif',
  },
};

export const cmsSeedContent: CmsSeedContent = {
  gallery,
  services,
  portfolio,
  blogs: [...blogs, ...journal],
  settings,
};
