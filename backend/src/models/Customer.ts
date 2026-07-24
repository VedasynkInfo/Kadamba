import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerNote {
  body: string;
  pinned: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ICustomerAddress {
  line1?: string;
  line2?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: ICustomerAddress;
  source?: 'walk-in' | 'instagram' | 'google' | 'referral' | 'website' | string;
  tags?: string[];
  notes?: string; // Backwards compatibility general notes
  crmNotes?: ICustomerNote[];
  leadIds?: mongoose.Types.ObjectId[];
  portalUserId?: string;
  portalStatus?: 'none' | 'invited' | 'active' | 'locked' | string;
  preferredUnit?: 'in' | 'cm' | string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerAddressSchema = new Schema<ICustomerAddress>({
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  landmark: { type: String, trim: true },
  locality: { type: String, trim: true },
  city: { type: String, trim: true, default: 'Kurnool' },
  state: { type: String, trim: true, default: 'Andhra Pradesh' },
  pincode: { type: String, trim: true },
}, { _id: false });

const customerNoteSchema = new Schema<ICustomerNote>({
  body: { type: String, required: true, trim: true },
  pinned: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    whatsapp: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: customerAddressSchema,
      default: () => ({ city: 'Kurnool', state: 'Andhra Pradesh' }),
    },
    source: {
      type: String,
      trim: true,
      default: 'walk-in',
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    crmNotes: {
      type: [customerNoteSchema],
      default: [],
    },
    leadIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    }],
    portalUserId: {
      type: String,
    },
    portalStatus: {
      type: String,
      default: 'none',
    },
    preferredUnit: {
      type: String,
      default: 'in',
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

customerSchema.index({ name: 'text', phone: 1, email: 1 });
customerSchema.index({ 'address.locality': 1 });
customerSchema.index({ tags: 1 });
customerSchema.index({ createdAt: -1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);