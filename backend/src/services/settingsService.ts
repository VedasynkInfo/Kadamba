import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import {
  DEFAULT_BANNER_PRESETS,
  DEFAULT_EMAIL_TEMPLATES,
  WebsiteSettings,
  type IWebsiteSettings,
} from '../models/WebsiteSettings';

const MASK = '••••••••';

const DEFAULT_SETTINGS = {
  key: 'site',
  studioName: "Kadamba's Designer Studio",
  shortName: 'Kadamba',
  tagline: "Kurnool's boutique for women's traditional & bridal wear",
  logoUrl: '',
  logoDarkUrl: '',
  location: 'Kurnool',
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  phoneAltDisplay: '',
  phoneAltTel: '',
  email: 'hello@kadambasstudio.com',
  addressLines: ["Kadamba's Designer Studio", 'Kurnool, Andhra Pradesh', 'India'],
  landmark: '',
  locality: '',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '',
  hours: [
    { day: 'Mon – Sat', time: '10:00 AM – 7:00 PM' },
    { day: 'Sunday', time: 'By appointment' },
  ],
  whatsappNumber: '919876543210',
  whatsappPrefill:
    "Hi Kadamba's Designer Studio — I'd like to enquire about bridal / traditional wear.",
  mapEmbedUrl: '',
  mapLink: 'https://maps.google.com/?q=Kurnool',
  social: [
    { href: 'https://www.instagram.com/', label: 'Instagram' },
    { href: 'https://www.facebook.com/', label: 'Facebook' },
  ],
  socialNamed: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    youtube: '',
    whatsappLink: '',
    googleBusiness: '',
  },
  seo: {
    siteName: "Kadamba's Designer Studio",
    titleTemplate: '{{title}} | {{siteName}}',
    defaultDescription:
      "Kadamba's Designer Studio in Kurnool — boutique and custom tailoring for women's traditional and bridal wear.",
    defaultOgImage: '',
    localityPhrase: 'Kurnool',
    robotsIndex: true,
  },
  media: {
    defaultUnit: 'in' as const,
    bannerPresets: DEFAULT_BANNER_PRESETS,
    maxUploadBytes: 5 * 1024 * 1024,
  },
  emailConfig: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: "Kadamba's Designer Studio",
    fromEmail: '',
    adminTo: '',
    templates: DEFAULT_EMAIL_TEMPLATES,
  },
  theme: {
    primary: '#000000',
    accent: '#b59410',
  },
};

export type SettingsDto = Record<string, unknown> & { id?: string };

function ensureDefaults(doc: IWebsiteSettings): IWebsiteSettings {
  if (!doc.shortName) doc.shortName = DEFAULT_SETTINGS.shortName;
  if (!doc.tagline) doc.tagline = DEFAULT_SETTINGS.tagline;
  if (!doc.seo?.siteName) {
    doc.seo = { ...DEFAULT_SETTINGS.seo, ...(doc.seo || {}) };
  }
  if (!doc.media?.bannerPresets?.length) {
    doc.media = {
      defaultUnit: doc.media?.defaultUnit || 'in',
      bannerPresets: DEFAULT_BANNER_PRESETS,
      maxUploadBytes: doc.media?.maxUploadBytes || 5 * 1024 * 1024,
    };
  }
  if (!doc.emailConfig?.templates?.length) {
    doc.emailConfig = {
      ...(doc.emailConfig || {}),
      host: doc.emailConfig?.host || '',
      port: doc.emailConfig?.port || 587,
      secure: doc.emailConfig?.secure || false,
      user: doc.emailConfig?.user || '',
      pass: doc.emailConfig?.pass || '',
      fromName: doc.emailConfig?.fromName || DEFAULT_SETTINGS.emailConfig.fromName,
      fromEmail: doc.emailConfig?.fromEmail || '',
      adminTo: doc.emailConfig?.adminTo || '',
      templates: DEFAULT_EMAIL_TEMPLATES,
    };
  }
  if (!doc.theme?.primary) {
    doc.theme = { ...DEFAULT_SETTINGS.theme, ...(doc.theme || {}) };
  }
  if (!doc.socialNamed) {
    doc.socialNamed = { ...DEFAULT_SETTINGS.socialNamed };
  }
  return doc;
}

async function getOrCreateDoc(): Promise<IWebsiteSettings> {
  let doc = await WebsiteSettings.findOne({ key: 'site' });
  if (!doc) {
    doc = await WebsiteSettings.create(DEFAULT_SETTINGS);
    return doc;
  }
  const before = JSON.stringify({
    seo: doc.seo?.siteName,
    media: doc.media?.bannerPresets?.length,
    email: doc.emailConfig?.templates?.length,
    theme: doc.theme?.primary,
  });
  ensureDefaults(doc);
  const after = JSON.stringify({
    seo: doc.seo?.siteName,
    media: doc.media?.bannerPresets?.length,
    email: doc.emailConfig?.templates?.length,
    theme: doc.theme?.primary,
  });
  if (before !== after) {
    await doc.save();
  }
  return doc;
}

function maskEmailConfig(emailConfig: IWebsiteSettings['emailConfig'] | undefined) {
  const cfg = emailConfig || DEFAULT_SETTINGS.emailConfig;
  const hasPass = Boolean(cfg.pass && cfg.pass.length > 0);
  return {
    host: cfg.host || '',
    port: cfg.port || 587,
    secure: Boolean(cfg.secure),
    user: cfg.user || '',
    pass: hasPass ? MASK : '',
    passSet: hasPass,
    fromName: cfg.fromName || '',
    fromEmail: cfg.fromEmail || '',
    adminTo: cfg.adminTo || '',
    templates: (cfg.templates || []).map((t) => ({
      key: t.key,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      bodyText: t.bodyText,
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : undefined,
    })),
  };
}

function toPublicDto(doc: IWebsiteSettings): SettingsDto {
  const raw = toDto<SettingsDto>(doc);
  delete raw.key;
  delete raw.emailConfig;
  // Public never sees SMTP
  return {
    id: raw.id,
    studioName: raw.studioName,
    shortName: raw.shortName,
    tagline: raw.tagline,
    logoUrl: raw.logoUrl,
    logoDarkUrl: raw.logoDarkUrl,
    location: raw.location,
    phoneDisplay: raw.phoneDisplay,
    phoneTel: raw.phoneTel,
    phoneAltDisplay: raw.phoneAltDisplay,
    phoneAltTel: raw.phoneAltTel,
    email: raw.email,
    addressLines: raw.addressLines,
    landmark: raw.landmark,
    locality: raw.locality,
    city: raw.city,
    state: raw.state,
    pincode: raw.pincode,
    hours: raw.hours,
    whatsappNumber: raw.whatsappNumber,
    whatsappPrefill: raw.whatsappPrefill,
    mapEmbedUrl: raw.mapEmbedUrl,
    mapLink: raw.mapLink,
    social: raw.social,
    socialNamed: raw.socialNamed,
    seo: raw.seo,
    media: {
      defaultUnit: (raw.media as { defaultUnit?: string })?.defaultUnit || 'in',
      bannerPresets: (raw.media as { bannerPresets?: unknown })?.bannerPresets || [],
      maxUploadBytes: (raw.media as { maxUploadBytes?: number })?.maxUploadBytes,
    },
    theme: raw.theme,
    updatedAt: raw.updatedAt,
  };
}

function toAdminDto(doc: IWebsiteSettings): SettingsDto {
  const publicDto = toPublicDto(doc);
  return {
    ...publicDto,
    emailConfig: maskEmailConfig(doc.emailConfig),
  };
}

export async function getPublicSettings(): Promise<SettingsDto> {
  const doc = await getOrCreateDoc();
  return toPublicDto(doc);
}

/** Alias used by existing public consumers */
export async function getSettings(): Promise<SettingsDto> {
  return getPublicSettings();
}

export async function getAdminSettings(): Promise<SettingsDto> {
  const doc = await getOrCreateDoc();
  return toAdminDto(doc);
}

const GENERAL_KEYS = [
  'studioName',
  'shortName',
  'tagline',
  'logoUrl',
  'logoDarkUrl',
  'location',
  'phoneDisplay',
  'phoneTel',
  'phoneAltDisplay',
  'phoneAltTel',
  'email',
  'addressLines',
  'landmark',
  'locality',
  'city',
  'state',
  'pincode',
  'hours',
  'whatsappNumber',
  'whatsappPrefill',
  'mapEmbedUrl',
  'mapLink',
] as const;

function syncSocialArrayFromNamed(
  named: IWebsiteSettings['socialNamed'],
  existing: IWebsiteSettings['social'],
): IWebsiteSettings['social'] {
  const fromNamed: { href: string; label: string }[] = [];
  if (named?.instagram) fromNamed.push({ href: named.instagram, label: 'Instagram' });
  if (named?.facebook) fromNamed.push({ href: named.facebook, label: 'Facebook' });
  if (named?.youtube) fromNamed.push({ href: named.youtube, label: 'YouTube' });
  if (named?.whatsappLink) fromNamed.push({ href: named.whatsappLink, label: 'WhatsApp' });
  if (named?.googleBusiness) fromNamed.push({ href: named.googleBusiness, label: 'Google Business' });
  if (fromNamed.length) return fromNamed;
  return existing || [];
}

/**
 * Full replace / legacy PUT — used by existing admin UI.
 * Masked password is ignored; empty pass clears only if explicitly `passClear: true`.
 */
export async function updateSettings(input: Record<string, unknown>): Promise<SettingsDto> {
  const doc = await getOrCreateDoc();

  if (input.studioName !== undefined) {
    const name = String(input.studioName || '').trim();
    if (!name) throw new ApiError(400, 'Company name is required');
    doc.studioName = name;
  }

  for (const key of GENERAL_KEYS) {
    if (key === 'studioName') continue;
    if (input[key] !== undefined) {
      (doc as unknown as Record<string, unknown>)[key] = input[key];
    }
  }

  if (input.social !== undefined) doc.social = input.social as IWebsiteSettings['social'];
  if (input.socialNamed !== undefined) {
    doc.socialNamed = {
      ...doc.socialNamed,
      ...(input.socialNamed as IWebsiteSettings['socialNamed']),
    };
    doc.social = syncSocialArrayFromNamed(doc.socialNamed, doc.social);
  }
  if (input.seo !== undefined) {
    doc.seo = { ...doc.seo, ...(input.seo as IWebsiteSettings['seo']) };
  }
  if (input.media !== undefined) {
    doc.media = { ...doc.media, ...(input.media as IWebsiteSettings['media']) };
  }
  if (input.theme !== undefined) {
    doc.theme = { ...doc.theme, ...(input.theme as IWebsiteSettings['theme']) };
  }

  if (input.emailConfig !== undefined) {
    applyEmailConfigPatch(doc, input.emailConfig as Record<string, unknown>);
  }

  await doc.save();
  return toAdminDto(doc);
}

/**
 * Sectioned PATCH — body may include `{ section, ...fields }` or nested keys.
 */
export async function patchSettings(input: Record<string, unknown>): Promise<SettingsDto> {
  const section = typeof input.section === 'string' ? input.section : undefined;
  const payload = (input.data as Record<string, unknown>) || input;

  if (section === 'general') {
    return updateSettings(payload);
  }
  if (section === 'seo') {
    return updateSettings({ seo: payload.seo || payload });
  }
  if (section === 'social') {
    return updateSettings({
      social: payload.social,
      socialNamed: payload.socialNamed || payload,
    });
  }
  if (section === 'media') {
    return updateSettings({ media: payload.media || payload });
  }
  if (section === 'email') {
    return updateSettings({ emailConfig: payload.emailConfig || payload });
  }
  if (section === 'theme') {
    return updateSettings({ theme: payload.theme || payload });
  }

  return updateSettings(payload);
}

function applyEmailConfigPatch(doc: IWebsiteSettings, patch: Record<string, unknown>) {
  const current = doc.emailConfig || { ...DEFAULT_SETTINGS.emailConfig };
  const nextPass =
    patch.pass === undefined || patch.pass === '' || patch.pass === MASK
      ? current.pass
      : String(patch.pass);

  if (patch.passClear === true) {
    current.pass = '';
  } else {
    current.pass = nextPass;
  }

  if (patch.host !== undefined) current.host = String(patch.host);
  if (patch.port !== undefined) current.port = Number(patch.port) || 587;
  if (patch.secure !== undefined) current.secure = Boolean(patch.secure);
  if (patch.user !== undefined) current.user = String(patch.user);
  if (patch.fromName !== undefined) current.fromName = String(patch.fromName);
  if (patch.fromEmail !== undefined) current.fromEmail = String(patch.fromEmail);
  if (patch.adminTo !== undefined) current.adminTo = String(patch.adminTo);
  if (Array.isArray(patch.templates)) {
    current.templates = (patch.templates as IWebsiteSettings['emailConfig']['templates']).map(
      (t) => ({
        ...t,
        updatedAt: new Date(),
      }),
    );
  }

  doc.emailConfig = current;
}

/** Resolve SMTP: settings DB wins when host+user set; else env. */
export async function resolveSmtpConfig(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  adminTo: string;
  fromName: string;
} | null> {
  try {
    const doc = await WebsiteSettings.findOne({ key: 'site' }).lean();
    const cfg = doc?.emailConfig;
    if (cfg?.host && cfg?.user && cfg?.pass) {
      return {
        host: cfg.host,
        port: cfg.port || 587,
        secure: Boolean(cfg.secure) || cfg.port === 465,
        user: cfg.user,
        pass: cfg.pass,
        from: cfg.fromEmail || cfg.user,
        adminTo: cfg.adminTo || cfg.fromEmail || cfg.user,
        fromName: cfg.fromName || "Kadamba's Designer Studio",
      };
    }
  } catch {
    // fall through to env
  }

  const { user, pass, host, port, from, to } = env.email;
  if (!user || !pass || user.startsWith('your_') || pass.startsWith('your_')) {
    return null;
  }
  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from: from || user,
    adminTo: to || user,
    fromName: "Kadamba's Designer Studio",
  };
}

export async function sendTestEmail(to?: string): Promise<{ sent: boolean; to: string }> {
  const smtp = await resolveSmtpConfig();
  if (!smtp) {
    throw new ApiError(400, 'SMTP is not configured. Set host, user, and password in Settings → Email.');
  }

  const recipient = (to || smtp.adminTo || smtp.user).trim();
  if (!recipient) {
    throw new ApiError(400, 'Provide a test recipient email');
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  try {
    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.from}>`,
      to: recipient,
      subject: `SMTP test — Kadamba's Designer Studio`,
      text: `This is a test email from Kadamba's Designer Studio settings.\n\nIf you received this, SMTP is working.`,
      html: `<p>This is a <strong>test email</strong> from Kadamba's Designer Studio settings.</p><p>If you received this, SMTP is working.</p>`,
    });
  } catch (err) {
    logger.warn({ err }, 'SMTP test failed');
    throw new ApiError(400, err instanceof Error ? err.message : 'SMTP test failed');
  }

  return { sent: true, to: recipient };
}

export async function getEmailTemplate(key: string) {
  const doc = await getOrCreateDoc();
  const templates = doc.emailConfig?.templates?.length
    ? doc.emailConfig.templates
    : DEFAULT_EMAIL_TEMPLATES;
  return templates.find((t) => t.key === key) || null;
}

export { DEFAULT_SETTINGS, MASK };
