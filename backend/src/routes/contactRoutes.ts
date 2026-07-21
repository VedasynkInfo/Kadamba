import { Router } from 'express';
import { body } from 'express-validator';
import { submitContact } from '../controllers/contactController';
import { publicWriteRateLimiter } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post(
  '/',
  publicWriteRateLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone')
      .trim()
      .custom((value: string) => value.replace(/\D/g, '').length >= 10)
      .withMessage('Valid phone number is required'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be 10-2000 characters'),
  ],
  validateRequest,
  submitContact,
);

export default router;
