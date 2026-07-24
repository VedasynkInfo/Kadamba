import mongoose, { Document, Schema } from 'mongoose';

export type EmploymentType = 'permanent' | 'freelance' | 'intern';
export type SalaryType = 'monthly' | 'piece-rate' | 'freelance' | 'other';
export type StaffStatus = 'active' | 'inactive';

export interface IStaffPerformanceNote {
  body: string;
  at: Date;
}

export interface IStaff extends Document {
  fullName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  locality: string;
  address?: string;
  joiningDate: Date;
  employmentType: EmploymentType;
  specializations: string[];
  yearsExperience?: number;
  previousWorkplaces?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  salaryType: SalaryType;
  salaryAmount: number;
  status: StaffStatus;
  performanceNotes: IStaffPerformanceNote[];
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const performanceNoteSchema = new Schema<IStaffPerformanceNote>(
  {
    body: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const staffSchema = new Schema<IStaff>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'freelance', 'intern'],
      required: [true, 'Employment type is required'],
    },
    specializations: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1,
        message: 'At least one specialization is required',
      },
    },
    yearsExperience: {
      type: Number,
      min: 0,
    },
    previousWorkplaces: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    salaryType: {
      type: String,
      enum: ['monthly', 'piece-rate', 'freelance', 'other'],
      default: 'monthly',
    },
    salaryAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    performanceNotes: {
      type: [performanceNoteSchema],
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

staffSchema.index({ status: 1 });
staffSchema.index({ phone: 1 });

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);
