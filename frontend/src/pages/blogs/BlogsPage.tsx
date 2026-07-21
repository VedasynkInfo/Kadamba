import { PageMeta, staticPageMeta } from '@/seo';
import {
  BlogsCatalogSection,
  BlogsCtaSection,
  BlogsHeroBanner,
} from './sections';

/**
 * Phase 8 Blogs listing — editorial banner, categories, search, and post grid.
 */
export default function BlogsPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.blogs} />
      <BlogsHeroBanner />
      <BlogsCatalogSection />
      <BlogsCtaSection />
    </>
  );
}
