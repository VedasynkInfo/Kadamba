import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminSettingsHandler,
  patchSettingsHandler,
  putAdminSettingsHandler,
  testEmailHandler,
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * Admin-only. These settings include SMTP credentials and integration secrets,
 * so they are deliberately not delegable via `content:write` — a staff editor
 * can change the public site copy, not the studio's mail server.
 */
router.use(authenticate, authorize('admin'));

router.get('/', getAdminSettingsHandler);

router.patch('/', patchSettingsHandler);

router.put(
  '/',
  [
    body('studioName').optional().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validateRequest,
  putAdminSettingsHandler,
);

router.post(
  '/test-email',
  [body('to').optional().isEmail().normalizeEmail()],
  validateRequest,
  testEmailHandler,
);

export default router;
