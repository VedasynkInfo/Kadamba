import { PageMeta, staticPageMeta } from '@/seo';
import { RequestBannerSection, RequestFormSection } from './sections';

/**
 * Phase 10 — Request Service: personal invitation banner + multi-step lead form.
 */
export default function RequestServicePage() {
  return (
    <>
      <PageMeta {...staticPageMeta.requestService} />
      <RequestBannerSection />
      <RequestFormSection />
    </>
  );
}
