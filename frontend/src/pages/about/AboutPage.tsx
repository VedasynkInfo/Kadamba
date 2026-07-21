import { PageMeta, staticPageMeta } from '@/seo';
import {
  AboutCtaSection,
  AboutHeroSection,
  AchievementsSection,
  StudioStorySection,
  TeamSection,
  TimelineSection,
  ValuesSection,
  VisionMissionSection,
} from './sections';

/**
 * Phase 4 About page — boutique story, values, team, and CTA.
 */
export default function AboutPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.about} />
      <AboutHeroSection />
      <StudioStorySection />
      <VisionMissionSection />
      <ValuesSection />
      <TimelineSection />
      <TeamSection />
      <AchievementsSection />
      <AboutCtaSection />
    </>
  );
}
