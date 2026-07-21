import { brand } from '@/pages/home/data';

export { brand };

/** Fashion / atelier placeholders until gallery assets are wired. */
const img = {
  hero: 'https://images.unsplash.com/photo-1594552072238-8dcd8a33f848?auto=format&fit=crop&w=2400&q=80',
  story: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  portrait1:
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
  portrait2:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  portrait3:
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=800&q=80',
};

export const aboutHero = {
  image: img.hero,
  alt: 'Bridal and traditional attire with rich detailing',
  brandName: brand.name,
  headline: 'Our story in Kurnool',
  copy: "A trusted local boutique and tailoring house for women's traditional and bridal wear.",
} as const;

export const studioStory = {
  title: 'The studio story',
  lede: 'Kadamba grew from a neighbourhood fitting room into a boutique families trust for weddings and festivals.',
  paragraphs: [
    "Kadamba's Designer Studio in Kurnool is a well-known local boutique and tailoring business specializing in women's traditional and bridal wear.",
    'From sarees and lehengas to bridal ensembles, every piece is shaped through careful measurement, trials, and finishing — craft that sits close to the women who wear it.',
    'We stay rooted in personal service: listening first, fitting with patience, and delivering celebration-ready looks for our city and beyond.',
  ],
  image: img.story,
  imageAlt: 'Boutique interior with curated traditional wear',
} as const;

export const visionMission = {
  title: 'Vision & mission',
  lede: 'Craft, fit, and celebration-ready traditional and bridal wear — made personal in Kurnool.',
  vision: {
    title: 'Vision',
    body: 'To be the boutique women in Kurnool turn to when traditional grace and bridal elegance must feel truly their own.',
  },
  mission: {
    title: 'Mission',
    body: 'To tailor traditional and bridal wear with honest craft — precise fittings, refined finishing, and guidance that makes every occasion feel considered.',
  },
} as const;

export interface ValueItem {
  id: string;
  title: string;
  description: string;
}

export const values: ValueItem[] = [
  {
    id: 'v1',
    title: 'Local trust',
    description:
      'Families return for weddings, festivals, and everyday ethnic wear — trust built one fitting at a time.',
  },
  {
    id: 'v2',
    title: 'Craftsmanship',
    description:
      'Careful stitching, thoughtful fabric choices, and finishing that holds up through the celebration.',
  },
  {
    id: 'v3',
    title: 'Personal fitting',
    description:
      'Measurements, trials, and adjustments handled in-house so every silhouette sits with confidence.',
  },
];

export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export const timeline: TimelineItem[] = [
  {
    id: 't1',
    year: 'Beginnings',
    title: 'A neighbourhood atelier',
    description:
      'Kadamba opened as a local tailoring practice focused on traditional wear for women in Kurnool.',
  },
  {
    id: 't2',
    year: 'Growth',
    title: 'Bridal focus deepens',
    description:
      'Bridal lehengas, sarees, and ceremony ensembles became a core of the studio — fittings with care for the wedding day.',
  },
  {
    id: 't3',
    year: 'Today',
    title: 'Boutique & custom house',
    description:
      "A known local destination for women's traditional and bridal wear, with in-house measurements, trials, and finishing.",
  },
  {
    id: 't4',
    year: 'Ahead',
    title: 'Craft that stays personal',
    description:
      'Continue serving Kurnool with the same promise: beautiful traditional looks, tailored to the woman who wears them.',
  },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  alt: string;
}

export const team: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Studio Lead',
    role: 'Boutique styling',
    bio: 'Guides fabric and silhouette choices for bridal and festive looks on the boutique floor.',
    image: img.portrait1,
    alt: 'Portrait of boutique styling lead',
  },
  {
    id: 'tm2',
    name: 'Master Tailor',
    role: 'Custom fitting',
    bio: 'Leads measurements, pattern work, and trials so every garment sits with a confident fit.',
    image: img.portrait2,
    alt: 'Portrait of master tailor',
  },
  {
    id: 'tm3',
    name: 'Finishing Artist',
    role: 'Embroidery & detail',
    bio: 'Refines hems, embellishment, and final touches before delivery for the celebration.',
    image: img.portrait3,
    alt: 'Portrait of finishing specialist',
  },
];

export interface AchievementStat {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export const achievementStats: AchievementStat[] = [
  { id: 'a1', value: 15, suffix: '+', label: 'Years serving Kurnool' },
  { id: 'a2', value: 2500, suffix: '+', label: 'Garments tailored' },
  { id: 'a3', value: 800, suffix: '+', label: 'Bridal outfits completed' },
  { id: 'a4', value: 95, suffix: '%', label: 'Clients who return' },
];

export const achievementNotes = [
  'Recognised locally for bridal fittings and traditional wear craftsmanship.',
  'Trusted by families across Kurnool for wedding and festival wardrobes.',
  'Built on word-of-mouth — personal service that brings clients back.',
] as const;

export const aboutCta = {
  eyebrow: brand.shortName,
  title: 'Visit the studio in Kurnool',
  description:
    'Begin a bridal or traditional look with a consultation — or stop by Kadamba for fabrics, fittings, and finishing.',
} as const;
