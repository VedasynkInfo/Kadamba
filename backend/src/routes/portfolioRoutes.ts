import { Router } from 'express';
import { param } from 'express-validator';
import {
  createPortfolioHandler,
  getPortfolioHandler,
  listPortfolioHandler,
  removePortfolioHandler,
  updatePortfolioHandler,
} from '../controllers/portfolioController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { validateBody } from '../middleware/validateBody';
import { portfolioWriteSchema } from '../shared/schemas';

const router = Router();

router.get('/', optionalAuthenticate, listPortfolioHandler);
router.get('/:idOrSlug', optionalAuthenticate, getPortfolioHandler);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  validateBody(portfolioWriteSchema),
  createPortfolioHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  validateBody(portfolioWriteSchema.partial()),
  updatePortfolioHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removePortfolioHandler,
);

export default router;
