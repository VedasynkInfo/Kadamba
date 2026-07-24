import { PageMeta, staticPageMeta } from '@/seo';
import { HowItWorksPortalSection } from '@/pages/home/sections';
import { RequestBannerSection, RequestFormSection } from './sections';

/**
 * Phase 10 — Request Service: personal invitation banner + multi-step lead form.
 */
export default function RequestServicePage() {
  return (
    <>
      <PageMeta {...staticPageMeta.requestService} />
      <RequestBannerSection />
      <HowItWorksPortalSection />
      <RequestFormSection />
    </>
  );
}
