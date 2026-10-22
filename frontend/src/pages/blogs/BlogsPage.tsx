import { PageMeta, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { BlogsCatalogSection } from './sections';

/**
 * The journal.
 *
 * A publication, not a content-marketing feed: categories, search, and a grid
 * that treats each essay as a piece of writing rather than a card with a CTA.
 */
export default function BlogsPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.blogs} />

      <PageHero
        eyebrow="The journal"
        title="Notes from"
        accent="the fitting room."
        description="What to ask before a bridal commission, how to read a fabric, why a blouse pulls at the armhole. Written by the people who do the work, for the people who wear it."
        image="/media/placeholders/atelier.jpg"
        imageAlt="Cloth folded on the cutting table"
        facts={[
          { label: 'Essays', value: '77' },
          { label: 'Categories', value: '05' },
          { label: 'Written', value: 'In-house' },
          { label: 'Sponsored', value: 'Never' },
        ]}
      />

      <BlogsCatalogSection />

      <CtaBand
        eyebrow="Before you commission"
        title="Read first."
        accent="Then come in."
        copy="An hour with the journal will make the first appointment shorter: the questions are the ones the studio would have asked you anyway."
        image="/media/placeholders/fabric.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
