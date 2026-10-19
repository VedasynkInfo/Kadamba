import type { Request, Response } from 'express';
import { env } from '../config/env';
import { sendEmail } from '../config/email';
import { logger } from '../config/logger';
import {
  confirmMfaEnrollment,
  disableMfa,
  getUserById,
  loginUser,
  logoutSession,
  refreshSession,
  regenerateBackupCodes,
  requestPasswordReset,
  resetPassword,
  revokeAllSessions,
  setUserPermissions,
  startMfaEnrollment,
  updateProfile,
  verifyLoginMfa,
} from '../services/authService';
import { listUserSessions, revokeFamily } from '../services/tokenService';
import { recordAudit, listAuditLogs, verifyAuditChain } from '../services/auditService';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import {
  clearRefreshCookie,
  refreshCookieName,
  setRefreshCookie,
} from '../utils/cookies';

function sessionContext(req: Request) {
  return {
    userAgent: req.header('user-agent'),
    ip: req.ip,
  };
}

function readRefreshToken(req: Request): string | undefined {
  const cookieValue = req.cookies?.[refreshCookieName()];
  if (typeof cookieValue === 'string' && cookieValue) return cookieValue;
  // Body fallback keeps native/API clients working without cookies.
  const bodyValue = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  return typeof bodyValue === 'string' && bodyValue ? bodyValue : undefined;
}

/** Shape the login payload; cookies are set only when a real session exists. */
function sendSession(
  res: Response,
  result: Awaited<ReturnType<typeof loginUser>>,
  message: string,
) {
  if (result.mfaRequired) {
    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication required',
      data: {
        mfaRequired: true,
        mfaTicket: result.mfaTicket,
        user: { id: result.user.id, name: result.user.name, email: result.user.email },
      },
    });
  }

  setRefreshCookie(res, result.refreshToken);
  return res.status(200).json({
    success: true,
    message,
    data: {
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn,
    },
  });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body, sessionContext(req));

  if (!result.mfaRequired) {
    await recordAudit(
      {
        action: 'auth.login',
        actor: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        entityType: 'user',
        entityId: result.user.id,
        summary: `${result.user.email} signed in`,
      },
      req,
    );
  }

  sendSession(res, result, 'Login successful');
});

export const verifyMfa = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyLoginMfa(req.body, sessionContext(req));
  await recordAudit(
    {
      action: 'auth.login',
      actor: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      entityType: 'user',
      entityId: result.user.id,
      summary: `${result.user.email} signed in with two-factor authentication`,
    },
    req,
  );
  sendSession(res, result, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Current user',
    data: { user },
  });
});

/**
 * Rotate the refresh token from the httpOnly cookie. The access token is
 * returned in the body and kept in memory by the SPA.
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const presented = readRefreshToken(req);

  try {
    const result = await refreshSession(presented ?? '', sessionContext(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      message: 'Session refreshed',
      data: {
        user: result.user,
        token: result.token,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const presented = readRefreshToken(req);
  await logoutSession(presented);
  clearRefreshCookie(res);

  if (req.user) {
    await recordAudit(
      {
        action: 'auth.logout',
        actor: { id: req.user.id, role: req.user.role },
        entityType: 'user',
        entityId: req.user.id,
        summary: 'Signed out',
      },
      req,
    );
  }

  res.status(200).json({ success: true, message: 'Signed out' });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateProfile(req.user!.id, req.body, sessionContext(req));

  if (req.body?.newPassword) {
    await recordAudit(
      {
        action: 'auth.password_changed',
        actor: { id: req.user!.id, role: req.user!.role },
        entityType: 'user',
        entityId: req.user!.id,
        summary: 'Changed their password',
      },
      req,
    );
  }

  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: {
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn,
    },
  });
});

/* -------------------------------------------------------------------------- */
/* Password reset                                                             */
/* -------------------------------------------------------------------------- */

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '');
  const { devToken, user } = await requestPasswordReset(email);

  if (user) {
    const resetUrl = `${env.frontendUrl}/admin/reset-password?token=${encodeURIComponent(devToken ?? '')}`;
    await recordAudit(
      {
        action: 'auth.password_reset_requested',
        actor: { id: String(user._id), email: user.email, role: user.role },
        entityType: 'user',
        entityId: String(user._id),
        summary: `Password reset requested for ${user.email}`,
      },
      req,
    );

    if (devToken) {
      // Non-production: no SMTP needed to test the flow.
      logger.info({ resetUrl }, 'Password reset link (development)');
    } else {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your Kadamba Studio password',
          text: [
            `Hello ${user.name},`,
            '',
            'A password reset was requested for your Kadamba Studio account.',
            'This link expires in 30 minutes and can only be used once:',
            resetUrl,
            '',
            'If you did not request this, you can ignore this email.',
          ].join('\n'),
          html: `
            <p>Hello ${user.name},</p>
            <p>A password reset was requested for your Kadamba Studio account.</p>
            <p><a href="${resetUrl}">Reset your password</a> — this link expires in 30 minutes and can only be used once.</p>
            <p>If you did not request this, you can ignore this email.</p>
          `,
        });
      } catch (error) {
        logger.error({ err: error }, 'Password reset email failed');
      }
    }
  }

  // Same response either way — no account enumeration.
  res.status(200).json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
    data: devToken ? { devToken } : undefined,
  });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user } = await resetPassword({
    token: String(req.body?.token ?? ''),
    password: String(req.body?.password ?? ''),
  });

  await recordAudit(
    {
      action: 'auth.password_reset_completed',
      actor: { id: String(user._id), email: user.email, role: user.role },
      entityType: 'user',
      entityId: String(user._id),
      summary: `Password reset completed for ${user.email}`,
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: 'Password updated. Please sign in with your new password.',
  });
});

/* -------------------------------------------------------------------------- */
/* Two-factor authentication                                                  */
/* -------------------------------------------------------------------------- */

export const mfaStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Two-factor status',
    data: { enabled: user.mfaEnabled },
  });
});

export const mfaEnrollStart = asyncHandler(async (req: Request, res: Response) => {
  const result = await startMfaEnrollment(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Scan the QR code with your authenticator app',
    data: result,
  });
});

export const mfaEnrollConfirm = asyncHandler(async (req: Request, res: Response) => {
  const result = await confirmMfaEnrollment(req.user!.id, String(req.body?.code ?? ''));
  await recordAudit(
    {
      action: 'auth.mfa_enabled',
      actor: { id: req.user!.id, role: req.user!.role },
      entityType: 'user',
      entityId: req.user!.id,
      summary: 'Enabled two-factor authentication',
    },
    req,
  );
  res.status(200).json({
    success: true,
    message: 'Two-factor authentication enabled. Store these recovery codes safely.',
    data: result,
  });
});

export const mfaDisable = asyncHandler(async (req: Request, res: Response) => {
  const result = await disableMfa(
    req.user!.id,
    String(req.body?.password ?? ''),
    String(req.body?.code ?? ''),
  );
  await recordAudit(
    {
      action: 'auth.mfa_disabled',
      actor: { id: req.user!.id, role: req.user!.role },
      entityType: 'user',
      entityId: req.user!.id,
      summary: 'Disabled two-factor authentication',
    },
    req,
  );
  clearRefreshCookie(res);
  res.status(200).json({
    success: true,
    message: 'Two-factor authentication disabled. Please sign in again.',
    data: result,
  });
});

export const mfaBackupCodes = asyncHandler(async (req: Request, res: Response) => {
  const result = await regenerateBackupCodes(req.user!.id, String(req.body?.password ?? ''));
  res.status(200).json({
    success: true,
    message: 'New recovery codes generated',
    data: result,
  });
});

/* -------------------------------------------------------------------------- */
/* Sessions & permissions                                                     */
/* -------------------------------------------------------------------------- */

export const sessions = asyncHandler(async (req: Request, res: Response) => {
  const items = await listUserSessions(req.user!.id, req.user!.sid);
  res.status(200).json({
    success: true,
    message: 'Active sessions',
    data: { items },
  });
});

export const revokeSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const familyId = String(req.params.id ?? '');
  if (!familyId) throw new ApiError(400, 'Session id is required');

  if (familyId === req.user!.sid) {
    throw new ApiError(400, 'Use sign out to end the current session');
  }

  await revokeFamily(familyId, 'revoked_by_user');
  await recordAudit(
    {
      action: 'auth.sessions_revoked',
      actor: { id: req.user!.id, role: req.user!.role },
      entityType: 'session',
      entityId: familyId,
      summary: 'Revoked another device session',
    },
    req,
  );
  res.status(200).json({ success: true, message: 'Session revoked' });
});

export const revokeAllSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await revokeAllSessions(req.user!.id);
  clearRefreshCookie(res);
  await recordAudit(
    {
      action: 'auth.sessions_revoked',
      actor: { id: req.user!.id, role: req.user!.role },
      entityType: 'user',
      entityId: req.user!.id,
      summary: 'Signed out of all devices',
    },
    req,
  );
  res.status(200).json({
    success: true,
    message: 'Signed out of all devices',
    data: result,
  });
});

export const setPermissions = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id ?? '');
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  const user = await setUserPermissions(userId, permissions);
  await recordAudit(
    {
      action: 'user.permissions_changed',
      actor: { id: req.user!.id, role: req.user!.role },
      entityType: 'user',
      entityId: userId,
      summary: `Updated permissions for ${user.email}`,
      changes: { permissions },
    },
    req,
  );
  res.status(200).json({
    success: true,
    message: 'Permissions updated',
    data: { user },
  });
});

/* -------------------------------------------------------------------------- */
/* Audit desk                                                                 */
/* -------------------------------------------------------------------------- */

export const auditLogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAuditLogs(req.query as Record<string, string>);
  res.status(200).json({
    success: true,
    message: 'Audit log',
    data: result,
  });
});

export const auditVerify = asyncHandler(async (_req: Request, res: Response) => {
  const result = await verifyAuditChain();
  res.status(200).json({
    success: true,
    message: result.valid ? 'Audit chain intact' : 'Audit chain broken',
    data: result,
  });
});
