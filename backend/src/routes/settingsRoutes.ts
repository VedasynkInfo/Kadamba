import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicSettingsHandler,
  getSettingsHandler,
  updateSettingsHandler,
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get('/public', getPublicSettingsHandler);
router.get('/', getSettingsHandler);

router.put(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('studioName').optional().trim().isLength({ min: 2, max: 120 }),
    body('location').optional().trim().isLength({ min: 2, max: 80 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phoneDisplay').optional().trim().notEmpty(),
    body('phoneTel').optional().trim().notEmpty(),
  ],
  validateRequest,
  updateSettingsHandler,
);

export default router;
