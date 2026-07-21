import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createGallery,
  getGallery,
  listGallery,
  removeGallery,
  updateGallery,
} from '../controllers/galleryController';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { GALLERY_CATEGORIES } from '../models/GalleryItem';

const router = Router();

router.get('/', optionalAuthenticate, listGallery);
router.get('/:idOrSlug', optionalAuthenticate, getGallery);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Title is required'),
    body('category').isIn([...GALLERY_CATEGORIES]).withMessage('Invalid category'),
    body('src').trim().notEmpty().withMessage('Media URL is required'),
    body('alt').optional().trim().isLength({ max: 200 }),
    body('mediaType').optional().isIn(['image', 'video']),
    body('width').optional().isInt({ min: 1 }),
    body('height').optional().isInt({ min: 1 }),
    body('published').optional().isBoolean(),
    body('sortOrder').optional().isInt(),
  ],
  validateRequest,
  createGallery,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  updateGallery,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeGallery,
);

export default router;
