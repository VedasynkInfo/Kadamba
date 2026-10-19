import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  auditLogs,
  auditVerify,
  forgotPassword,
  login,
  logout,
  me,
  mfaBackupCodes,
  mfaDisable,
  mfaEnrollConfirm,
  mfaEnrollStart,
  mfaStatus,
  profile,
  refresh,
  resetPasswordHandler,
  revokeAllSessionsHandler,
  revokeSessionHandler,
  sessions,
  setPermissions,
  verifyMfa,
} from '../controllers/authController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { authRateLimiter, loginAccountRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validate';
import { requireTrustedOrigin } from '../middleware/trustedOrigin';

const router = Router();

// Public self-registration is intentionally disabled. The first admin is
// created out-of-band via `npm run seed:admin` (see backend/src/scripts).

router.post(
  '/login',
  authRateLimiter,
  loginAccountRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login,
);

router.post(
  '/login/mfa',
  authRateLimiter,
  [
    body('mfaTicket').isString().notEmpty().withMessage('Verification ticket is required'),
    body('code').optional().isString(),
    body('recoveryCode').optional().isString(),
  ],
  validateRequest,
  verifyMfa,
);

router.post(
  '/refresh',
  authRateLimiter,
  requireTrustedOrigin,
  // The refresh token lives in an httpOnly cookie; the body fallback keeps
  // non-browser clients working.
  refresh,
);

router.post('/logout', authenticate, requireTrustedOrigin, logout);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validateRequest,
  forgotPassword,
);

router.post(
  '/reset-password',
  passwordResetRateLimiter,
  [
    body('token').isString().notEmpty().withMessage('Reset token is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  resetPasswordHandler,
);

router.get('/me', authenticate, me);

router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('currentPassword').optional().isString(),
    body('newPassword').optional().isString(),
  ],
  validateRequest,
  profile,
);

/* -------------------------------------------------------------------------- */
/* Two-factor authentication                                                  */
/* -------------------------------------------------------------------------- */

router.get('/mfa', authenticate, mfaStatus);
router.post('/mfa/enroll', authenticate, mfaEnrollStart);
router.post(
  '/mfa/enroll/confirm',
  authenticate,
  [body('code').isString().notEmpty()],
  validateRequest,
  mfaEnrollConfirm,
);
router.post(
  '/mfa/disable',
  authenticate,
  [body('password').isString().notEmpty(), body('code').isString().notEmpty()],
  validateRequest,
  mfaDisable,
);
router.post(
  '/mfa/backup-codes',
  authenticate,
  [body('password').isString().notEmpty()],
  validateRequest,
  mfaBackupCodes,
);

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

router.get('/sessions', authenticate, sessions);
router.delete('/sessions/:id', authenticate, revokeSessionHandler);
router.post('/sessions/revoke-all', authenticate, revokeAllSessionsHandler);

/* -------------------------------------------------------------------------- */
/* User administration & audit                                                */
/* -------------------------------------------------------------------------- */

router.put(
  '/users/:id/permissions',
  authenticate,
  authorize('admin'),
  requirePermission('users:manage'),
  [param('id').isMongoId(), body('permissions').isArray()],
  validateRequest,
  setPermissions,
);

router.get(
  '/audit',
  authenticate,
  authorize('admin'),
  requirePermission('audit:read'),
  auditLogs,
);

router.get(
  '/audit/verify',
  authenticate,
  authorize('admin'),
  requirePermission('audit:read'),
  auditVerify,
);

export default router;
