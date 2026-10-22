/**
 * The journal’s article types.
 *
 * The journal is the studio’s long tail: it is how a woman in Kurnool who is
 * not ready to buy still finds the studio, and how a woman in Vijayawada
 * decides to make the trip. The articles are written to be *useful* first —
 * a question answered properly — because an article that only exists to carry
 * a keyword is an article a reader leaves and a search engine learns to
 * ignore.
 */
export type JournalCategory = 'Bridal' | 'Traditional' | 'Tailoring' | 'Studio Notes';

export interface JournalArticle {
  /** The URL slug. Stable once published — it is the article’s address. */
  slug: string;
  title: string;
  excerpt: string;
  /** The body, one string per paragraph. */
  content: string[];
  category: JournalCategory;
  tags: string[];
  /** A key into the blog media set. */
  cover: 'bridal' | 'lehenga' | 'saree' | 'fabric' | 'stitching' | 'boutique' | 'embroidery' | 'jewelry';
  alt: string;
  /** ISO date. */
  date: string;
  readMinutes: number;
  featured?: boolean;
}
