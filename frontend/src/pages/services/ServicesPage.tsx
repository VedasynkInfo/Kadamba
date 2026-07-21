import { PageMeta, staticPageMeta } from '@/seo';
import {
  ServicesAuthenticitySection,
  ServicesCatalogSection,
  ServicesCtaSection,
  ServicesHeroSection,
} from './sections';

/**
 * Phase 5 Services listing — ethnic-classical hero, authenticity, catalog, CTA.
 */
export default function ServicesPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.services} />
      <ServicesHeroSection />
      <ServicesAuthenticitySection />
      <ServicesCatalogSection />
      <ServicesCtaSection />
    </>
  );
}
