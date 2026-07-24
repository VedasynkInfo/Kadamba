import mongoose, { Document, Schema } from 'mongoose';

export const BLOG_CATEGORIES = ['Bridal', 'Traditional', 'Tailoring', 'Studio Notes'] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface IBlog extends Document {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogCategory;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  date: Date;
  readMinutes: number;
  author: string;
  featured: boolean;
  published: boolean;
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

const blogSchema = new Schema<IBlog>(
  {
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: [String], default: [] },
    category: { type: String, enum: BLOG_CATEGORIES, required: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, required: true },
    coverAlt: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    readMinutes: { type: Number, default: 5, min: 1 },
    author: { type: String, default: "Kadamba's Designer Studio" },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
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

blogSchema.index({ category: 1, published: 1, date: -1 });
blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
