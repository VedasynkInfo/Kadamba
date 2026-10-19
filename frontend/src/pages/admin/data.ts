import { brand } from '@/pages/home/data';
import { studioContact, socialLinks } from '@/pages/contact/data';
import { DEFAULT_THEME_TOKENS } from '@/theme/palettes';

export { brand };

/** Horizon console filmstrip — atelier still, not a marketing hero. */
export const adminHorizonMedia = {
  image:
    '/media/placeholders/fabric.jpg',
  alt: 'Fabric folds and atelier tools on a studio worktable',
} as const;

export const adminNav = [
  { to: '/admin', end: true, label: 'Dashboard', permission: 'orders:read' },
  { to: '/admin/gallery', end: false, label: 'Gallery', permission: 'content:write' },
  { to: '/admin/services', end: false, label: 'Services', permission: 'content:write' },
  { to: '/admin/portfolio', end: false, label: 'Portfolio', permission: 'content:write' },
  { to: '/admin/blogs', end: false, label: 'Blogs', permission: 'content:write' },
  { to: '/admin/leads', end: false, label: 'Leads', permission: 'leads:read' },
  { to: '/admin/customers', end: false, label: 'Customers', permission: 'customers:read' },
  { to: '/admin/products', end: false, label: 'Products', permission: 'catalog:read' },
  { to: '/admin/orders', end: false, label: 'Orders', permission: 'orders:read' },
  { to: '/admin/measurements', end: false, label: 'Measurements', permission: 'measurements:read' },
  { to: '/admin/invoices', end: false, label: 'Invoices', permission: 'finance:read' },
  { to: '/admin/payments', end: false, label: 'Payments', permission: 'finance:read' },
  { to: '/admin/staff', end: false, label: 'Staff', permission: 'staff:read' },
  { to: '/admin/finance', end: false, label: 'Finance', permission: 'finance:read' },
  { to: '/admin/reports', end: false, label: 'Reports', permission: 'reports:read' },
  { to: '/admin/users', end: false, label: 'Users & Roles', permission: 'users:manage' },
  { to: '/admin/audit', end: false, label: 'Audit Log', permission: 'audit:read' },
  { to: '/admin/media', end: false, label: 'Media', permission: 'media:read' },
  { to: '/admin/settings', end: false, label: 'Settings', permission: 'content:write' },
  { to: '/admin/profile', end: false, label: 'Profile', permission: null },
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
    primaryHover?: string;
    primaryText?: string;
    accent: string;
    publicBg?: string;
    publicText?: string;
    publicCard?: string;
    publicCardText?: string;
    publicSurface?: string;
    adminBg?: string;
    adminText?: string;
    adminCard?: string;
    adminCardText?: string;
    adminSidebar?: string;
    adminSidebarText?: string;
    adminPrimary?: string;
    adminPrimaryText?: string;
    adminAccent?: string;
    fontFamily?: string;
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
  // `palettes.ts` takes the `WebsiteSettings` type back from this module; the
  // type-only import is erased at build time, so this value edge is one-way in
  // the bundle and the apparent cycle is harmless.
  theme: DEFAULT_THEME_TOKENS,
};

export const loginCopy = {
  locationLine: `${brand.location} · Studio console`,
  brandName: brand.shortName,
  headline: 'Sign in to the atelier desk',
  copy: 'Manage lookbook, services, portfolio, journal, and bridal leads.',
} as const;
