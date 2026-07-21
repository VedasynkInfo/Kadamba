import { PageMeta, staticPageMeta } from '@/seo';
import {
  ContactBannerSection,
  ContactChannelsSection,
  ContactFormSection,
  ContactMapSection,
  ContactSocialSection,
  ContactWhatsAppSection,
} from './sections';

/**
 * Phase 9 Contact — banner, channels, form, map, WhatsApp, social.
 */
export default function ContactPage() {
  return (
    <>
      <PageMeta {...staticPageMeta.contact} />
      <ContactBannerSection />
      <ContactChannelsSection />
      <ContactFormSection />
      <ContactWhatsAppSection />
      <ContactMapSection />
      <ContactSocialSection />
    </>
  );
}
