import { Router } from 'express';
import { param } from 'express-validator';
import {
  createBlogHandler,
  getBlogHandler,
  listBlogsHandler,
  removeBlogHandler,
  updateBlogHandler,
} from '../controllers/blogController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { validateBody } from '../middleware/validateBody';
import { blogWriteSchema } from '../shared/schemas';

const router = Router();

router.get('/', optionalAuthenticate, listBlogsHandler);
router.get('/:idOrSlug', optionalAuthenticate, getBlogHandler);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  validateBody(blogWriteSchema),
  createBlogHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  validateBody(blogWriteSchema.partial()),
  updateBlogHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeBlogHandler,
);

export default router;
