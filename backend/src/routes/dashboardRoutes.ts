import { Router } from 'express';
import { query } from 'express-validator';
import {
  getDashboardBadgesHandler,
  getDashboardSummaryHandler,
} from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get(
  '/summary',
  authenticate,
  authorize('admin'),
  [
    query('from').optional().isISO8601().withMessage('from parameter must be a valid ISO8601 date'),
    query('to').optional().isISO8601().withMessage('to parameter must be a valid ISO8601 date'),
  ],
  validateRequest,
  getDashboardSummaryHandler
);

router.get('/badges', authenticate, authorize('admin', 'staff'), getDashboardBadgesHandler);

export default router;
