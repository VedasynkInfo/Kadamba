import { JsonLd, PageMeta, localBusinessJsonLd, staticPageMeta } from '@/seo';
import {
  CtaBannerSection,
  EnquirySection,
  FabricsSection,
  FeaturedCollectionsSection,
  HeroSection,
  HowItWorksPortalSection,
  KurnoolSection,
  LatestBlogsSection,
  MarqueeSection,
  ProcessTimelineSection,
  ServicesSection,
  StatisticsSection,
  StudioSection,
  TestimonialsSection,
  WhyChooseUsSection,
} from './sections';

/**
 * The home page: fifteen sections, in the order a visit should read them.
 *
 *  1.  Hero — what the studio is
 *  2.  Services — what it makes
 *  3.  Featured collections — the work
 *  4.  Marquee — the names of the craft
 *  5.  Testimonials — the city's word
 *  6.  Why choose us — the difference
 *  7.  How the portal works — after the order
 *  8. Process — the way through
 *  9.  Statistics — the record
 * 10. The atelier — who does the work
 * 11. The cloth — what it is cut from
 * 12. Kurnool — why here
 * 13. Latest writing — the journal
 * 14. Enquiry — start a conversation
 * 15. Closing call to action
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
      <StudioSection />
      <FabricsSection />
      <KurnoolSection />
      <LatestBlogsSection />
      <EnquirySection />
      <CtaBannerSection />
    </>
  );
}
