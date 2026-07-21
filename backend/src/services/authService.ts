import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthPayload } from '../middleware/auth';
import { User, type IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';

function signToken(payload: AuthPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

function sanitizeUser(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
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
    if (input.name) existing.name = input.name;
    if (input.password) existing.password = input.password;
    await existing.save();
    return { user: sanitizeUser(existing), created: false };
  }

  const user = await User.create({
    name: input.name,
    email,
    password: input.password,
    role: 'admin',
  });
  return { user: sanitizeUser(user), created: true };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ id: String(user._id), role: user.role });
  return { user: sanitizeUser(user), token };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sanitizeUser(user);
}

export async function refreshToken(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const token = signToken({ id: String(user._id), role: user.role });
  return { user: sanitizeUser(user), token };
}

export async function updateProfile(
  userId: string,
  input: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  },
) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

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
    if (input.newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters');
    }
    user.password = input.newPassword;
  }

  await user.save();
  const token = signToken({ id: String(user._id), role: user.role });
  return { user: sanitizeUser(user), token };
}
