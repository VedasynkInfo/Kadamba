import mongoose, { Document, Schema } from 'mongoose';

export const PORTFOLIO_CATEGORIES = [
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export interface IPortfolioGalleryImage {
  id: string;
  image: string;
  alt: string;
  caption?: string;
}

export interface IPortfolioBeforeAfter {
  beforeImage: string;
  beforeAlt: string;
  afterImage: string;
  afterAlt: string;
  note: string;
}

export interface IPortfolioClientStory {
  quote: string;
  name: string;
  occasion: string;
}

export interface IPortfolio extends Document {
  slug: string;
  title: string;
  category: PortfolioCategory;
  summary: string;
  story: string[];
  year: string;
  location: string;
  bannerImage: string;
  bannerAlt: string;
  coverImage: string;
  coverAlt: string;
  gallery: IPortfolioGalleryImage[];
  beforeAfter?: IPortfolioBeforeAfter;
  clientStory?: IPortfolioClientStory;
  tags: string[];
  ctaLabel: string;
  published: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const galleryImageSchema = new Schema<IPortfolioGalleryImage>(
  {
    id: { type: String, required: true },
    image: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String },
  },
  { _id: false },
);

const beforeAfterSchema = new Schema<IPortfolioBeforeAfter>(
  {
    beforeImage: { type: String, required: true },
    beforeAlt: { type: String, required: true },
    afterImage: { type: String, required: true },
    afterAlt: { type: String, required: true },
    note: { type: String, required: true },
  },
  { _id: false },
);

const clientStorySchema = new Schema<IPortfolioClientStory>(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true },
    occasion: { type: String, required: true },
  },
  { _id: false },
);

const portfolioSchema = new Schema<IPortfolio>(
  {
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, enum: PORTFOLIO_CATEGORIES, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    story: { type: [String], default: [] },
    year: { type: String, default: '' },
    location: { type: String, default: 'Kurnool' },
    bannerImage: { type: String, required: true },
    bannerAlt: { type: String, required: true },
    coverImage: { type: String, required: true },
    coverAlt: { type: String, required: true },
    gallery: { type: [galleryImageSchema], default: [] },
    beforeAfter: { type: beforeAfterSchema, required: false },
    clientStory: { type: clientStorySchema, required: false },
    tags: { type: [String], default: [] },
    ctaLabel: { type: String, default: 'Start your project' },
    published: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterTitle: { type: String, default: '' },
    twitterDescription: { type: String, default: '' },
    twitterImage: { type: String, default: '' },
  },
  { timestamps: true },
);

portfolioSchema.index({ category: 1, published: 1, sortOrder: 1 });
portfolioSchema.index({ title: 'text', summary: 'text', tags: 'text' });

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
