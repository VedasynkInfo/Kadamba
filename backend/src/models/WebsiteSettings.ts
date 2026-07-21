import mongoose, { Document, Schema } from 'mongoose';

export interface IWebsiteHour {
  day: string;
  time: string;
}

export interface IWebsiteSocial {
  href: string;
  label: string;
}

export interface IWebsiteSettings extends Document {
  key: string;
  studioName: string;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  addressLines: string[];
  hours: IWebsiteHour[];
  whatsappNumber: string;
  whatsappPrefill: string;
  mapEmbedUrl: string;
  mapLink: string;
  social: IWebsiteSocial[];
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

const websiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    studioName: { type: String, required: true },
    location: { type: String, required: true },
    phoneDisplay: { type: String, required: true },
    phoneTel: { type: String, required: true },
    email: { type: String, required: true },
    addressLines: { type: [String], default: [] },
    hours: { type: [hourSchema], default: [] },
    whatsappNumber: { type: String, default: '' },
    whatsappPrefill: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    mapLink: { type: String, default: '' },
    social: { type: [socialSchema], default: [] },
  },
  { timestamps: true },
);

export const WebsiteSettings = mongoose.model<IWebsiteSettings>(
  'WebsiteSettings',
  websiteSettingsSchema,
);
