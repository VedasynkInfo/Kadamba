import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'cash' | 'upi' | 'bank' | 'card' | 'other';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  paidAt: Date;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paidAt: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank', 'card', 'other'],
      required: [true, 'Payment method is required'],
    },
    reference: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: String,
      required: [true, 'Recorded by is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paidAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
