export interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  headline: string;
  copy: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  icon: 'bridal' | 'traditional' | 'tailoring' | 'boutique';
}

export interface CollectionItem {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
}

export interface ProcessStep {
  id: string;
  step: string;
  title: string;
  description: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface BlogPreview {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  href: string;
  image: string;
}

export interface MarqueeItem {
  id: string;
  title: string;
  image: string;
  alt: string;
}

/**
 * Brand content — Kadamba's Designer Studio, Kurnool.
 * Boutique & tailoring specializing in women's traditional and bridal wear.
 * Keep this positioning in every future phase.
 */
export const brand = {
  name: "Kadamba's Designer Studio",
  shortName: 'Kadamba',
  location: 'Kurnool',
  tagline: "Kurnool's boutique for women's traditional & bridal wear",
  summary:
    "Kadamba's Designer Studio in Kurnool is a well-known local boutique and tailoring business specializing in women's traditional and bridal wear.",
  focus: "Women's traditional wear, bridal wear, and custom tailoring",
} as const;

/** Fashion / bridal placeholders until gallery API is wired. */
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
  jewelry:
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
  boutique:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  detail:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80',
  embroidery:
    'https://images.unsplash.com/photo-1572804013309-59aec7c2c2c4?auto=format&fit=crop&w=1600&q=80',
};

export const heroSlides: HeroSlide[] = [
  {
    id: 'h1',
    image: img.bridal,
    alt: 'Bridal attire with rich traditional detailing',
    headline: "Designer Studio · Kurnool",
    copy: "A trusted local boutique and tailoring house for women's traditional and bridal wear.",
  },
  {
    id: 'h2',
    image: img.lehenga,
    alt: 'Festive lehenga and traditional silhouette',
    headline: 'Bridal wear, made personal',
    copy: 'From first measurement to final fitting — bridal looks crafted with care in Kurnool.',
  },
  {
    id: 'h3',
    image: img.saree,
    alt: 'Elegant traditional saree drape',
    headline: 'Traditional wear, everyday grace',
    copy: 'Sarees, lehengas, and festive ensembles tailored for the women of our city and beyond.',
  },
  {
    id: 'h4',
    image: img.fabric,
    alt: 'Fine fabrics prepared for custom stitching',
    headline: 'Boutique tailoring you can trust',
    copy: 'Custom stitching, fittings, and finishing — the craft behind every Kadamba piece.',
  },
];

export const services: ServiceItem[] = [
  {
    id: 's1',
    title: 'Bridal Wear',
    description: 'Wedding lehengas, sarees, and bridal sets designed and tailored for your day.',
    href: '/services/bridal-wear',
    image: img.bridal,
    icon: 'bridal',
  },
  {
    id: 's2',
    title: 'Traditional Wear',
    description: 'Festive and everyday ethnic wear — classic silhouettes with refined finishing.',
    href: '/services/traditional-wear',
    image: img.saree,
    icon: 'traditional',
  },
  {
    id: 's3',
    title: 'Custom Tailoring',
    description: 'Precise measurements, fittings, and alterations for a perfect personal fit.',
    href: '/services/custom-tailoring',
    image: img.stitching,
    icon: 'tailoring',
  },
  {
    id: 's4',
    title: 'Boutique Styling',
    description: 'In-store guidance to choose fabrics, cuts, and looks that suit the occasion.',
    href: '/services/boutique-styling',
    image: img.boutique,
    icon: 'boutique',
  },
];

export const collectionCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Festive',
  'Tailored',
] as const;

export const collections: CollectionItem[] = [
  {
    id: 'c1',
    title: 'Bridal Lehenga',
    category: 'Bridal',
    image: img.lehenga,
    alt: 'Bridal lehenga with ornate detailing',
  },
  {
    id: 'c2',
    title: 'Silk Saree Drape',
    category: 'Traditional',
    image: img.saree,
    alt: 'Traditional silk saree styling',
  },
  {
    id: 'c3',
    title: 'Ceremony Ensemble',
    category: 'Festive',
    image: img.embroidery,
    alt: 'Festive embroidered traditional outfit',
  },
  {
    id: 'c4',
    title: 'Custom Fit Detail',
    category: 'Tailored',
    image: img.stitching,
    alt: 'Tailoring and fitting work in progress',
  },
  {
    id: 'c5',
    title: 'Fabric & Finish',
    category: 'Tailored',
    image: img.fabric,
    alt: 'Selected fabrics for boutique stitching',
  },
  {
    id: 'c6',
    title: 'Bridal Accents',
    category: 'Bridal',
    image: img.jewelry,
    alt: 'Bridal jewelry and finishing accents',
  },
];

export const marqueeItems: MarqueeItem[] = [
  { id: 'm1', title: 'Silk & Zari', image: img.fabric, alt: 'Silk fabric with zari detail' },
  { id: 'm2', title: 'Bridal Finish', image: img.bridal, alt: 'Bridal wear detail' },
  { id: 'm3', title: 'Saree Grace', image: img.saree, alt: 'Traditional saree fold' },
  { id: 'm4', title: 'Festive Cut', image: img.lehenga, alt: 'Festive lehenga silhouette' },
  { id: 'm5', title: 'Hand Finish', image: img.stitching, alt: 'Hand finishing on a garment' },
  { id: 'm6', title: 'Boutique Edit', image: img.embroidery, alt: 'Embroidered boutique piece' },
];

export const testimonials: TestimonialItem[] = [
  {
    id: 't1',
    quote:
      'For my wedding in Kurnool, Kadamba understood exactly what I wanted — traditional, elegant, and perfectly fitted.',
    name: 'Ananya R.',
    role: 'Bridal client, Kurnool',
  },
  {
    id: 't2',
    quote:
      'They tailored my festive saree blouse with such care. The fit and finish feel boutique-quality every time.',
    name: 'Meera S.',
    role: 'Traditional wear client',
  },
  {
    id: 't3',
    quote:
      'A trusted local studio — from fabric choice to final trial, the team made the whole process simple and lovely.',
    name: 'Lakshmi P.',
    role: 'Custom tailoring client',
  },
];

export const whyChooseUs = [
  {
    id: 'w1',
    title: 'Local trust in Kurnool',
    description:
      'A well-known boutique and tailoring house families return to for weddings and festivals.',
  },
  {
    id: 'w2',
    title: 'Traditional & bridal focus',
    description:
      "Specialists in women's traditional wear and bridal ensembles — not a general fashion store.",
  },
  {
    id: 'w3',
    title: 'True custom tailoring',
    description: 'Measurements, trials, and finishing handled in-house for a confident personal fit.',
  },
];

export const processSteps: ProcessStep[] = [
  {
    id: 'p1',
    step: '01',
    title: 'Enquire',
    description: 'Request a consultation online or visit the Kurnool boutique with your occasion in mind.',
  },
  {
    id: 'p2',
    step: '02',
    title: 'Confirm',
    description: 'We confirm style, fabric, and timeline — then lock your workshop order.',
  },
  {
    id: 'p3',
    step: '03',
    title: 'Reference ID',
    description: 'Receive your Reference ID by email — keep it safe for portal activation.',
  },
  {
    id: 'p4',
    step: '04',
    title: 'Portal',
    description: 'Track orders, share measurements, and chat with the boutique in one place.',
  },
];

export const stats: StatItem[] = [
  { id: 'st1', value: 15, suffix: '+', label: 'Years serving Kurnool' },
  { id: 'st2', value: 2500, suffix: '+', label: 'Garments tailored' },
  { id: 'st3', value: 800, suffix: '+', label: 'Bridal outfits completed' },
  { id: 'st4', value: 95, suffix: '%', label: 'Clients who return' },
];

export const latestBlogs: BlogPreview[] = [
  {
    id: 'b1',
    title: 'Choosing a bridal lehenga for a Kurnool wedding',
    excerpt: 'Fabric, season, and ceremony timing — a simple guide from our boutique floor.',
    date: '2026-06-12',
    href: '/blogs/choosing-bridal-lehenga-kurnool',
    image: img.lehenga,
  },
  {
    id: 'b2',
    title: 'Why custom tailoring still matters',
    excerpt: 'How a proper fitting transforms traditional wear from beautiful to unforgettable.',
    date: '2026-05-28',
    href: '/blogs/why-custom-tailoring-still-matters',
    image: img.stitching,
  },
  {
    id: 'b3',
    title: 'Festive saree blouse trends we love',
    excerpt: 'Classic necklines and finishes our clients request most this season.',
    date: '2026-05-04',
    href: '/blogs/festive-saree-blouse-trends',
    image: img.saree,
  },
];

export const heroImage = img.bridal;
