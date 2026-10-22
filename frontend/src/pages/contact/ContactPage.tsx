import { PageMeta, staticPageMeta } from '@/seo';
import { PageHero } from '@/components/site';
import {
  ContactChannelsSection,
  ContactFormSection,
  ContactMapSection,
  ContactSocialSection,
  ContactWhatsAppSection,
} from './sections';

/**
 * Contact — every honest way to reach one room in Kurnool.
 *
 * The page does not end in a second CTA band: the form and the channels are the
 * conversion, and stacking another invitation under them would be noise.
 */
export default function ContactPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.contact} />

      <PageHero
        eyebrow="Contact"
        title="The studio,"
        accent="in Kurnool."
        description="Near Main Road. By appointment, Monday to Saturday. If you are travelling from another city, tell us the days you will be here and we will plan the fitting around them."
        image="/media/placeholders/boutique.jpg"
        imageAlt="The boutique entrance, framed by a warm arch"
        facts={[
          { label: 'Open', value: 'Mon – Sat' },
          { label: 'Hours', value: '10 – 7' },
          { label: 'Visits', value: 'By appointment' },
          { label: 'Response', value: 'One working day' },
        ]}
      />

      <ContactChannelsSection />
      <ContactFormSection />
      <ContactWhatsAppSection />
      <ContactMapSection />
      <ContactSocialSection />
    </>
  );
}
