import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, profile, refresh } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Public self-registration is intentionally disabled. The first admin is
// created out-of-band via `npm run seed:admin` (see backend/src/scripts).

router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login,
);

router.get('/me', authenticate, me);
router.post('/refresh', authenticate, refresh);

router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('currentPassword').optional().isString(),
    body('newPassword').optional().isLength({ min: 8 }),
  ],
  validateRequest,
  profile,
);

export default router;
