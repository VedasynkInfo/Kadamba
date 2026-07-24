import mongoose, { Document, Schema } from 'mongoose';

export const MEASUREMENT_STATUSES = [
  'draft',
  'active',
  'archived',
  'pending_approval',
] as const;

export type MeasurementStatus = (typeof MEASUREMENT_STATUSES)[number];

export interface IMeasurementVersion {
  values: Record<string, unknown>;
  notes?: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  referenceImages?: string[];
}

export interface IMeasurementProfile extends Document {
  customerId: string;
  productTypeCode: string;
  profileName: string;
  unit: string;
  status: MeasurementStatus;
  values: Record<string, unknown>;
  notes?: string;
  orderId?: string;
  measuredBy?: string;
  measuredAt: Date;
  referenceImages?: string[];
  currentVersion: number;
  versions: IMeasurementVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const measurementVersionSchema = new Schema<IMeasurementVersion>(
  {
    values: {
      type: Schema.Types.Mixed,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    changedBy: {
      type: String,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    referenceImages: [{
      type: String,
    }],
  },
  { _id: false },
);

const measurementProfileSchema = new Schema<IMeasurementProfile>(
  {
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      trim: true,
    },
    productTypeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: MEASUREMENT_STATUSES,
      default: 'draft',
    },
    values: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    orderId: {
      type: String,
      trim: true,
    },
    measuredBy: {
      type: String,
      trim: true,
    },
    measuredAt: {
      type: Date,
      default: Date.now,
    },
    referenceImages: [{
      type: String,
    }],
    currentVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    versions: [measurementVersionSchema],
  },
  { timestamps: true },
);

measurementProfileSchema.index({ customerId: 1, status: -1 });
measurementProfileSchema.index({ productTypeCode: 1 });
measurementProfileSchema.index({ profileName: 'text' });
measurementProfileSchema.index({ createdAt: -1 });

export const MeasurementProfile = mongoose.model<IMeasurementProfile>(
  'MeasurementProfile',
  measurementProfileSchema,
);