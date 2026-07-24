import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'fabric'
  | 'embroidery materials'
  | 'rent'
  | 'utilities'
  | 'marketing'
  | 'misc';

export interface IExpense extends Document {
  title: string;
  category: ExpenseCategory;
  amount: number;
  spentAt: Date;
  notes?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['fabric', 'embroidery materials', 'rent', 'utilities', 'marketing', 'misc'],
      required: [true, 'Expense category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Expense amount must be greater than 0'],
    },
    spentAt: {
      type: Date,
      required: [true, 'Date of expense is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ spentAt: -1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
