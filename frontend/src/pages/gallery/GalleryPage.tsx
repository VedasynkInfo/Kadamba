import { PageMeta, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { GalleryMasonrySection } from './sections';

/**
 * Gallery — the work, unretouched.
 *
 * The grid and the lightbox keep their behaviour; the page gains the house
 * banner and a closing invitation instead of a second, competing call to action.
 */
export default function GalleryPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.gallery} />

      <PageHero
        eyebrow="The gallery"
        title="A record,"
        accent="not a lookbook."
        description="Fittings, finished commissions and details from the table. Photographed in the studio as the work happens, not restyled afterwards."
        image="/media/placeholders/saree.jpg"
        imageAlt="Rose silk falling in soft folds"
        facts={[
          { label: 'Plates', value: '13' },
          { label: 'Bridal', value: 'In progress' },
          { label: 'Details', value: 'Hand-work' },
          { label: 'Updated', value: 'Monthly' },
        ]}
      />

      <GalleryMasonrySection />

      <CtaBand
        eyebrow="Your turn"
        title="The next plate"
        accent="could be yours."
        copy="Bring the idea to the studio. A commission begins with a conversation and a measuring tape, and ends up on this page."
        image="/media/placeholders/bridal-alt.jpg"
        action={{ label: 'Begin a commission', to: '/request-service' }}
      />
    </>
  );
}
