import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const IMAGE_VARIANT_FORMATS = ['avif', 'webp', 'jpeg'] as const;
export type ImageVariantFormat = (typeof IMAGE_VARIANT_FORMATS)[number];

export interface ImageVariant {
  width: number;
  format: ImageVariantFormat;
  /** Public `/uploads/optimized/...` URL. */
  url: string;
  bytes: number;
}

export interface IImageAsset {
  _id: Types.ObjectId;
  /** sha256 of the original bytes — the identity of the asset. */
  hash: string;
  kind: 'image' | 'video';
  originalUrl: string;
  originalName?: string;
  mimeType: string;
  /** Source format as reported by libvips (jpeg, png, webp, avif, gif, mp4…). */
  format?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  /** Size of the original on disk. */
  bytes?: number;
  /** Tiny progressive placeholder. */
  blurhash?: string;
  /** Average colour, used as a placeholder background to hold CLS at 0. */
  dominantColor?: string;
  /** Video poster frame (originals are never re-encoded). */
  posterUrl?: string;
  variants: ImageVariant[];
  alt?: string;
  /** Who uploaded it and where it was filed. */
  folder?: string;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<ImageVariant>(
  {
    width: { type: Number, required: true },
    format: { type: String, enum: IMAGE_VARIANT_FORMATS, required: true },
    url: { type: String, required: true },
    bytes: { type: Number, default: 0 },
  },
  { _id: false },
);

const imageAssetSchema = new Schema<IImageAsset>(
  {
    hash: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['image', 'video'], default: 'image', index: true },
    originalUrl: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String, required: true },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    aspectRatio: { type: Number },
    bytes: { type: Number },
    blurhash: { type: String },
    dominantColor: { type: String },
    posterUrl: { type: String },
    variants: { type: [variantSchema], default: [] },
    alt: { type: String, default: '' },
    folder: { type: String, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Media library listing: newest first, filtered by folder/kind.
imageAssetSchema.index({ createdAt: -1 });
imageAssetSchema.index({ folder: 1, createdAt: -1 });

export const ImageAsset: Model<IImageAsset> =
  mongoose.models.ImageAsset || mongoose.model<IImageAsset>('ImageAsset', imageAssetSchema);

export default ImageAsset;
