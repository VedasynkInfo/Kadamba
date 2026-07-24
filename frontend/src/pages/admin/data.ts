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
  { to: '/admin/customers', end: false, label: 'Customers' },
  { to: '/admin/products', end: false, label: 'Products' },
  { to: '/admin/orders', end: false, label: 'Orders' },
  { to: '/admin/measurements', end: false, label: 'Measurements' },
  { to: '/admin/invoices', end: false, label: 'Invoices' },
  { to: '/admin/payments', end: false, label: 'Payments' },
  { to: '/admin/staff', end: false, label: 'Staff' },
  { to: '/admin/finance', end: false, label: 'Finance' },
  { to: '/admin/reports', end: false, label: 'Reports' },
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
  customers: {
    title: 'Client directory',
    copy: 'Manage boutique client profiles, address books, tags, and fit histories.',
    actionLabel: 'Add client',
  },
  customersList: {
    title: 'All clients',
    copy: 'Search and filter boutique customer registry.',
    actionLabel: 'Back to directory',
    actionTo: '/admin/customers',
  },
  customerDetail: {
    title: 'Client profile',
    copy: 'Identity, address locality, notes feed, tailoring orders, and fit cards.',
    actionLabel: 'Back to directory',
    actionTo: '/admin/customers',
  },
  products: {
    title: 'Product catalog',
    copy: 'Manage boutique categories, custom garment types, and fitting template connections.',
    actionLabel: 'Add garment',
  },
  productsList: {
    title: 'All garments',
    copy: 'Search and adjust custom garment templates.',
    actionLabel: 'Back to catalog',
    actionTo: '/admin/products',
  },
  orders: {
    title: 'Orders desk',
    copy: 'Oversee workshop production, tailoring queues, trials, and billing.',
    actionLabel: 'Create order',
  },
  ordersList: {
    title: 'All orders',
    copy: 'Search and filter active custom stitching jobs.',
    actionLabel: 'Back to desk',
    actionTo: '/admin/orders',
  },
  orderDetail: {
    title: 'Order detail',
    copy: 'Status, measurements, workshop queue, payments, and timeline.',
    actionLabel: 'All orders',
    actionTo: '/admin/orders',
  },
  settings: {
    title: 'Website settings',
    copy: 'Studio contact, hours, WhatsApp, and social links for the public site.',
    actionLabel: 'Save settings',
  },
  staff: {
    title: 'Staff desk',
    copy: 'Manage studio employees, tailoring specialties, and experience profiles.',
    actionLabel: 'Add staff',
  },
  finance: {
    title: 'Finance desk',
    copy: 'Track orders, payouts, expenses, staff salaries, and Profit & Loss reports.',
    actionLabel: 'View Profit & Loss',
  },
  invoices: {
    title: 'Invoices desk',
    copy: 'Order billing — quoted, partial, and fully paid workshop invoices.',
    actionLabel: 'Open payments',
    actionTo: '/admin/payments',
  },
  payments: {
    title: 'Payments desk',
    copy: 'Monthly revenue received from boutique orders.',
    actionLabel: 'Open invoices',
    actionTo: '/admin/invoices',
  },
  reports: {
    title: 'Reports desk',
    copy: 'Boutique analytics for bridal season — orders, payments received, outstanding balances, and staff workload.',
    actionLabel: 'Open revenue trend',
    actionTo: '/admin/reports/revenue-trend',
  },
  profile: {
    title: 'Your profile',
    copy: 'Account details for the Kadamba studio console.',
    actionLabel: 'Update profile',
  },
} as const;

export interface WebsiteSettings {
  studioName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl: string;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  phoneAltDisplay: string;
  phoneAltTel: string;
  email: string;
  addressLines: string[];
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  hours: { day: string; time: string }[];
  whatsappNumber: string;
  whatsappPrefill: string;
  mapEmbedUrl: string;
  mapLink: string;
  social: { href: string; label: string }[];
  socialNamed: {
    instagram: string;
    facebook: string;
    youtube: string;
    whatsappLink: string;
    googleBusiness: string;
  };
  seo: {
    siteName: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultOgImage: string;
    localityPhrase: string;
    robotsIndex: boolean;
  };
  media: {
    defaultUnit: 'in' | 'cm';
    bannerPresets: Array<{ label: string; width: number; height: number; aspect?: string }>;
    maxUploadBytes: number;
  };
  emailConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    passSet?: boolean;
    fromName: string;
    fromEmail: string;
    adminTo: string;
    templates: Array<{
      key: string;
      subject: string;
      bodyHtml: string;
      bodyText: string;
      updatedAt?: string;
    }>;
  };
  theme: {
    primary: string;
    accent: string;
  };
}

export const defaultWebsiteSettings: WebsiteSettings = {
  studioName: brand.name,
  shortName: brand.shortName,
  tagline: brand.tagline,
  logoUrl: '',
  logoDarkUrl: '',
  location: brand.location,
  phoneDisplay: studioContact.phoneDisplay,
  phoneTel: studioContact.phoneTel,
  phoneAltDisplay: '',
  phoneAltTel: '',
  email: studioContact.email,
  addressLines: [...studioContact.addressLines],
  landmark: '',
  locality: '',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '',
  hours: studioContact.hours.map((h) => ({ ...h })),
  whatsappNumber: studioContact.whatsappNumber,
  whatsappPrefill: studioContact.whatsappPrefill,
  mapEmbedUrl: studioContact.mapEmbedUrl,
  mapLink: studioContact.mapLink,
  social: socialLinks.map((s) => ({ ...s })),
  socialNamed: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    youtube: '',
    whatsappLink: '',
    googleBusiness: '',
  },
  seo: {
    siteName: brand.name,
    titleTemplate: '{{title}} | {{siteName}}',
    defaultDescription: brand.summary,
    defaultOgImage: '',
    localityPhrase: brand.location,
    robotsIndex: true,
  },
  media: {
    defaultUnit: 'in',
    bannerPresets: [
      { label: 'Hero banner', width: 1920, height: 1080, aspect: '16:9' },
      { label: 'Gallery tile', width: 1200, height: 1500, aspect: '4:5' },
      { label: 'OG / share', width: 1200, height: 630, aspect: '1.91:1' },
      { label: 'Portrait lookbook', width: 1080, height: 1350, aspect: '4:5' },
    ],
    maxUploadBytes: 5 * 1024 * 1024,
  },
  emailConfig: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    passSet: false,
    fromName: brand.name,
    fromEmail: '',
    adminTo: '',
    templates: [
      {
        key: 'enquiry_received',
        subject: "We received your consultation request — Kadamba's Designer Studio",
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'order_confirmed',
        subject: 'Order confirmed — Reference {{referenceId}}',
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'measurement_approved',
        subject: "Measurements approved — Kadamba's Designer Studio",
        bodyText: '',
        bodyHtml: '',
      },
      {
        key: 'portal_activate',
        subject: 'Activate your customer portal — Reference {{referenceId}}',
        bodyText: '',
        bodyHtml: '',
      },
    ],
  },
  theme: {
    primary: '#000000',
    accent: '#b59410',
  },
};

export const loginCopy = {
  locationLine: `${brand.location} · Studio console`,
  brandName: brand.shortName,
  headline: 'Sign in to the atelier desk',
  copy: 'Manage lookbook, services, portfolio, journal, and bridal leads.',
} as const;
