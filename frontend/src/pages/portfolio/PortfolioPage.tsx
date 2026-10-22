import { PageMeta, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { PortfolioCatalogSection } from './sections';

/**
 * Portfolio — commissions with a family, a date and a garment at the centre.
 */
export default function PortfolioPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.portfolio} />

      <PageHero
        eyebrow="The portfolio"
        title="Commissions,"
        accent="not campaigns."
        description="Each of these began with a real date and a real family. The photographs are of the finished work, and the notes say what was made and how long it took."
        image="/media/placeholders/bridal-alt.jpg"
        imageAlt="Oxblood silk falling in a single drape"
        facts={[
          { label: 'Stories', value: '06' },
          { label: 'Bridal', value: 'Four' },
          { label: 'Cities', value: 'Kurnool & beyond' },
          { label: 'Made in', value: 'Kurnool' },
        ]}
      />

      <PortfolioCatalogSection />

      <CtaBand
        eyebrow="A commission of your own"
        title="Every wedding"
        accent="begins with a conversation."
        copy="Bring the date, the family and the photographs. The studio will tell you what it can make properly, and what it would rather make instead."
        image="/media/placeholders/lehenga.jpg"
        action={{ label: 'Talk to the studio', to: '/request-service' }}
      />
    </>
  );
}
