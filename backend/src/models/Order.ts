import mongoose, { Document, Schema } from 'mongoose';

export const ORDER_STATUSES = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
  'cancelled',
  'on_hold',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PRIORITIES = ['normal', 'high', 'rush'] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export interface IOrderLineItem {
  productTypeCode?: string; // template code (e.g. BL-MG, BR-LH)
  serviceId?: string;       // service ref if matching CMS
  name: string;
  notes?: string;
  qty: number;
}

export interface IOrderStaff {
  staffId?: string;
  name: string;
  role: 'cutter' | 'stitcher' | 'maggam' | 'finishing' | 'designer';
}

export interface IOrderNote {
  body: string;
  visibility: 'internal' | 'customer';
  createdBy: string;
  createdAt: Date;
}

export interface IOrderTimeline {
  status: OrderStatus;
  note?: string;
  actorId: string;
  at: Date;
}

export interface IOrderPaymentSummary {
  totalQuoted: number;
  advance: number;
  totalPaid: number;
  balance: number;
}

export interface IOrder extends Document {
  orderNumber: number;
  referenceId?: string;
  customerId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  status: OrderStatus;
  priority: OrderPriority;
  title: string;
  lineItems: IOrderLineItem[];
  measurementProfileIds: string[];
  assignedStaff: IOrderStaff[];
  expectedTrialAt?: Date;
  expectedDeliveryAt?: Date;
  actualTrialAt?: Date;
  actualDeliveryAt?: Date;
  tags: string[];
  notes: IOrderNote[];
  timeline: IOrderTimeline[];
  paymentSummary: IOrderPaymentSummary;
  attachments: string[];
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IOrderLineItem>(
  {
    productTypeCode: { type: String, trim: true },
    serviceId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    qty: { type: Number, required: true, default: 1, min: 1 },
  },
  { _id: false },
);

const staffSchema = new Schema<IOrderStaff>(
  {
    staffId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['cutter', 'stitcher', 'maggam', 'finishing', 'designer'],
    },
  },
  { _id: false },
);

const noteSchema = new Schema<IOrderNote>(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    visibility: { type: String, enum: ['internal', 'customer'], default: 'internal' },
    createdBy: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const timelineSchema = new Schema<IOrderTimeline>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true },
    actorId: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const paymentSummarySchema = new Schema<IOrderPaymentSummary>(
  {
    totalQuoted: { type: Number, required: true, default: 0, min: 0 },
    advance: { type: Number, required: true, default: 0, min: 0 },
    totalPaid: { type: Number, required: true, default: 0, min: 0 },
    balance: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'enquiry',
    },
    priority: {
      type: String,
      enum: ORDER_PRIORITIES,
      default: 'normal',
    },
    title: {
      type: String,
      required: [true, 'Order title/summary is required'],
      trim: true,
      maxlength: 200,
    },
    lineItems: {
      type: [lineItemSchema],
      default: [],
      validate: {
        validator: (v: IOrderLineItem[]) => v.length >= 1,
        message: 'Order must have at least one line item before saving',
      },
    },
    measurementProfileIds: {
      type: [String],
      default: [],
    },
    assignedStaff: {
      type: [staffSchema],
      default: [],
    },
    expectedTrialAt: { type: Date },
    expectedDeliveryAt: { type: Date },
    actualTrialAt: { type: Date },
    actualDeliveryAt: { type: Date },
    tags: [{ type: String, trim: true }],
    notes: { type: [noteSchema], default: [] },
    timeline: { type: [timelineSchema], default: [] },
    paymentSummary: {
      type: paymentSummarySchema,
      default: () => ({ totalQuoted: 0, advance: 0, totalPaid: 0, balance: 0 }),
    },
    attachments: [{ type: String }],
    cancelledReason: { type: String, trim: true },
  },
  { timestamps: true },
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
