import { brand } from '@/pages/home/data';
import { whatsappDeepLink } from '@/utils/whatsapp';

export { brand };

/** Atelier / visit imagery — placeholders until studio photography is wired. */
const img = {
  banner:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=2400&q=80',
  visit:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
};

/**
 * Contact hero — centered invitation composition (not the left-stack heroes on older pages).
 */
export const contactBanner = {
  image: img.banner,
  alt: 'Hand-finished fabric and embroidery details at the boutique',
  locationLine: `${brand.location} · Boutique & Tailoring`,
  brandName: brand.shortName,
  headline: 'Visit us for a fitting',
  copy: 'Measurements, trials, and bridal guidance — reach the studio by form, WhatsApp, or in person.',
  primaryCta: 'Send a message',
  secondaryCta: 'Chat on WhatsApp',
} as const;

export const studioContact = {
  title: 'Studio details',
  lede: 'Personal service for traditional and bridal wear — we respond during boutique hours.',
  addressLines: ['Kadamba\'s Designer Studio', 'Kurnool, Andhra Pradesh', 'India'],
  /** Update with the live studio number when confirmed. */
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  email: 'hello@kadambastudio.com',
  hours: [
    { day: 'Mon – Sat', time: '10:00 AM – 7:00 PM' },
    { day: 'Sunday', time: 'By appointment' },
  ],
  mapEmbedUrl:
    'https://maps.google.com/maps?q=Kurnool%2C%20Andhra%20Pradesh&z=13&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Kurnool%2C+Andhra+Pradesh',
  whatsappNumber: '919876543210',
  whatsappPrefill:
    "Hi Kadamba's Designer Studio — I'd like to enquire about traditional / bridal wear.",
} as const;

export function whatsappHref(prefill: string = studioContact.whatsappPrefill): string {
  return whatsappDeepLink(studioContact.whatsappNumber, prefill);
}

export const contactFormCopy = {
  title: 'Write to the studio',
  lede: 'Share your occasion and preferred look — we will reply with next steps for a consultation in Kurnool.',
  successTitle: 'Message received',
  successBody:
    'Thank you. Our team will get back to you shortly on phone or email.',
} as const;

export const whatsappBanner = {
  eyebrow: 'Prefer a quick chat?',
  title: 'Message us on WhatsApp',
  description:
    'Ask about bridal fittings, fabric choices, or appointment timings — we reply during studio hours.',
  cta: 'Open WhatsApp',
  image: img.visit,
  imageAlt: 'Boutique interior with curated traditional wear',
} as const;

export const socialLinks = [
  { href: 'https://www.instagram.com/', label: 'Instagram' },
  { href: 'https://www.facebook.com/', label: 'Facebook' },
  { href: 'https://www.pinterest.com/', label: 'Pinterest' },
] as const;

export const channelsIntro = {
  title: 'Ways to reach us',
  lede: 'Call, email, WhatsApp, or visit the boutique — choose what feels easiest.',
} as const;
