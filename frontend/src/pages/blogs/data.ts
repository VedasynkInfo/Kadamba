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

export type BlogCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Studio Notes';

/**
 * CRUD-ready blog record — maps cleanly to a future Mongo Blog model.
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogCategory;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  date: string;
  readMinutes: number;
  author: string;
  featured?: boolean;
}

export const blogCategories = [
  'All',
  'Bridal',
  'Traditional',
  'Tailoring',
  'Studio Notes',
] as const;

export type BlogCategoryFilter = (typeof blogCategories)[number];

export const blogsHero = {
  brandName: brand.shortName,
  journalLabel: 'Journal',
  locationLine: `${brand.location} · Boutique notes`,
  lede: 'Guides on bridal styling, traditional wear, and custom tailoring from our Kurnool atelier floor.',
  browseLabel: 'Browse posts',
} as const;

export const blogsCatalogIntro = {
  title: 'All posts',
  description:
    'Practical notes from fittings, fabric choices, and festive looks — written for Kurnool celebrations.',
} as const;

export const blogsPageCta = {
  eyebrow: brand.shortName,
  title: 'Ready to plan your look?',
  description:
    'Bring an idea from the journal — we will shape fabric, fit, and finishing at our Kurnool boutique.',
} as const;

/** Static seed until Phase 12/13 admin + API. */
export const blogPosts: BlogPost[] = [
  {
    id: 'blog-bridal-lehenga',
    slug: 'choosing-bridal-lehenga-kurnool',
    title: 'Choosing a bridal lehenga for a Kurnool wedding',
    excerpt:
      'Fabric, season, and ceremony timing — a simple guide from our boutique floor.',
    content: [
      'A bridal lehenga for a Kurnool wedding has to move with the day — outdoor rituals, indoor receptions, and long hours on your feet. Start with season and venue before colour.',
      'Lightweight silks and georgettes breathe better in summer heat; richer brocades and heavier embroidery sit beautifully for evening receptions when the air cools.',
      'During your first visit, we map silhouette preferences, embroidery weight, and blouse comfort so trials feel purposeful — not endless catalogue flipping.',
      'Bring reference photos if you like, but leave room for what drapes well on you. The best bridal looks we finish are measured, tried, and refined until you walk out confident.',
    ],
    category: 'Bridal',
    tags: ['lehenga', 'wedding', 'fabric'],
    coverImage: img.lehenga,
    coverAlt: 'Festive bridal lehenga with traditional embroidery',
    date: '2026-06-12',
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
    featured: true,
  },
  {
    id: 'blog-custom-tailoring',
    slug: 'why-custom-tailoring-still-matters',
    title: 'Why custom tailoring still matters',
    excerpt:
      'How a proper fitting transforms traditional wear from beautiful to unforgettable.',
    content: [
      'Ready-made ethnic wear can look striking on a hanger and still sit awkwardly on the body. Custom tailoring closes that gap — length, ease, and shoulder line tuned to you.',
      'At our Kurnool atelier, measurements become pattern notes we keep for bridal and festive returns. That memory is what makes a second outfit feel familiar from the first trial.',
      'Finishing matters as much as cut: lining, hems, and closures that hold through dance floors and long ceremonies.',
      'If you are choosing between altering a store piece and commissioning from scratch, ask what the silhouette needs. Some looks only come alive when they are built for your frame.',
    ],
    category: 'Tailoring',
    tags: ['fitting', 'atelier', 'custom'],
    coverImage: img.stitching,
    coverAlt: 'Tailor finishing a garment by hand',
    date: '2026-05-28',
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-saree-blouse',
    slug: 'festive-saree-blouse-trends',
    title: 'Festive saree blouse trends we love',
    excerpt:
      'Classic necklines and finishes our clients request most this season.',
    content: [
      'Festive saree blouses in our studio still favour clean necklines with thoughtful detail — not every season needs a dramatic cut to feel new.',
      'Clients ask most for soft U-necks, structured boat necks, and elbow-length sleeves that photograph well and stay comfortable through long evenings.',
      'Fabric pairing matters: a heavily embroidered saree often wants a quieter blouse; a plain silk can carry statement sleeves or a subtle back detail.',
      'We always trial the drape with the blouse on. The right finish is the one that lets you move, sit, and celebrate without constant adjusting.',
    ],
    category: 'Traditional',
    tags: ['saree', 'blouse', 'festive'],
    coverImage: img.saree,
    coverAlt: 'Elegant traditional saree drape',
    date: '2026-05-04',
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-bridal-timeline',
    slug: 'bridal-fitting-timeline',
    title: 'A realistic bridal fitting timeline',
    excerpt:
      'When to book measurements, trials, and final finishing before your wedding week.',
    content: [
      'Bridal timelines slip when fittings are left too late. For most Kurnool weddings, we recommend starting conversations 8–12 weeks out for custom bridal wear.',
      'First appointment: occasion details, fabric direction, and measurements. Second: muslin or first fabric trial for silhouette. Third: embroidery and finishing checks.',
      'Build buffer for family feedback and small changes. Rush finishing rarely looks as calm as a planned last trial.',
      'If you already have fabric or a inherited piece to restyle, tell us early — those projects need a different sequence than a full custom lehenga.',
    ],
    category: 'Bridal',
    tags: ['timeline', 'fittings', 'wedding'],
    coverImage: img.bridal,
    coverAlt: 'Bridal attire with rich traditional detailing',
    date: '2026-04-18',
    readMinutes: 6,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-fabric-guide',
    slug: 'reading-fabric-for-traditional-wear',
    title: 'Reading fabric for traditional wear',
    excerpt:
      'What weight, drape, and finish mean when you choose silk, georgette, or tissue on the boutique floor.',
    content: [
      'Fabric choice shapes how a garment feels after hour three of a celebration. Weight and drape matter as much as colour.',
      'Silk with body holds structure for lehengas and structured blouses; softer georgettes and chiffons move beautifully for sarees and flowing layers.',
      'We encourage clients to touch and compare in person. Photographs flatten texture — the hand of the cloth is part of the decision.',
      'Ask about lining and season. A fabric that looks perfect in air-conditioned light can feel different under outdoor summer sun.',
    ],
    category: 'Traditional',
    tags: ['fabric', 'silk', 'drape'],
    coverImage: img.fabric,
    coverAlt: 'Close-up of traditional fabric texture',
    date: '2026-03-30',
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-atelier-notes',
    slug: 'inside-the-kurnool-atelier',
    title: 'Inside the Kurnool atelier',
    excerpt:
      'A quiet look at how measurements, trials, and finishing unfold on an ordinary studio day.',
    content: [
      'Most mornings begin with fittings — bridal trials, festive alterations, and pattern notes for pieces still on the machine.',
      'Our floor is not a showroom of interiors; it is a working boutique where cloth, chalk, and conversation share the same space.',
      'Clients often remember the finishing conversation as much as the first sketch: how a hem sits, how a blouse closes, how embroidery catches light.',
      'If you visit, come with the occasion in mind and leave room for craft. The best outcomes are collaborative, not catalogue-picked.',
    ],
    category: 'Studio Notes',
    tags: ['atelier', 'kurnool', 'studio'],
    coverImage: img.boutique,
    coverAlt: 'Boutique interior with curated traditional wear',
    date: '2026-03-08',
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-embroidery',
    slug: 'embroidery-weight-and-comfort',
    title: 'Embroidery weight and all-day comfort',
    excerpt:
      'How we balance sparkle with wearability for bridal and festive ensembles.',
    content: [
      'Heavy embroidery photographs beautifully — and can tire shoulders by evening if it is not planned. Balance is craft, not compromise.',
      'We place denser work where structure helps (yokes, borders, panels) and keep high-movement areas lighter when the celebration is long.',
      'During trials, we check not only how the piece looks standing still, but how it sits when you walk, sit, and raise your arms.',
      'Tell us your ceremony sequence. A morning muhurtham and night reception may want different embroidery strategies on the same wardrobe plan.',
    ],
    category: 'Bridal',
    tags: ['embroidery', 'comfort', 'bridal'],
    coverImage: img.embroidery,
    coverAlt: 'Hand-finished traditional embroidery detail',
    date: '2026-02-14',
    readMinutes: 5,
    author: "Kadamba's Designer Studio",
  },
  {
    id: 'blog-jewellery-pairing',
    slug: 'pairing-jewellery-with-traditional-wear',
    title: 'Pairing jewellery with traditional wear',
    excerpt:
      'Simple pairing notes so necklines, embroidery, and ornaments support each other — not compete.',
    content: [
      'Jewellery should frame the outfit, not fight it. A heavily worked neckline often wants quieter earrings; a plain blouse can carry a stronger necklace.',
      'We talk pairing during fittings when the silhouette is clear — it is easier to decide once the neckline and sleeve length are set.',
      'Family heirlooms deserve space. Bring them to a trial so we can adjust blouse cut or embroidery clearance if needed.',
      'The goal is a composed look for photographs and a comfortable one for the day — both matter for traditional and bridal wear.',
    ],
    category: 'Studio Notes',
    tags: ['jewellery', 'styling', 'neckline'],
    coverImage: img.jewelry,
    coverAlt: 'Traditional jewellery styled with ethnic wear',
    date: '2026-01-22',
    readMinutes: 3,
    author: "Kadamba's Designer Studio",
  },
];

export function getBlogBySlug(
  slug: string,
  items: BlogPost[] = blogPosts,
): BlogPost | undefined {
  return items.find((post) => post.slug === slug);
}

export function getFeaturedBlog(items: BlogPost[] = blogPosts): BlogPost | undefined {
  if (!items.length) return undefined;
  return items.find((post) => post.featured) ?? items[0];
}

export function filterBlogs(
  query: string,
  category: BlogCategoryFilter,
  items: BlogPost[] = blogPosts,
): BlogPost[] {
  const q = query.trim().toLowerCase();
  return items.filter((post) => {
    const categoryOk = category === 'All' || post.category === category;
    if (!categoryOk) return false;
    if (!q) return true;
    const haystack = [post.title, post.excerpt, post.category, ...post.tags, ...post.content]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getRelatedBlogs(
  post: BlogPost,
  limit = 3,
  items: BlogPost[] = blogPosts,
): BlogPost[] {
  const sameCategory = items.filter(
    (p) => p.id !== post.id && p.category === post.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const extras = items.filter(
    (p) => p.id !== post.id && !sameCategory.some((s) => s.id === p.id),
  );
  return [...sameCategory, ...extras].slice(0, limit);
}

export function formatBlogDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
