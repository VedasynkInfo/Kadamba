import mongoose, { Document, Schema } from 'mongoose';
import { LEAD_STATUSES, LEAD_SOURCES } from '../shared/enums';
import type { LeadStatus, LeadSource } from '../shared/enums';

export { LEAD_STATUSES, LEAD_SOURCES };
export type { LeadStatus, LeadSource };

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

export interface IFollowUp {
  _id?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  type: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
  notes: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  completedAt?: Date;
  outcome?: string;
  createdBy?: string;
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email: string;
  city: string;
  locality?: string;
  service: string;
  garmentType?: string;
  fabricStatus?: string;
  occasion: string;
  budget: string;
  preferredDate: Date;
  preferredTime?: string;
  message: string;
  inspirationImages: string[];
  status: LeadStatus;
  source: LeadSource;
  assignee: string;
  /** Linked workshop order created from this request */
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: number;
  referenceId?: string;
  notes: ILeadNote[];
  timeline: ILeadTimelineEvent[];
  // Lead scoring & follow-up extensions
  score?: number;
  quality?: 'hot' | 'warm' | 'cold';
  scoreBreakdown?: {
    budgetScore: number;
    timelineScore: number;
    serviceScore: number;
    detailsScore: number;
    contactScore: number;
  };
  followUps: IFollowUp[];
  nextFollowUpDate?: Date;
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

const leadFollowUpSchema = new Schema<IFollowUp>(
  {
    scheduledAt: { type: Date, required: true },
    type: {
      type: String,
      enum: ['call', 'whatsapp', 'email', 'in_person_consultation'],
      default: 'call',
    },
    notes: { type: String, default: '', trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
    },
    completedAt: { type: Date },
    outcome: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: String, trim: true },
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
    locality: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    service: {
      type: String,
      required: [true, 'Service is required'],
      trim: true,
      maxlength: 120,
    },
    garmentType: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    fabricStatus: {
      type: String,
      trim: true,
      maxlength: 80,
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
    preferredTime: {
      type: String,
      trim: true,
      maxlength: 40,
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    orderNumber: {
      type: Number,
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 40,
      index: true,
    },
    notes: {
      type: [leadNoteSchema],
      default: [],
    },
    timeline: {
      type: [leadTimelineSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    quality: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
      index: true,
    },
    scoreBreakdown: {
      type: new Schema(
        {
          budgetScore: { type: Number, default: 0 },
          timelineScore: { type: Number, default: 0 },
          serviceScore: { type: Number, default: 0 },
          detailsScore: { type: Number, default: 0 },
          contactScore: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    followUps: {
      type: [leadFollowUpSchema],
      default: [],
    },
    nextFollowUpDate: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
