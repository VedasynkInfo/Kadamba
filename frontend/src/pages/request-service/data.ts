import { brand } from '@/pages/home/data';
import { serviceDetails } from '@/pages/services/data';
import { whatsappHref } from '@/pages/contact/data';

export { brand, whatsappHref };

/** Soft fabric detail for the split invitation banner. */
const bannerImage =
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=80';

/**
 * Request Service banner — personal atelier invitation (split, compact).
 * Intentionally not a full-viewport left-stack or centered Contact hero.
 */
export const requestBanner = {
  image: bannerImage,
  alt: 'Festive lehenga detail prepared for a personal fitting',
  brandName: brand.shortName,
  locationLine: `${brand.location} · Private consultation`,
  headline: 'Tell us about your occasion',
  copy: 'Share measurements timing, the look you love, and we will prepare your bridal or traditional fitting in Kurnool.',
  scrollHint: 'Begin below',
} as const;

export const formSteps = [
  { id: 'you', label: 'You', description: 'How we reach you' },
  { id: 'occasion', label: 'Occasion', description: 'What you need' },
  { id: 'inspiration', label: 'Inspiration', description: 'Looks & notes' },
  { id: 'review', label: 'Review', description: 'Confirm & send' },
] as const;

export type FormStepId = (typeof formSteps)[number]['id'];

export const serviceOptions = serviceDetails.map((s) => ({
  value: s.slug,
  label: s.title,
}));

export const occasionOptions = [
  { value: 'wedding-bridal', label: 'Wedding / bridal' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'festival', label: 'Festival / festive' },
  { value: 'family-function', label: 'Family function' },
  { value: 'custom-everyday', label: 'Custom everyday wear' },
  { value: 'other', label: 'Other' },
] as const;

export const budgetOptions = [
  { value: 'under-15k', label: 'Under ₹15,000' },
  { value: '15k-30k', label: '₹15,000 – ₹30,000' },
  { value: '30k-50k', label: '₹30,000 – ₹50,000' },
  { value: '50k-plus', label: '₹50,000+' },
  { value: 'discuss', label: 'Prefer to discuss' },
] as const;

export const formCopy = {
  title: 'Request a consultation',
  lede: 'Four short steps — we use this to prepare your visit to Kadamba\'s Designer Studio.',
  trustLine: `${brand.location} · Measurements · Trials · Finishing`,
  successTitle: 'Request received',
  successBody:
    'Thank you. Our atelier will review your details and get back to you for a fitting in Kurnool.',
  successWhatsApp: 'Prefer WhatsApp instead?',
  maxImages: 4,
  maxImageMb: 5,
} as const;

export function serviceLabelFromSlug(slug: string): string {
  return serviceOptions.find((o) => o.value === slug)?.label ?? slug;
}

export function occasionLabelFromValue(value: string): string {
  return occasionOptions.find((o) => o.value === value)?.label ?? value;
}

export function budgetLabelFromValue(value: string): string {
  return budgetOptions.find((o) => o.value === value)?.label ?? value;
}
