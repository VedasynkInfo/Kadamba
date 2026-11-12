import { JsonLd, PageMeta, imageGalleryJsonLd, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
import { GalleryMasonrySection } from './sections';

/**
 * Gallery — the work, unretouched.
 *
 * The grid and the lightbox keep their behaviour; the page gains the house
 * banner and a closing invitation instead of a second, competing call to action.
 */
export default function GalleryPage() {
  const { gallery } = usePublicContent();

  return (
    <>
      <PageMeta {...staticPageMeta.gallery} />
      {gallery.length > 0 ? (
        <JsonLd
          data={imageGalleryJsonLd({
            name: 'Kadamba studio gallery',
            description:
              'Bridal, traditional and atelier detail photographs from the Kadamba studio in Kurnool.',
            path: '/gallery',
            images: gallery
              .filter((item) => item.published !== false)
              .map((item) => ({ url: item.src, alt: item.alt })),
          })}
        />
      ) : null}

      <PageHero
        variant="mosaic"
        eyebrow="The gallery"
        title="A record,"
        accent="not a lookbook."
        description="Fittings, finished commissions and details from the table. Photographed in the studio as the work happens, not restyled afterwards."
        image="/media/photos/saree-jodhpur.jpg"
        imageAlt="Rose silk falling in soft folds"
        facts={[
          { label: 'Plates', value: String(gallery.length).padStart(2, '0') },
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
        image="/media/photos/bridal-steps.jpg"
        action={{ label: 'Begin a commission', to: '/request-service' }}
      />
    </>
  );
}
