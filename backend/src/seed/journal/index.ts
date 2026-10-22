import type { JournalArticle } from './types';
import { bridalArticles } from './bridal';
import { traditionalArticles } from './traditional';
import { tailoringArticles } from './tailoring';
import { studioArticles } from './studio';

/**
 * The journal.
 *
 * The articles are ordered newest first inside each category, and the whole
 * set is sorted by date when it is seeded. The date matters: an article about
 * choosing a fabric in February is not the same advice as the same article in
 * October, and the reader is looking for the one that fits the month they are
 * planning.
 */
export const journalArticles: JournalArticle[] = [
  ...bridalArticles,
  ...traditionalArticles,
  ...tailoringArticles,
  ...studioArticles,
].sort((a, b) => b.date.localeCompare(a.date));

export type { JournalArticle, JournalCategory } from './types';
