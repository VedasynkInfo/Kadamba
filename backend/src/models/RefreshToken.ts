import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

/**
 * One row per issued refresh token.
 *
 * Rotation model:
 *  - every login starts a new `familyId` (one "session")
 *  - each refresh issues a new token in the same family and marks the old one
 *    `replacedBy`
 *  - presenting a token that is already `rotatedAt` means it was replayed
 *    (stolen or double-submitted) → the whole family is revoked immediately.
 *
 * Only the SHA-256 hash of the token is stored, so a database leak cannot be
 * replayed against the API.
 */
export interface IRefreshToken extends Document {
  /** SHA-256 of the opaque token. Unique — lookup key. */
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  /** Groups the rotation chain for one signed-in device. */
  familyId: string;
  role: string;
  expiresAt: Date;
  rotatedAt?: Date;
  /** Hash of the token that replaced this one. */
  replacedByHash?: string;
  revokedAt?: Date;
  revokedReason?: string;
  /** Best-effort session context for the "active sessions" UI. */
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    familyId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    rotatedAt: { type: Date },
    replacedByHash: { type: String },
    revokedAt: { type: Date },
    revokedReason: { type: String },
    userAgent: { type: String, maxlength: 400 },
    ip: { type: String, maxlength: 100 },
  },
  { timestamps: true },
);

// TTL cleanup — Mongo removes expired rows automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

/** Generate a cryptographically random opaque token (never a JWT). */
export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function newFamilyId(): string {
  return crypto.randomUUID();
}

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
