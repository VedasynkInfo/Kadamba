import mongoose, { Document, Schema } from 'mongoose';

export const GALLERY_CATEGORIES = [
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];
export type GalleryMediaType = 'image' | 'video';

export interface IGalleryItem extends Document {
  slug: string;
  title: string;
  category: GalleryCategory;
  alt: string;
  mediaType: GalleryMediaType;
  src: string;
  poster?: string;
  width: number;
  height: number;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    category: {
      type: String,
      enum: GALLERY_CATEGORIES,
      required: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    src: {
      type: String,
      required: true,
      trim: true,
    },
    poster: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
    published: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

galleryItemSchema.index({ category: 1, published: 1, sortOrder: 1 });
galleryItemSchema.index({ title: 'text', alt: 'text' });

export const GalleryItem = mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema);
