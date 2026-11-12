export interface HeroSlide {
  id: string;
  image: string;
  /** Optional cinematic loop. `image` is the poster and reduced-motion fallback. */
  video?: string;
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
  /** When present, the card opens the public product page instead of a lightbox. */
  href?: string;
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

/** The people and the disciplines behind the studio. */
export interface StudioDiscipline {
  id: string;
  title: string;
  description: string;
}

/** The material vocabulary the studio works in. */
export interface FabricNote {
  id: string;
  name: string;
  origin: string;
  description: string;
}

/** Why Kurnool, and what the studio does for the women of the city. */
export interface KurnoolNote {
  id: string;
  title: string;
  description: string;
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
  bridal: '/media/photos/bridal-red-lehenga.jpg',
  lehenga: '/media/photos/bridal-seated.jpg',
  saree: '/media/photos/saree-jodhpur.jpg',
  fabric: '/media/photos/fabric-ivory.jpg',
  stitching: '/media/photos/atelier-machine.jpg',
  jewelry: '/media/photos/jewelry-bridal.jpg',
  boutique: '/media/photos/boutique-racks.jpg',
  detail: '/media/photos/fabric-ivory.jpg',
  embroidery: '/media/photos/fabric-embroidery.jpg',
};

export const heroSlides: HeroSlide[] = [
  {
    id: 'h1',
    image: img.bridal,
    video: '/media/hero-atelier.mp4',
    alt: 'Bridal attire with rich traditional detailing',
    headline: 'Designer Studio · Kurnool',
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
    description:
      'Measurements, trials, and finishing handled in-house for a confident personal fit.',
  },
];

export const processSteps: ProcessStep[] = [
  {
    id: 'p1',
    step: '01',
    title: 'Enquire',
    description:
      'Request a consultation online or visit the Kurnool boutique with your occasion in mind.',
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

export const studioDisciplines: StudioDiscipline[] = [
  {
    id: 'sd1',
    title: 'Bridal couture',
    description:
      'A lehenga is built around one silhouette and one person. We drape, bell, canvas and border it by hand, then fit it until it sits the way it should on the day.',
  },
  {
    id: 'sd2',
    title: 'Zardozi & maggam',
    description:
      'Our maggam artists work in gota, zari, resham and zardozi — the vocabulary of a South Indian wedding, carried by hand, not by machine.',
  },
  {
    id: 'sd3',
    title: 'Everyday tradition',
    description:
      'Sarees, blouses, kurtas and festive sets for the office, the festival and the family photograph — cut to move in.',
  },
  {
    id: 'sd4',
    title: 'Alterations & corrections',
    description:
      'A garment that is not quite right is not a finished garment. Bring it back and we will correct it, usually at no charge.',
  },
];

export const fabricNotes: FabricNote[] = [
  {
    id: 'fb1',
    name: 'Raw silk',
    origin: 'Kanchipuram & Bhagalpur',
    description:
      'The body of a bridal lehenga. It holds a pleat, takes a border, and ages into something better than the day it was cut.',
  },
  {
    id: 'fb2',
    name: 'Chanderi & organza',
    origin: 'Madhya Pradesh',
    description:
      'Sheer, weightless, and cut to layer. The fabric of a dupatta that floats rather than hangs.',
  },
  {
    id: 'fb3',
    name: 'Handloom cotton',
    origin: 'Telangana & Andhra',
    description:
      'Cool, honest and everyday. The right cloth for a blouse you will wear fifty times.',
  },
  {
    id: 'fb4',
    name: 'Zari & resham',
    origin: 'Karnataka & Tamil Nadu',
    description:
      'The metal thread and the silk thread that carry a wedding. Hand-woven, and worth the patience.',
  },
];

export const kurnoolNotes: KurnoolNote[] = [
  {
    id: 'kn1',
    title: 'A studio the city trusts',
    description:
      'Kadamba has dressed brides in Kurnool for over fifteen years. Most of them arrived with a photograph and left with something that could not have been bought.',
  },
  {
    id: 'kn2',
    title: 'Measurements taken in person',
    description:
      'Every fitting happens in the studio, on the person, in the fabric. A measurement taken over the phone is a garment that will not fit.',
  },
  {
    id: 'kn3',
    title: 'Serving Andhra Pradesh, and further',
    description:
      'Families come from Nandyal, Cuddapah, Ongole and Vijayawada for bridal work, and we keep the fittings in Kurnool so the atelier can see the garment.',
  },
  {
    id: 'kn4',
    title: 'A quiet, unhurried appointment',
    description:
      'No rush, no shop-floor pressure. Bring the occasion, the photographs, and as much time as the decision deserves.',
  },
];

export const heroImage = img.bridal;
