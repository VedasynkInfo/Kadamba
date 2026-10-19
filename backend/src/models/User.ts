import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { USER_ROLES, USER_STATUSES, PERMISSIONS } from '../shared/enums';
import type { Permission, UserRole, UserStatus } from '../shared/enums';

export { USER_ROLES, USER_STATUSES };
export type { UserRole, UserStatus };

export interface IBackupCode {
  /** SHA-256 hash of the code — never stored in plaintext. */
  hash: string;
  usedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  /** Fine-grained capabilities. `admin` implicitly holds every permission. */
  permissions: Permission[];
  phone?: string;
  customerId?: mongoose.Types.ObjectId;
  referenceId?: string;
  status: UserStatus;

  /**
   * Incremented on password change / forced sign-out. Every access and refresh
   * token carries the version it was minted with, so bumping this invalidates
   * all outstanding sessions instantly (no Redis needed).
   */
  tokenVersion: number;

  /** Bumped when the password changes — rejects older tokens as a second net. */
  passwordChangedAt?: Date;

  activatedAt?: Date;
  lastLoginAt?: Date;

  /** Brute-force protection. */
  failedLoginAttempts: number;
  lockedUntil?: Date;

  /** TOTP two-factor authentication (admins are required to enrol). */
  mfa: {
    enabled: boolean;
    /** Base32 secret, `select: false` — only loaded when verifying. */
    secret?: string;
    /** SHA-256 hashes of unused recovery codes. */
    backupCodes: IBackupCode[];
    enrolledAt?: Date;
  };

  comparePassword(candidate: string): Promise<boolean>;
  hasPermission(permission: Permission): boolean;
}

const backupCodeSchema = new Schema<IBackupCode>(
  {
    hash: { type: String, required: true },
    usedAt: { type: Date },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    permissions: {
      type: [String],
      enum: PERMISSIONS,
      default: [],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active',
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    passwordChangedAt: {
      type: Date,
    },
    activatedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
    },
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      backupCodes: { type: [backupCodeSchema], default: [] },
      enrolledAt: { type: Date },
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  // Any password change must invalidate every previously issued token.
  this.tokenVersion = (this.tokenVersion ?? 0) + 1;
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.hasPermission = function hasPermission(permission: Permission) {
  if (this.role === 'admin') return true;
  return Array.isArray(this.permissions) && this.permissions.includes(permission);
};

export const User = mongoose.model<IUser>('User', userSchema);
