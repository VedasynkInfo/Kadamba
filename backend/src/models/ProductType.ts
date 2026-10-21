import mongoose, { Document, Schema } from 'mongoose';

export interface IProductGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface IProductVariant {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
  active: boolean;
}

export interface IProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface IProductType extends Document {
  code: string;
  /** Public, human-readable URL segment (`/products/:slug`). */
  slug?: string;
  name: string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  publicDescription?: string;
  /**
   * A real reference to the fit card used for this garment.
   *
   * Older records stored the template *code* here. `data:backfill-product-template-refs`
   * converts them, and the service accepts a code on write for API/CSV
   * compatibility.
   */
  measurementTemplateId?: mongoose.Types.ObjectId;
  /** Ordered storefront gallery. `image` remains the selected cover. */
  gallery: IProductGalleryImage[];
  variants: IProductVariant[];
  leadTimeDays?: number;
  leadTimeNote?: string;
  tags: string[];
  featured: boolean;
  seo?: IProductSeo;
  /** Inventory seam: deliberately stored, not yet exposed in the console. */
  sku?: string;
  /** Inventory seam: deliberately stored, not yet connected to stock moves. */
  stockItem?: string;
  active: boolean;
  sortOrder: number;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const galleryImageSchema = new Schema<IProductGalleryImage>(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 250, default: '' },
  },
  { _id: false },
);

const variantSchema = new Schema<IProductVariant>(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    priceRange: { type: String, trim: true, maxlength: 100 },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const seoSchema = new Schema<IProductSeo>(
  {
    metaTitle: { type: String, trim: true, maxlength: 180 },
    metaDescription: { type: String, trim: true, maxlength: 320 },
    ogTitle: { type: String, trim: true, maxlength: 180 },
    ogDescription: { type: String, trim: true, maxlength: 320 },
    ogImage: { type: String, trim: true },
    twitterTitle: { type: String, trim: true, maxlength: 180 },
    twitterDescription: { type: String, trim: true, maxlength: 320 },
    twitterImage: { type: String, trim: true },
  },
  { _id: false },
);

const productTypeSchema = new Schema<IProductType>(
  {
    code: {
      type: String,
      required: [true, 'Product type code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9-]+$/,
        'Product type code can only contain uppercase alphanumeric characters and dashes',
      ],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      // Sparse keeps documents created before Phase 8 valid while the new
      // public route backfills them lazily.
      index: { unique: true, sparse: true },
    },
    name: {
      type: String,
      required: [true, 'Product type name is required'],
      trim: true,
      maxlength: 100,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Category ID is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    publicDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    measurementTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'MeasurementTemplate',
      index: true,
    },
    gallery: {
      type: [galleryImageSchema],
      default: [],
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    leadTimeDays: {
      type: Number,
      min: 0,
      max: 365,
    },
    leadTimeNote: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    tags: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    seo: {
      type: seoSchema,
      default: undefined,
    },
    sku: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    stockItem: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    indicativePriceRange: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    defaultStages: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

productTypeSchema.index({ categoryId: 1, active: -1 });
productTypeSchema.index({ sortOrder: 1 });

export const ProductType = mongoose.model<IProductType>('ProductType', productTypeSchema);
