import { JsonLd, PageMeta, itemListJsonLd, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
import { BlogsCatalogSection, BlogClustersSection } from './sections';

/**
 * The journal.
 *
 * A publication, not a content-marketing feed: categories, search, and a grid
 * that treats each essay as a piece of writing rather than a card with a CTA.
 */
export default function BlogsPage() {
  const { blogs } = usePublicContent();

  return (
    <>
      <PageMeta {...staticPageMeta.blogs} />
      {blogs.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: 'Kadamba journal',
            items: blogs.map((post) => ({
              name: post.title,
              path: `/blogs/${post.slug}`,
            })),
          })}
        />
      ) : null}

      <PageHero
        variant="journal"
        eyebrow="The journal"
        title="Notes from"
        accent="the fitting room."
        description="What to ask before a bridal commission, how to read a fabric, why a blouse pulls at the armhole. Written by the people who do the work, for the people who wear it."
        image="/media/photos/atelier-sewing.jpg"
        imageAlt="Cloth folded on the cutting table"
        facts={[
          { label: 'Essays', value: String(blogs.length).padStart(2, '0') },
          { label: 'Categories', value: '05' },
          { label: 'Written', value: 'In-house' },
          { label: 'Sponsored', value: 'Never' },
        ]}
      />

      <BlogsCatalogSection />
      <BlogClustersSection />

      <CtaBand
        eyebrow="Before you commission"
        title="Read first."
        accent="Then come in."
        copy="An hour with the journal will make the first appointment shorter: the questions are the ones the studio would have asked you anyway."
        image="/media/photos/fabric-ivory.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
