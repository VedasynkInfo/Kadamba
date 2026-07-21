import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createPortfolioHandler,
  getPortfolioHandler,
  listPortfolioHandler,
  removePortfolioHandler,
  updatePortfolioHandler,
} from '../controllers/portfolioController';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { PORTFOLIO_CATEGORIES } from '../models/Portfolio';

const router = Router();

router.get('/', optionalAuthenticate, listPortfolioHandler);
router.get('/:idOrSlug', optionalAuthenticate, getPortfolioHandler);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Title is required'),
    body('category').isIn([...PORTFOLIO_CATEGORIES]).withMessage('Invalid category'),
    body('summary').trim().isLength({ min: 2, max: 500 }).withMessage('Summary is required'),
    body('bannerImage').trim().notEmpty().withMessage('Banner image is required'),
    body('bannerAlt').trim().notEmpty().withMessage('Banner alt is required'),
    body('coverImage').trim().notEmpty().withMessage('Cover image is required'),
    body('coverAlt').trim().notEmpty().withMessage('Cover alt is required'),
    body('published').optional().isBoolean(),
  ],
  validateRequest,
  createPortfolioHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  updatePortfolioHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removePortfolioHandler,
);

export default router;
