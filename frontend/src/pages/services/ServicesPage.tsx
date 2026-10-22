import { PageMeta, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import {
  ServicesAuthenticitySection,
  ServicesCatalogSection,
} from './sections';

/**
 * Services — the four disciplines, and what each one actually includes.
 */
export default function ServicesPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.services} />

      <PageHero
        eyebrow="What we make"
        title="The work,"
        accent="in four disciplines."
        description="Bridal couture, traditional wear, bespoke tailoring and boutique styling. Different calendars, different cloths, the same table and the same fitter."
        image="/media/placeholders/embroidery.jpg"
        imageAlt="Maggam embroidery being worked on a stretched panel"
        facts={[
          { label: 'Bridal', value: '8–16 weeks' },
          { label: 'Traditional', value: '3–6 weeks' },
          { label: 'Tailoring', value: '1–3 weeks' },
          { label: 'Fittings', value: 'Included' },
        ]}
      />

      <ServicesAuthenticitySection />
      <ServicesCatalogSection />

      <CtaBand
        eyebrow="Not sure which one?"
        title="Describe the day."
        accent="We will name the work."
        copy="A wedding, a reception, a festival, a first interview. Tell the studio what the occasion is and it will tell you which discipline it belongs to — and how long it needs."
        image="/media/placeholders/lehenga.jpg"
        action={{ label: 'Ask the studio', to: '/request-service' }}
      />
    </>
  );
}
