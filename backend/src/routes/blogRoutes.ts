import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createBlogHandler,
  getBlogHandler,
  listBlogsHandler,
  removeBlogHandler,
  updateBlogHandler,
} from '../controllers/blogController';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { BLOG_CATEGORIES } from '../models/Blog';

const router = Router();

router.get('/', optionalAuthenticate, listBlogsHandler);
router.get('/:idOrSlug', optionalAuthenticate, getBlogHandler);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title is required'),
    body('excerpt').trim().isLength({ min: 2, max: 500 }).withMessage('Excerpt is required'),
    body('category').isIn([...BLOG_CATEGORIES]).withMessage('Invalid category'),
    body('coverImage').trim().notEmpty().withMessage('Cover image is required'),
    body('coverAlt').trim().notEmpty().withMessage('Cover alt is required'),
    body('published').optional().isBoolean(),
    body('featured').optional().isBoolean(),
    body('readMinutes').optional().isInt({ min: 1 }),
  ],
  validateRequest,
  createBlogHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  updateBlogHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeBlogHandler,
);

export default router;
