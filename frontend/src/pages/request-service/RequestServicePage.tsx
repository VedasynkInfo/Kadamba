import { PageMeta, staticPageMeta } from '@/seo';
import { PageHero } from '@/components/site';
import { ExpectationsSection } from './sections/ExpectationsSection';
import { RequestFormSection } from './sections';

/**
 * Consultation — the private appointment.
 *
 * One page, three movements: what the visit is, what to expect from it, and the
 * form that begins it. The form itself is the four-step request built in Phase
 * 10; this page now gives it a proper room to sit in.
 */
export default function RequestServicePage() {
  return (
    <>
      <PageMeta {...staticPageMeta.requestService} />
      <PageHero
        eyebrow="Private consultation"
        title="Tell us about"
        accent="your occasion."
        description="A garment begins with a conversation, not a catalogue. Share the date, the idea and the budget, and the studio will prepare for your visit."
        image="/media/placeholders/lehenga.jpg"
        imageAlt="Festive lehenga detail prepared for a personal fitting"
        size="standard"
        facts={[
          { label: 'Appointment', value: '90 minutes' },
          { label: 'At the studio', value: 'Kurnool' },
          { label: 'By video', value: 'Available' },
          { label: 'Estimate', value: 'No obligation' },
        ]}
      />
      <ExpectationsSection />
      <RequestFormSection />
    </>
  );
}
