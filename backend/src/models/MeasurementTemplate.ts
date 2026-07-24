import mongoose, { Document, Schema } from 'mongoose';

export const MEASUREMENT_CATEGORIES = [
  'Bridal Collection',
  'Ethnic / Designer Blouses',
  'Kurtis & Tunics',
  'Dresses & Gowns',
  'Salwar / Suit Collection',
  'Skirts & Bottoms',
  'Kids Wear (Girls)',
  'Custom Tailoring',
] as const;

export type MeasurementCategory = (typeof MEASUREMENT_CATEGORIES)[number];

export const MEASUREMENT_UNITS = ['inches', 'cm'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export interface IMeasurementFieldDef {
  key: string;
  label: string;
  type: 'number' | 'text' | 'enum' | 'boolean';
  unit?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: string[];
  helpText?: string;
  group: string;
  sortOrder: number;
}

export interface IMeasurementTemplate extends Document {
  code: string;
  name: string;
  category: MeasurementCategory;
  description?: string;
  fieldDefs: IMeasurementFieldDef[];
  active: boolean;
  version: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const measurementFieldDefSchema = new Schema<IMeasurementFieldDef>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['number', 'text', 'enum', 'boolean'], required: true },
    unit: { type: String, trim: true },
    required: { type: Boolean, default: false },
    min: { type: Number },
    max: { type: Number },
    options: [{ type: String, trim: true }],
    helpText: { type: String, trim: true },
    group: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const measurementTemplateSchema = new Schema<IMeasurementTemplate>(
  {
    code: {
      type: String,
      required: [true, 'Code is required'],
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z0-9-]+$/, 'Code can only contain uppercase letters, numbers and dashes'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: MEASUREMENT_CATEGORIES,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    fieldDefs: [measurementFieldDefSchema],
    active: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

measurementTemplateSchema.index({ category: 1, active: -1 });
// code unique index is handled by schema declaration
measurementTemplateSchema.index({ active: -1 });

export const MeasurementTemplate = mongoose.model<IMeasurementTemplate>(
  'MeasurementTemplate',
  measurementTemplateSchema,
);