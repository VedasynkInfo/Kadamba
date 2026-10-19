import mongoose, { Document, Schema } from 'mongoose';

export interface ISalaryPayment extends Document {
  staffId: mongoose.Types.ObjectId;
  year: number;
  month: number;
  amount: number;
  paidAt: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const salaryPaymentSchema = new Schema<ISalaryPayment>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff member reference is required'],
    },
    year: {
      type: Number,
      required: [true, 'Salary year is required'],
      min: [2000, 'Invalid year'],
    },
    month: {
      type: Number,
      required: [true, 'Salary month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    amount: {
      type: Number,
      required: [true, 'Salary amount is required'],
      min: [0.01, 'Salary amount must be greater than 0'],
    },
    paidAt: {
      type: Date,
      required: [true, 'Paid date is required'],
      default: Date.now,
    },
    notes: {
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

salaryPaymentSchema.index({ staffId: 1 });
salaryPaymentSchema.index({ year: 1, month: 1 });
salaryPaymentSchema.index({ paidAt: -1 });
// One salary payment per staff member per month — prevents duplicate payouts.
salaryPaymentSchema.index(
  { staffId: 1, year: 1, month: 1 },
  { unique: true, name: 'uniq_staff_salary_period' },
);

export const SalaryPayment = mongoose.model<ISalaryPayment>('SalaryPayment', salaryPaymentSchema);
