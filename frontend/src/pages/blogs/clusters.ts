import type { BlogPost } from './data';

export interface JournalCluster {
  slug: string;
  label: string;
  /** The line above the title on the cluster page. */
  eyebrow: string;
  description: string;
  /** Which posts belong. Kept as a predicate so a cluster can cut across categories. */
  match: (post: BlogPost) => boolean;
}

function hasTag(post: BlogPost, words: readonly string[]): boolean {
  const tags = post.tags.map((tag) => tag.toLowerCase());
  return words.some((word) => tags.includes(word) || tags.some((tag) => tag.includes(word)));
}

/**
 * The journal, read by subject rather than by date.
 *
 * Categories are the studio's four disciplines; a cluster is the question a
 * reader actually arrives with — a Kurnool wedding in April, a fabric that will
 * not hold a border, a blouse that pulls at the armhole. The two indexes sit
 * beside each other because they answer different questions.
 */
export const JOURNAL_CLUSTERS: JournalCluster[] = [
  {
    slug: 'bridal',
    label: 'Bridal',
    eyebrow: 'The wedding',
    description:
      'Choosing, fitting and carrying a bridal garment — lehengas, sarees, trials, colour and the length of a wedding day.',
    match: (post) => post.category === 'Bridal' || hasTag(post, ['bridal', 'lehenga']),
  },
  {
    slug: 'traditional',
    label: 'Traditional',
    eyebrow: 'The festival',
    description:
      'Sarees, half-sarees, festive looks and the grammar of traditional dress in the district.',
    match: (post) => post.category === 'Traditional' || hasTag(post, ['saree', 'festive', 'pattu']),
  },
  {
    slug: 'tailoring',
    label: 'Tailoring',
    eyebrow: 'The fit',
    description:
      'Blouses, armholes, alterations, measurements and the difference between a garment that fits and one that merely closes.',
    match: (post) => post.category === 'Tailoring' || hasTag(post, ['blouse', 'fitting', 'alteration']),
  },
  {
    slug: 'kurnool',
    label: 'Kurnool',
    eyebrow: 'The place',
    description:
      'The heat, the wedding season, the handlooms and the practicalities of dressing in Kurnool and its district.',
    match: (post) =>
      hasTag(post, ['kurnool']) ||
      post.title.toLowerCase().includes('kurnool') ||
      post.excerpt.toLowerCase().includes('kurnool'),
  },
  {
    slug: 'fabric-and-care',
    label: 'Fabric & care',
    eyebrow: 'The cloth',
    description:
      'Silk, cotton, zardozi and maggam work — what a fabric will carry, and how to keep it after the wedding.',
    match: (post) =>
      hasTag(post, [
        'fabric',
        'silk',
        'cotton',
        'linen',
        'zardozi',
        'maggam',
        'embroidery',
        'lace',
        'care',
        'storage',
      ]),
  },
  {
    slug: 'wedding-season',
    label: 'Wedding season',
    eyebrow: 'The calendar',
    description:
      'Haldi, mehendi, engagement, reception: what to wear to each function, and how to plan a week of them.',
    match: (post) =>
      hasTag(post, [
        'wedding',
        'haldi',
        'mehendi',
        'engagement',
        'reception',
        'sangeet',
        'festive',
      ]),
  },
];

export function getCluster(slug: string | undefined): JournalCluster | undefined {
  return JOURNAL_CLUSTERS.find((cluster) => cluster.slug === slug);
}

export function postsInCluster(cluster: JournalCluster, posts: BlogPost[]): BlogPost[] {
  return posts.filter((post) => cluster.match(post));
}

export function clusterPath(cluster: JournalCluster): string {
  return `/blogs/cluster/${cluster.slug}`;
}
