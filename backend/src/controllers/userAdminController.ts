import type { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAudit, actorFromRequest } from '../services/auditService';
import { invalidateUserState } from '../services/tokenService';
import { revokeAllUserSessions } from '../services/tokenService';
import { PERMISSIONS } from '../shared/enums';
import type { Permission } from '../shared/enums';
import { escapeRegex } from '../utils/query';
import { sanitizeUser } from '../services/authService';

function toUserDto(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  status: string;
  mfa?: { enabled?: boolean };
  lastLoginAt?: Date;
  createdAt?: Date;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions ?? [],
    status: user.status,
    mfaEnabled: Boolean(user.mfa?.enabled),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt?.toISOString(),
  };
}

/** Paginated console-user list for the Users & Roles desk. */
export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const filter: Record<string, unknown> = {
    // Customer portal accounts are managed from the customer record, not here.
    role: { $in: ['admin', 'staff', 'user'] },
  };

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;

  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('name email role permissions status mfa.enabled lastLoginAt createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Console users',
    data: {
      items: items.map(toUserDto),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

/** Enable/disable a console user. Disabling revokes every session immediately. */
export const setUserStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const status = String(req.body?.status ?? '');

  if (!['active', 'disabled'].includes(status)) {
    throw new ApiError(400, 'Status must be active or disabled');
  }
  if (userId === req.user!.id) {
    throw new ApiError(400, 'You cannot change your own account status');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.status = status as 'active' | 'disabled';
  // Bump the version so any in-flight access token dies within the cache TTL.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  invalidateUserState(userId);
  if (status === 'disabled') {
    await revokeAllUserSessions(userId, 'account_disabled');
  }

  await recordAudit(
    {
      action: status === 'disabled' ? 'user.disabled' : 'user.enabled',
      actor: actorFromRequest(req),
      entityType: 'user',
      entityId: userId,
      summary: `${status === 'disabled' ? 'Disabled' : 'Enabled'} ${user.email}`,
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: status === 'disabled' ? 'User disabled' : 'User enabled',
    data: { user: sanitizeUser(user) },
  });
});

/** Role change (admin ↔ staff ↔ user). Customers are excluded. */
export const setUserRoleHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const role = String(req.body?.role ?? '');

  if (!['admin', 'staff', 'user'].includes(role)) {
    throw new ApiError(400, 'Role must be admin, staff or user');
  }
  if (userId === req.user!.id) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'customer') {
    throw new ApiError(400, 'Customer accounts are managed from the customer record');
  }

  user.role = role as 'admin' | 'staff' | 'user';
  // Admin implicitly holds all permissions; clear stale explicit grants.
  if (role === 'admin') user.permissions = [];
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  invalidateUserState(userId);
  await revokeAllUserSessions(userId, 'role_changed');

  await recordAudit(
    {
      action: 'user.updated',
      actor: actorFromRequest(req),
      entityType: 'user',
      entityId: userId,
      summary: `Changed role of ${user.email} to ${role}`,
      changes: { role },
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: 'Role updated. The user must sign in again.',
    data: { user: sanitizeUser(user) },
  });
});

/** Reference data for the permissions matrix UI. */
export const permissionCatalogHandler = asyncHandler(async (_req: Request, res: Response) => {
  const { PERMISSION_GROUPS, DEFAULT_STAFF_PERMISSIONS } = await import('../shared/enums');
  res.status(200).json({
    success: true,
    message: 'Permission catalog',
    data: {
      permissions: PERMISSIONS as readonly Permission[],
      groups: PERMISSION_GROUPS,
      staffDefaults: DEFAULT_STAFF_PERMISSIONS,
    },
  });
});
