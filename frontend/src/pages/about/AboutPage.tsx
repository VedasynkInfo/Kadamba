import { PageMeta, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import {
  AchievementsSection,
  StudioStorySection,
  TeamSection,
  TimelineSection,
  ValuesSection,
  VisionMissionSection,
} from './sections';

/**
 * About — the house, told plainly.
 *
 * The hero is now the same instrument as every other interior page, so the site
 * reads as one publication rather than seven templates. The story, the values,
 * the timeline and the people follow in that order: who we are, what we hold to,
 * how we got here, who does the work.
 */
export default function AboutPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.about} />

      <PageHero
        eyebrow="About the house"
        title="Fifteen years"
        accent="in one room."
        description="Kadamba is a boutique and tailoring house in Kurnool. We dress women for weddings, festivals and the days a family remembers — and we make every garment here."
        image="/media/placeholders/bridal.jpg"
        imageAlt="Bridal silk with a hand-worked border"
        facts={[
          { label: 'In Kurnool', value: '15+ years' },
          { label: 'Garments', value: '2,500+' },
          { label: 'Bridal', value: '800+' },
          { label: 'Returning', value: '95%' },
        ]}
      />

      <StudioStorySection />
      <VisionMissionSection />
      <ValuesSection />
      <TimelineSection />
      <TeamSection />
      <AchievementsSection />

      <CtaBand
        eyebrow="Visit"
        title="The kettle is on."
        accent="The table is clear."
        copy="Come and see the cloth in daylight, bring the photographs you have saved, and leave with an honest answer about what is possible before your date."
        image="/media/placeholders/boutique.jpg"
        action={{ label: 'Book a visit', to: '/request-service' }}
      />
    </>
  );
}
