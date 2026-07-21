import mongoose, { Document, Schema } from 'mongoose';

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Appointment',
  'Completed',
  'Rejected',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  'Request Service',
  'Contact',
  'WhatsApp',
  'Walk-in',
  'Referral',
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface ILeadNote {
  body: string;
  author: string;
  createdAt: Date;
}

export interface ILeadTimelineEvent {
  type: 'created' | 'status' | 'note' | 'assigned' | 'export';
  label: string;
  detail?: string;
  createdAt: Date;
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  occasion: string;
  budget: string;
  preferredDate: Date;
  message: string;
  inspirationImages: string[];
  status: LeadStatus;
  source: LeadSource;
  assignee: string;
  notes: ILeadNote[];
  timeline: ILeadTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const leadNoteSchema = new Schema<ILeadNote>(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const leadTimelineSchema = new Schema<ILeadTimelineEvent>(
  {
    type: {
      type: String,
      enum: ['created', 'status', 'note', 'assigned', 'export'],
      required: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 200 },
    detail: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: 80,
    },
    service: {
      type: String,
      required: [true, 'Service is required'],
      trim: true,
      maxlength: 120,
    },
    occasion: {
      type: String,
      required: [true, 'Occasion is required'],
      trim: true,
      maxlength: 120,
    },
    budget: {
      type: String,
      required: [true, 'Budget is required'],
      trim: true,
      maxlength: 80,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    inspirationImages: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 4,
        message: 'At most 4 inspiration images are allowed',
      },
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'New',
    },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: 'Request Service',
    },
    assignee: {
      type: String,
      default: 'Unassigned',
      trim: true,
      maxlength: 80,
    },
    notes: {
      type: [leadNoteSchema],
      default: [],
    },
    timeline: {
      type: [leadTimelineSchema],
      default: [],
    },
  },
  { timestamps: true },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
