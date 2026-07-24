import mongoose, { Document, Schema } from 'mongoose';

export type PortalSenderRole = 'customer' | 'admin' | 'staff';

export interface IPortalMessage extends Document {
  customerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  senderRole: PortalSenderRole;
  senderId: string;
  body: string;
  attachments: string[];
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const portalMessageSchema = new Schema<IPortalMessage>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      required: true,
    },
    senderId: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
      maxlength: 4000,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 6,
        message: 'At most 6 attachments are allowed',
      },
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

portalMessageSchema.index({ customerId: 1, createdAt: -1 });
portalMessageSchema.index({ orderId: 1, createdAt: -1 });

export const PortalMessage = mongoose.model<IPortalMessage>('PortalMessage', portalMessageSchema);
