import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User, type IUser } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import type { Permission } from '../shared/enums';
import { ApiError } from '../utils/ApiError';
import { assertPasswordPolicy } from '../utils/passwordPolicy';
import {
  buildOtpauthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotp,
} from '../utils/totp';
import {
  createSession,
  revokeAllUserSessions,
  revokeSession,
  rotateSession,
  invalidateUserState,
  cacheUserState,
  type SessionContext,
} from './tokenService';

/**
 * A fixed bcrypt hash used when the account does not exist, so a login attempt
 * takes the same time whether or not the email is registered. Without this an
 * attacker can enumerate valid admin emails by timing the response.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7Q9p9p1vJ8x0q3Ff4y5T6u7V8w9X0aB';

export function sanitizeUser(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.role === 'admin' ? undefined : (user.permissions ?? []),
    customerId: user.customerId ? String(user.customerId) : undefined,
    referenceId: user.referenceId,
    status: user.status,
    mfaEnabled: Boolean(user.mfa?.enabled),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}

/**
 * Idempotent admin provisioning used by the `seed:admin` script. If the email
 * already exists it is promoted to admin and (optionally) its password reset,
 * so the command is safe to re-run. Not exposed over HTTP.
 */
export async function upsertAdminUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email }).select('+password');

  if (existing) {
    existing.role = 'admin';
    existing.status = 'active';
    if (input.name) existing.name = input.name;
    if (input.password) existing.password = input.password;
    await existing.save();
    invalidateUserState(String(existing._id));
    return { user: sanitizeUser(existing), created: false };
  }

  const user = await User.create({
    name: input.name,
    email,
    password: input.password,
    role: 'admin',
    status: 'active',
  });
  return { user: sanitizeUser(user), created: true };
}

export interface LoginResult {
  user: ReturnType<typeof sanitizeUser>;
  token: string;
  refreshToken: string;
  expiresIn: number;
  /** Set when the account has MFA enabled — client must complete a second step. */
  mfaRequired?: boolean;
  /** Short-lived ticket authorising the MFA step (not an access token). */
  mfaTicket?: string;
}

/** Constant-time-ish failure path for unknown accounts. */
async function burnPasswordComparison(password: string) {
  await bcrypt.compare(password, DUMMY_HASH);
}

function isLocked(user: IUser): boolean {
  return Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now());
}

async function registerFailedLogin(user: IUser): Promise<void> {
  const attempts = (user.failedLoginAttempts ?? 0) + 1;
  user.failedLoginAttempts = attempts;

  if (attempts >= env.security.maxFailedLogins) {
    user.lockedUntil = new Date(Date.now() + env.security.lockoutMinutes * 60_000);
    user.failedLoginAttempts = 0;
    await user.save();
    logger.warn(
      { userId: String(user._id), email: user.email },
      'Account locked after repeated failed logins',
    );
    return;
  }

  await user.save();
}

async function registerSuccessfulLogin(user: IUser): Promise<void> {
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  cacheUserState(user);
}

/** Mint an MFA challenge ticket — signed separately, valid for 5 minutes. */
function signMfaTicket(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`mfa:${payload}`)
    .digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

function verifyMfaTicket(ticket: string): string {
  const [encoded, signature] = String(ticket ?? '').split('.');
  if (!encoded || !signature) {
    throw ApiError.unauthenticated('Invalid verification ticket');
  }
  const payload = Buffer.from(encoded, 'base64url').toString('utf8');
  const expected = crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`mfa:${payload}`)
    .digest('base64url');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw ApiError.unauthenticated('Invalid verification ticket');
  }

  const [userId, issuedAt] = payload.split('.');
  if (!userId || !issuedAt) {
    throw ApiError.unauthenticated('Invalid verification ticket');
  }
  if (Date.now() - Number(issuedAt) > 5 * 60_000) {
    throw new ApiError(401, 'Verification ticket expired. Please sign in again.');
  }
  return userId;
}

export async function loginUser(
  input: { email: string; password: string },
  context: SessionContext = {},
): Promise<LoginResult> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email }).select('+password +mfa.secret');

  if (!user) {
    await burnPasswordComparison(input.password);
    throw new ApiError(401, 'Invalid email or password');
  }

  if (isLocked(user)) {
    await burnPasswordComparison(input.password);
    const minutes = Math.ceil(
      ((user.lockedUntil?.getTime() ?? Date.now()) - Date.now()) / 60_000,
    );
    throw ApiError.accountLocked(
      `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    );
  }

  const passwordOk = await user.comparePassword(input.password);
  if (!passwordOk) {
    await registerFailedLogin(user);
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'disabled') {
    throw new ApiError(403, 'Account is disabled');
  }

  // Customer accounts use the portal login — keep admin console separate.
  if (user.role === 'customer') {
    throw new ApiError(403, 'Use the customer portal to sign in');
  }

  // Admin accounts may be required to enrol in TOTP before getting a session.
  if (env.security.requireAdminMfa && user.role === 'admin' && !user.mfa?.enabled) {
    throw new ApiError(
      403,
      'Two-factor authentication must be enabled for this account. Contact the studio owner.',
      [{ code: 'MFA_ENROLMENT_REQUIRED' }],
    );
  }

  if (user.mfa?.enabled) {
    return {
      user: sanitizeUser(user),
      token: '',
      refreshToken: '',
      expiresIn: 0,
      mfaRequired: true,
      mfaTicket: signMfaTicket(String(user._id)),
    };
  }

  await registerSuccessfulLogin(user);
  const session = await createSession(user, context);

  return {
    user: sanitizeUser(user),
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresInSeconds,
  };
}

/** Second login step for accounts with TOTP enabled. */
export async function verifyLoginMfa(input: {
  mfaTicket: string;
  code: string;
  /** A recovery code may be supplied instead of a 6-digit TOTP. */
  recoveryCode?: string;
}, context: SessionContext = {}): Promise<LoginResult> {
  const userId = verifyMfaTicket(input.mfaTicket);
  const user = await User.findById(userId).select('+mfa.secret');

  if (!user) {
    throw ApiError.unauthenticated('Invalid verification ticket');
  }
  if (user.status === 'disabled') {
    throw new ApiError(403, 'Account is disabled');
  }
  if (!user.mfa?.enabled || !user.mfa.secret) {
    throw new ApiError(400, 'Two-factor authentication is not enabled for this account');
  }
  if (isLocked(user)) {
    throw ApiError.accountLocked('Too many failed attempts. Try again later.');
  }

  let verified = false;

  if (input.recoveryCode) {
    const hash = hashBackupCode(input.recoveryCode);
    const match = user.mfa.backupCodes?.find((code) => code.hash === hash && !code.usedAt);
    if (match) {
      match.usedAt = new Date();
      verified = true;
    }
  } else {
    verified = verifyTotp(user.mfa.secret, input.code);
  }

  if (!verified) {
    await registerFailedLogin(user);
    throw ApiError.mfaInvalid();
  }

  await registerSuccessfulLogin(user);
  const session = await createSession(user, context);

  return {
    user: sanitizeUser(user),
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresInSeconds,
  };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sanitizeUser(user);
}

/** Rotate a refresh token and return a fresh access token. */
export async function refreshSession(
  refreshTokenValue: string,
  context: SessionContext = {},
) {
  if (!refreshTokenValue) {
    throw new ApiError(401, 'No refresh token supplied');
  }
  const { session, user } = await rotateSession(refreshTokenValue, context);
  return {
    user: sanitizeUser(user),
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresInSeconds,
  };
}

export async function logoutSession(refreshTokenValue?: string) {
  if (refreshTokenValue) {
    await revokeSession(refreshTokenValue, 'logout');
  }
}

export async function updateProfile(
  userId: string,
  input: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  },
  context: SessionContext = {},
) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let passwordChanged = false;

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new ApiError(400, 'Name must be 2-80 characters');
    }
    user.name = name;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new ApiError(400, 'Current password is required to set a new password');
    }
    if (!(await user.comparePassword(input.currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    assertPasswordPolicy(input.newPassword, {
      admin: user.role === 'admin',
      userInputs: [user.email, user.name],
    });
    user.password = input.newPassword;
    passwordChanged = true;
  }

  await user.save();
  invalidateUserState(String(user._id));

  // A password change kills every other device; the current one gets a new session.
  if (passwordChanged) {
    await revokeAllUserSessions(user._id, 'password_changed');
  }

  const session = await createSession(user, context);
  return {
    user: sanitizeUser(user),
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresInSeconds,
  };
}

/* -------------------------------------------------------------------------- */
/* Password reset                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Always resolves, whether or not the email exists — prevents enumeration.
 * The token is hashed at rest and single-use.
 */
export async function requestPasswordReset(email: string): Promise<{
  /** Only returned outside production so local dev can complete the flow. */
  devToken?: string;
  user?: IUser;
}> {
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  if (!user) return {};

  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + 30 * 60_000),
    requestedIp: undefined,
  });

  return { devToken: env.isProduction ? undefined : raw, user };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<{ user: IUser }> {
  const hash = crypto.createHash('sha256').update(input.token).digest('hex');
  const record = await PasswordResetToken.findOne({
    tokenHash: hash,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }

  const user = await User.findById(record.userId).select('+password');
  if (!user) {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }

  assertPasswordPolicy(input.password, {
    admin: user.role === 'admin',
    userInputs: [user.email, user.name],
  });

  user.password = input.password;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await revokeAllUserSessions(user._id, 'password_reset');
  invalidateUserState(String(user._id));

  return { user };
}

/* -------------------------------------------------------------------------- */
/* Two-factor authentication                                                  */
/* -------------------------------------------------------------------------- */

/** Step 1: generate a secret and return the QR payload (not yet enabled). */
export async function startMfaEnrollment(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.mfa?.enabled) {
    throw new ApiError(400, 'Two-factor authentication is already enabled');
  }

  const secret = generateTotpSecret();
  user.mfa = { enabled: false, secret, backupCodes: [], enrolledAt: undefined };
  await user.save();

  return {
    secret,
    otpauthUri: buildOtpauthUri({ secret, accountName: user.email }),
  };
}

/** Step 2: confirm a code, enable MFA and return one-time recovery codes. */
export async function confirmMfaEnrollment(userId: string, code: string) {
  const user = await User.findById(userId).select('+mfa.secret');
  if (!user) throw new ApiError(404, 'User not found');
  if (user.mfa?.enabled) {
    throw new ApiError(400, 'Two-factor authentication is already enabled');
  }
  if (!user.mfa?.secret) {
    throw new ApiError(400, 'Start enrolment before confirming');
  }
  if (!verifyTotp(user.mfa.secret, code)) {
    throw new ApiError(400, 'Invalid authentication code', undefined, 'MFA_INVALID');
  }

  const backupCodes = generateBackupCodes(8);
  user.mfa.enabled = true;
  user.mfa.enrolledAt = new Date();
  user.mfa.backupCodes = backupCodes.map((value) => ({ hash: hashBackupCode(value) }));
  await user.save();
  invalidateUserState(String(user._id));

  return { enabled: true, backupCodes };
}

/** Disable MFA — requires the account password plus a valid current code. */
export async function disableMfa(userId: string, password: string, code: string) {
  const user = await User.findById(userId).select('+password +mfa.secret');
  if (!user) throw new ApiError(404, 'User not found');
  if (!user.mfa?.enabled) {
    throw new ApiError(400, 'Two-factor authentication is not enabled');
  }
  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, 'Password is incorrect');
  }
  if (!user.mfa.secret || !verifyTotp(user.mfa.secret, code)) {
    throw new ApiError(400, 'Invalid authentication code', undefined, 'MFA_INVALID');
  }

  user.mfa = { enabled: false, secret: undefined, backupCodes: [], enrolledAt: undefined };
  await user.save();
  invalidateUserState(String(user._id));
  await revokeAllUserSessions(user._id, 'mfa_disabled');

  return { enabled: false };
}

/** Regenerate recovery codes (invalidates the old ones). */
export async function regenerateBackupCodes(userId: string, password: string) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  if (!user.mfa?.enabled) {
    throw new ApiError(400, 'Two-factor authentication is not enabled');
  }
  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, 'Password is incorrect');
  }

  const backupCodes = generateBackupCodes(8);
  user.mfa.backupCodes = backupCodes.map((value) => ({ hash: hashBackupCode(value) }));
  await user.save();

  return { backupCodes };
}

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

export async function setUserPermissions(userId: string, permissions: Permission[]) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  user.permissions = permissions;
  await user.save();
  invalidateUserState(String(user._id));
  return sanitizeUser(user);
}

/** "Sign out everywhere" — bumps the version and revokes refresh tokens. */
export async function revokeAllSessions(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  invalidateUserState(String(user._id));

  const count = await revokeAllUserSessions(user._id, 'sign_out_all');
  return { revokedSessions: count };
}
