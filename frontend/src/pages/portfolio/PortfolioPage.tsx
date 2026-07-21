import { PageMeta, staticPageMeta } from '@/seo';
import {
  PortfolioCatalogSection,
  PortfolioCtaSection,
  PortfolioHeroSection,
} from './sections';

/**
 * Phase 7 Portfolio listing — editorial hero, filters, and project grid.
 */
export default function PortfolioPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.portfolio} />
      <PortfolioHeroSection />
      <PortfolioCatalogSection />
      <PortfolioCtaSection />
    </>
  );
}
