import { JsonLd, PageMeta, itemListJsonLd, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
import { ServicesAuthenticitySection, ServicesCatalogSection } from './sections';

/**
 * Services — the four disciplines, and what each one actually includes.
 */
export default function ServicesPage() {
  const { services } = usePublicContent();

  return (
    <>
      <PageMeta {...staticPageMeta.services} />
      {services.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: 'Kadamba services',
            items: services.map((service) => ({
              name: service.title,
              path: `/services/${service.slug}`,
            })),
          })}
        />
      ) : null}

      <PageHero
        variant="split"
        eyebrow="What we make"
        title="The work,"
        accent="in four disciplines."
        description="Bridal couture, traditional wear, bespoke tailoring and boutique styling. Different calendars, different cloths, the same table and the same fitter."
        image="/media/photos/bridal-window.jpg"
        imageAlt="Bride by the window in a red and gold lehenga"
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
        image="/media/photos/bridal-seated.jpg"
        action={{ label: 'Ask the studio', to: '/request-service' }}
      />
    </>
  );
}
