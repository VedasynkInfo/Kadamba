import { brand } from '@/pages/home/data';
import { studioContact, socialLinks } from '@/pages/contact/data';

export { brand };

/** Horizon console filmstrip — atelier still, not a marketing hero. */
export const adminHorizonMedia = {
  image:
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=2400&q=80',
  alt: 'Fabric folds and atelier tools on a studio worktable',
} as const;

export const adminNav = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/gallery', end: false, label: 'Gallery' },
  { to: '/admin/services', end: false, label: 'Services' },
  { to: '/admin/portfolio', end: false, label: 'Portfolio' },
  { to: '/admin/blogs', end: false, label: 'Blogs' },
  { to: '/admin/leads', end: false, label: 'Leads' },
  { to: '/admin/settings', end: false, label: 'Settings' },
  { to: '/admin/profile', end: false, label: 'Profile' },
] as const;

export const adminBanners = {
  dashboard: {
    title: 'Studio console',
    copy: 'Oversee bridal enquiries, lookbook assets, and boutique content from one quiet desk.',
    actionLabel: 'Open leads',
    actionTo: '/admin/leads',
  },
  gallery: {
    title: 'Gallery desk',
    copy: 'Publish bridal, traditional, and atelier frames for the lookbook.',
    actionLabel: 'Add media',
  },
  services: {
    title: 'Services desk',
    copy: 'Shape bridal wear, traditional collections, and custom tailoring offers.',
    actionLabel: 'Add service',
  },
  portfolio: {
    title: 'Portfolio desk',
    copy: 'Archive fittings, before/after stories, and client celebrations.',
    actionLabel: 'Add project',
  },
  blogs: {
    title: 'Journal desk',
    copy: 'Draft studio notes on bridal prep, fabric, and fitting care.',
    actionLabel: 'New post',
  },
  leads: {
    title: 'Leads desk',
    copy: 'Track bridal and traditional enquiries from first message to fitting.',
    actionLabel: 'All leads',
    actionTo: '/admin/leads/list',
  },
  leadsList: {
    title: 'All leads',
    copy: 'Search, filter, and export the boutique pipeline.',
    actionLabel: 'Back to desk',
    actionTo: '/admin/leads',
  },
  leadDetail: {
    title: 'Lead detail',
    copy: 'Status, notes, and timeline for one atelier enquiry.',
    actionLabel: 'All leads',
    actionTo: '/admin/leads/list',
  },
  settings: {
    title: 'Website settings',
    copy: 'Studio contact, hours, WhatsApp, and social links for the public site.',
    actionLabel: 'Save settings',
  },
  profile: {
    title: 'Your profile',
    copy: 'Account details for the Kadamba studio console.',
    actionLabel: 'Update profile',
  },
} as const;

export interface WebsiteSettings {
  studioName: string;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  addressLines: string[];
  hours: { day: string; time: string }[];
  whatsappNumber: string;
  whatsappPrefill: string;
  mapEmbedUrl: string;
  mapLink: string;
  social: { href: string; label: string }[];
}

export const defaultWebsiteSettings: WebsiteSettings = {
  studioName: brand.name,
  location: brand.location,
  phoneDisplay: studioContact.phoneDisplay,
  phoneTel: studioContact.phoneTel,
  email: studioContact.email,
  addressLines: [...studioContact.addressLines],
  hours: studioContact.hours.map((h) => ({ ...h })),
  whatsappNumber: studioContact.whatsappNumber,
  whatsappPrefill: studioContact.whatsappPrefill,
  mapEmbedUrl: studioContact.mapEmbedUrl,
  mapLink: studioContact.mapLink,
  social: socialLinks.map((s) => ({ ...s })),
};

export const loginCopy = {
  locationLine: `${brand.location} · Studio console`,
  brandName: brand.shortName,
  headline: 'Sign in to the atelier desk',
  copy: 'Manage lookbook, services, portfolio, journal, and bridal leads.',
} as const;
