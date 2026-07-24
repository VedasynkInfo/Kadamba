import { JsonLd, PageMeta, localBusinessJsonLd, staticPageMeta } from '@/seo';
import {
  CtaBannerSection,
  FeaturedCollectionsSection,
  HeroSection,
  HowItWorksPortalSection,
  LatestBlogsSection,
  MarqueeSection,
  ProcessTimelineSection,
  ServicesSection,
  StatisticsSection,
  TestimonialsSection,
  WhyChooseUsSection,
} from './sections';

/**
 * Phase 3 luxury home experience — section stack with GSAP + Framer Motion.
 */
export default function HomePage() {
  return (
    <>
      <PageMeta {...staticPageMeta.home} />
      <JsonLd data={localBusinessJsonLd()} />
      <HeroSection />
      <ServicesSection />
      <FeaturedCollectionsSection />
      <MarqueeSection />
      <TestimonialsSection />
      <WhyChooseUsSection />
      <HowItWorksPortalSection />
      <ProcessTimelineSection />
      <StatisticsSection />
      <LatestBlogsSection />
      <CtaBannerSection />
    </>
  );
}
