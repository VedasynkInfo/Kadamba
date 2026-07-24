import mongoose, { Document, Schema } from 'mongoose';

export interface IWebsiteHour {
  day: string;
  time: string;
}

export interface IWebsiteSocial {
  href: string;
  label: string;
}

export interface IBannerPreset {
  label: string;
  width: number;
  height: number;
  aspect?: string;
}

export interface IEmailTemplate {
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  updatedAt?: Date;
}

export interface IWebsiteSettings extends Document {
  key: string;
  /** General / identity */
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
  hours: IWebsiteHour[];
  whatsappNumber: string;
  whatsappPrefill: string;
  mapEmbedUrl: string;
  mapLink: string;
  social: IWebsiteSocial[];
  /** Named social shortcuts (also mirrored into social[] for footer) */
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
    bannerPresets: IBannerPreset[];
    maxUploadBytes: number;
  };
  emailConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    /** Stored secret — never returned plain in API */
    pass: string;
    fromName: string;
    fromEmail: string;
    adminTo: string;
    templates: IEmailTemplate[];
  };
  theme: {
    primary: string;
    accent: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const hourSchema = new Schema<IWebsiteHour>(
  {
    day: { type: String, required: true },
    time: { type: String, required: true },
  },
  { _id: false },
);

const socialSchema = new Schema<IWebsiteSocial>(
  {
    href: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const bannerPresetSchema = new Schema<IBannerPreset>(
  {
    label: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    aspect: { type: String },
  },
  { _id: false },
);

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    updatedAt: { type: Date },
  },
  { _id: false },
);

export const DEFAULT_EMAIL_TEMPLATES: IEmailTemplate[] = [
  {
    key: 'enquiry_received',
    subject: "We received your consultation request — Kadamba's Designer Studio",
    bodyText:
      "Hi {{name}},\n\nThank you for requesting a consultation with Kadamba's Designer Studio in Kurnool.\n\n— Kadamba's Designer Studio",
    bodyHtml:
      "<p>Hi {{name}},</p><p>Thank you for requesting a consultation with <strong>Kadamba's Designer Studio</strong> in Kurnool.</p><p>— Kadamba's Designer Studio</p>",
  },
  {
    key: 'order_confirmed',
    subject: 'Order confirmed — Reference {{referenceId}} · Kadamba\'s Designer Studio',
    bodyText:
      'Dear {{name}},\n\nYour order is confirmed.\nReference ID: {{referenceId}}\nActivate portal: {{activateUrl}}\n\n— Kadamba\'s Designer Studio, Kurnool',
    bodyHtml:
      '<p>Dear {{name}},</p><p>Your order is confirmed.</p><p>Reference ID: <strong>{{referenceId}}</strong></p><p><a href="{{activateUrl}}">Activate your customer portal</a></p><p>— Kadamba\'s Designer Studio, Kurnool</p>',
  },
  {
    key: 'measurement_approved',
    subject: "Measurements approved — Kadamba's Designer Studio",
    bodyText:
      "Hi {{name}},\n\nYour measurements for \"{{profileName}}\" have been approved.\n\n— Kadamba's Designer Studio",
    bodyHtml:
      '<p>Hi {{name}},</p><p>Your measurements for <strong>{{profileName}}</strong> have been approved.</p><p>— Kadamba\'s Designer Studio</p>',
  },
  {
    key: 'portal_activate',
    subject: 'Activate your customer portal — Reference {{referenceId}}',
    bodyText:
      'Hi {{name}},\n\nUse Reference ID {{referenceId}} to activate your portal:\n{{activateUrl}}\n\n— Kadamba\'s Designer Studio',
    bodyHtml:
      '<p>Hi {{name}},</p><p>Use Reference ID <strong>{{referenceId}}</strong> to <a href="{{activateUrl}}">activate your portal</a>.</p><p>— Kadamba\'s Designer Studio</p>',
  },
];

export const DEFAULT_BANNER_PRESETS: IBannerPreset[] = [
  { label: 'Hero banner', width: 1920, height: 1080, aspect: '16:9' },
  { label: 'Gallery tile', width: 1200, height: 1500, aspect: '4:5' },
  { label: 'OG / share', width: 1200, height: 630, aspect: '1.91:1' },
  { label: 'Portrait lookbook', width: 1080, height: 1350, aspect: '4:5' },
];

const websiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    studioName: { type: String, required: true },
    shortName: { type: String, default: 'Kadamba' },
    tagline: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    logoDarkUrl: { type: String, default: '' },
    location: { type: String, required: true },
    phoneDisplay: { type: String, required: true },
    phoneTel: { type: String, required: true },
    phoneAltDisplay: { type: String, default: '' },
    phoneAltTel: { type: String, default: '' },
    email: { type: String, required: true },
    addressLines: { type: [String], default: [] },
    landmark: { type: String, default: '' },
    locality: { type: String, default: '' },
    city: { type: String, default: 'Kurnool' },
    state: { type: String, default: 'Andhra Pradesh' },
    pincode: { type: String, default: '' },
    hours: { type: [hourSchema], default: [] },
    whatsappNumber: { type: String, default: '' },
    whatsappPrefill: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    mapLink: { type: String, default: '' },
    social: { type: [socialSchema], default: [] },
    socialNamed: {
      type: new Schema(
        {
          instagram: { type: String, default: '' },
          facebook: { type: String, default: '' },
          youtube: { type: String, default: '' },
          whatsappLink: { type: String, default: '' },
          googleBusiness: { type: String, default: '' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    seo: {
      type: new Schema(
        {
          siteName: { type: String, default: '' },
          titleTemplate: { type: String, default: '{{title}} | {{siteName}}' },
          defaultDescription: { type: String, default: '' },
          defaultOgImage: { type: String, default: '' },
          localityPhrase: { type: String, default: 'Kurnool' },
          robotsIndex: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    media: {
      type: new Schema(
        {
          defaultUnit: { type: String, enum: ['in', 'cm'], default: 'in' },
          bannerPresets: { type: [bannerPresetSchema], default: [] },
          maxUploadBytes: { type: Number, default: 5 * 1024 * 1024 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    emailConfig: {
      type: new Schema(
        {
          host: { type: String, default: '' },
          port: { type: Number, default: 587 },
          secure: { type: Boolean, default: false },
          user: { type: String, default: '' },
          pass: { type: String, default: '' },
          fromName: { type: String, default: '' },
          fromEmail: { type: String, default: '' },
          adminTo: { type: String, default: '' },
          templates: { type: [emailTemplateSchema], default: [] },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    theme: {
      type: new Schema(
        {
          primary: { type: String, default: '#000000' },
          accent: { type: String, default: '#b59410' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export const WebsiteSettings = mongoose.model<IWebsiteSettings>(
  'WebsiteSettings',
  websiteSettingsSchema,
);
