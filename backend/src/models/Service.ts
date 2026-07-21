import mongoose, { Document, Schema } from 'mongoose';

export const SERVICE_CATEGORIES = ['Bridal', 'Traditional', 'Tailoring', 'Boutique'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type ServiceIcon = 'bridal' | 'traditional' | 'tailoring' | 'boutique';

export interface IServiceGalleryImage {
  id: string;
  image: string;
  alt: string;
  title: string;
}

export interface IServiceFeature {
  id: string;
  title: string;
  description: string;
}

export interface IServicePricingTier {
  id: string;
  name: string;
  priceLabel: string;
  detail: string;
}

export interface IServicePricing {
  note: string;
  startingFrom: string;
  tiers: IServicePricingTier[];
}

export interface IService extends Document {
  slug: string;
  title: string;
  category: ServiceCategory;
  summary: string;
  description: string[];
  bannerImage: string;
  bannerAlt: string;
  cardImage: string;
  icon: ServiceIcon;
  gallery: IServiceGalleryImage[];
  features: IServiceFeature[];
  pricing: IServicePricing;
  includes: string[];
  durationNote: string;
  ctaLabel: string;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const galleryImageSchema = new Schema<IServiceGalleryImage>(
  {
    id: { type: String, required: true },
    image: { type: String, required: true },
    alt: { type: String, required: true },
    title: { type: String, required: true },
  },
  { _id: false },
);

const featureSchema = new Schema<IServiceFeature>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const pricingTierSchema = new Schema<IServicePricingTier>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    priceLabel: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false },
);

const serviceSchema = new Schema<IService>(
  {
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: [String], default: [] },
    bannerImage: { type: String, required: true },
    bannerAlt: { type: String, required: true },
    cardImage: { type: String, required: true },
    icon: {
      type: String,
      enum: ['bridal', 'traditional', 'tailoring', 'boutique'],
      default: 'boutique',
    },
    gallery: { type: [galleryImageSchema], default: [] },
    features: { type: [featureSchema], default: [] },
    pricing: {
      note: { type: String, default: '' },
      startingFrom: { type: String, default: '' },
      tiers: { type: [pricingTierSchema], default: [] },
    },
    includes: { type: [String], default: [] },
    durationNote: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Request consultation' },
    published: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

serviceSchema.index({ category: 1, published: 1, sortOrder: 1 });
serviceSchema.index({ title: 'text', summary: 'text' });

export const Service = mongoose.model<IService>('Service', serviceSchema);
