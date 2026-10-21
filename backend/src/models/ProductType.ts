import mongoose, { Document, Schema } from 'mongoose';

export interface IProductType extends Document {
  code: string;
  /** Public, human-readable URL segment (`/products/:slug`). */
  slug?: string;
  name: string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  publicDescription?: string;
  measurementTemplateId?: string; // Code of the linked template (e.g., 'BR-LH')
  active: boolean;
  sortOrder: number;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
      type: String,
      trim: true,
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
