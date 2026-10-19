import jwt, { type SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  RefreshToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  newFamilyId,
} from '../models/RefreshToken';
import { User, type IUser } from '../models/User';
import type { AuthPayload } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';

/** Claims embedded in the short-lived access token. */
export interface AccessClaims extends AuthPayload {
  /** Token version of the user at mint time — enables instant revocation. */
  tv: number;
  /** Session family, so an access token can be traced to its refresh chain. */
  sid: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  familyId: string;
  expiresInSeconds: number;
}

export interface SessionContext {
  userAgent?: string;
  ip?: string;
}

/** Convert `15m` / `30d` / `3600` into seconds. */
export function expiresInToSeconds(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/i.exec(String(value).trim());
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  const multiplier = unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
  return amount * multiplier;
}

export function signAccessToken(
  user: Pick<IUser, '_id' | 'role' | 'customerId' | 'tokenVersion'>,
  familyId: string,
): string {
  const payload: AccessClaims = {
    id: String(user._id),
    role: user.role,
    customerId: user.customerId ? String(user.customerId) : undefined,
    tv: user.tokenVersion ?? 0,
    sid: familyId,
  };

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    subject: String(user._id),
  };

  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  }) as AccessClaims;
}

/**
 * Create a brand-new session (login / activation).
 * The refresh token is opaque random bytes — not a JWT — so it can be revoked
 * server-side without keeping a denylist.
 */
export async function createSession(
  user: IUser,
  context: SessionContext = {},
): Promise<IssuedSession> {
  const familyId = newFamilyId();
  const refreshToken = generateRefreshTokenValue();
  const refreshSeconds = expiresInToSeconds(env.refreshExpiresIn);

  await RefreshToken.create({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user._id,
    familyId,
    role: user.role,
    expiresAt: new Date(Date.now() + refreshSeconds * 1000),
    userAgent: context.userAgent?.slice(0, 400),
    ip: context.ip?.slice(0, 100),
  });

  return {
    accessToken: signAccessToken(user, familyId),
    refreshToken,
    familyId,
    expiresInSeconds: expiresInToSeconds(env.jwtExpiresIn),
  };
}

/**
 * Rotate a refresh token.
 *
 * Reuse detection: if the presented token was already rotated, someone is
 * replaying a stolen token. We revoke the entire family (all devices in that
 * session chain) and fail closed.
 */
export async function rotateSession(
  presentedToken: string,
  context: SessionContext = {},
): Promise<{ session: IssuedSession; user: IUser }> {
  const tokenHash = hashRefreshToken(presentedToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (existing.revokedAt) {
    throw new ApiError(401, 'Session has been revoked');
  }

  if (existing.rotatedAt) {
    // Replay of an already-used token — assume theft and kill the whole chain.
    await revokeFamily(existing.familyId, 'refresh_token_reuse');
    logger.warn(
      { userId: String(existing.userId), familyId: existing.familyId, ip: context.ip },
      'Refresh token reuse detected — session family revoked',
    );
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    await RefreshToken.updateOne(
      { _id: existing._id },
      { $set: { revokedAt: new Date(), revokedReason: 'expired' } },
    );
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  const user = await User.findById(existing.userId);
  if (!user) {
    await revokeFamily(existing.familyId, 'user_missing');
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
  if (user.status === 'disabled') {
    await revokeFamily(existing.familyId, 'account_disabled');
    throw new ApiError(403, 'Account is disabled');
  }

  // The token was minted before a password change / forced sign-out.
  if (existing.role !== user.role) {
    await revokeFamily(existing.familyId, 'role_changed');
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  const nextToken = generateRefreshTokenValue();
  const nextHash = hashRefreshToken(nextToken);
  const refreshSeconds = expiresInToSeconds(env.refreshExpiresIn);

  // Conditional update: only the first concurrent caller wins the rotation.
  const rotated = await RefreshToken.findOneAndUpdate(
    { _id: existing._id, rotatedAt: { $exists: false }, revokedAt: { $exists: false } },
    {
      $set: {
        rotatedAt: new Date(),
        replacedByHash: nextHash,
      },
    },
    { new: true },
  );

  if (!rotated) {
    // Lost a race — treat exactly like reuse.
    await revokeFamily(existing.familyId, 'refresh_token_reuse');
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  await RefreshToken.create({
    tokenHash: nextHash,
    userId: user._id,
    familyId: existing.familyId,
    role: user.role,
    expiresAt: new Date(Date.now() + refreshSeconds * 1000),
    userAgent: context.userAgent?.slice(0, 400) ?? existing.userAgent,
    ip: context.ip?.slice(0, 100) ?? existing.ip,
  });

  return {
    user,
    session: {
      accessToken: signAccessToken(user, existing.familyId),
      refreshToken: nextToken,
      familyId: existing.familyId,
      expiresInSeconds: expiresInToSeconds(env.jwtExpiresIn),
    },
  };
}

/** Revoke a single refresh token (normal sign-out). */
export async function revokeSession(presentedToken: string, reason = 'logout'): Promise<void> {
  const tokenHash = hashRefreshToken(presentedToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  );
}

/** Revoke every token in one rotation chain (one device/session). */
export async function revokeFamily(familyId: string, reason: string): Promise<void> {
  await RefreshToken.updateMany(
    { familyId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  );
}

/** Revoke every session for a user (password change, disable, "sign out all"). */
export async function revokeAllUserSessions(
  userId: string | mongoose.Types.ObjectId,
  reason: string,
): Promise<number> {
  const result = await RefreshToken.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  );
  return result.modifiedCount ?? 0;
}

export interface SessionSummary {
  id: string;
  familyId: string;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string;
  ip?: string;
  expiresAt: string;
}

/** Active sessions for the "manage devices" UI. */
export async function listUserSessions(
  userId: string,
  currentFamilyId?: string,
): Promise<SessionSummary[]> {
  const rows = await RefreshToken.find({
    userId,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    familyId: row.familyId,
    current: row.familyId === currentFamilyId,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: (row.rotatedAt ?? row.updatedAt ?? row.createdAt).toISOString(),
    userAgent: row.userAgent,
    ip: row.ip,
    expiresAt: row.expiresAt.toISOString(),
  }));
}

/**
 * In-process cache of `tokenVersion` + `status`, so `authenticate` does not hit
 * Mongo on every request. Bounded to 60s: the gate promises revocation within a
 * minute even if the invalidation hook is missed.
 */
interface CachedUserState {
  tokenVersion: number;
  status: string;
  role: string;
  permissions: string[];
  expires: number;
}

const USER_STATE_TTL_MS = 60_000;
const USER_STATE_MAX = 5_000;
const userStateCache = new Map<string, CachedUserState>();

export function cacheUserState(user: {
  _id: unknown;
  tokenVersion: number;
  status: string;
  role: string;
  permissions?: string[];
}) {
  const key = String(user._id);
  if (userStateCache.size >= USER_STATE_MAX) {
    // Drop the oldest entry (Map preserves insertion order).
    const oldest = userStateCache.keys().next().value;
    if (oldest) userStateCache.delete(oldest);
  }
  userStateCache.set(key, {
    tokenVersion: user.tokenVersion ?? 0,
    status: user.status,
    role: user.role,
    permissions: user.permissions ?? [],
    expires: Date.now() + USER_STATE_TTL_MS,
  });
}

export function invalidateUserState(userId: string) {
  userStateCache.delete(userId);
}

export async function getUserState(userId: string): Promise<CachedUserState | null> {
  const cached = userStateCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }
  if (cached) userStateCache.delete(userId);

  if (!mongoose.isValidObjectId(userId)) return null;

  const user = await User.findById(userId)
    .select('tokenVersion status role permissions')
    .lean();
  if (!user) return null;

  cacheUserState(user);
  return {
    tokenVersion: user.tokenVersion ?? 0,
    status: user.status,
    role: user.role,
    permissions: user.permissions ?? [],
    expires: Date.now() + USER_STATE_TTL_MS,
  };
}
