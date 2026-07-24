import mongoose, { Document, Schema } from 'mongoose';

export interface IProductCategory extends Document {
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productCategorySchema = new Schema<IProductCategory>(
  {
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]+$/, 'Category code can only contain uppercase alphanumeric characters and dashes'],
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 100,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productCategorySchema.index({ sortOrder: 1 });

export const ProductCategory = mongoose.model<IProductCategory>('ProductCategory', productCategorySchema);
