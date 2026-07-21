import { Router } from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';
import {
  addNoteHandler,
  createLead,
  exportLeadsHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler,
} from '../controllers/leadController';
import { authenticate, authorize } from '../middleware/auth';
import { publicWriteRateLimiter } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validate';
import { LEAD_STATUSES } from '../models/Lead';

const router = Router();

const inspirationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image uploads are allowed'));
  },
});

router.post(
  '/',
  publicWriteRateLimiter,
  inspirationUpload.array('inspiration', 4),
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone')
      .trim()
      .custom((value: string) => value.replace(/\D/g, '').length >= 10)
      .withMessage('Valid phone number is required'),
    body('city').trim().isLength({ min: 2, max: 80 }).withMessage('City is required'),
    body('service').trim().isLength({ min: 2, max: 120 }).withMessage('Service is required'),
    body('occasion').trim().isLength({ min: 2, max: 120 }).withMessage('Occasion is required'),
    body('budget').trim().isLength({ min: 2, max: 80 }).withMessage('Budget is required'),
    body('preferredDate')
      .trim()
      .isISO8601()
      .withMessage('Valid preferred date is required')
      .custom((value: string) => {
        const day = value.slice(0, 10);
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return day >= `${y}-${m}-${d}`;
      })
      .withMessage('Preferred date cannot be in the past'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be 10-2000 characters'),
  ],
  validateRequest,
  createLead,
);

router.get('/', authenticate, authorize('admin'), listLeadsHandler);
router.get('/export', authenticate, authorize('admin'), exportLeadsHandler);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId()],
  validateRequest,
  getLeadHandler,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId(),
    body('status').optional().isIn([...LEAD_STATUSES]),
    body('assignee').optional().trim().isLength({ min: 1, max: 80 }),
  ],
  validateRequest,
  updateLeadHandler,
);

router.post(
  '/:id/notes',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId(),
    body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Note body is required'),
    body('author').optional().trim().isLength({ max: 80 }),
  ],
  validateRequest,
  addNoteHandler,
);

export default router;
