import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  deleteMediaHandler,
  getMediaHandler,
  listFoldersHandler,
  listMediaHandler,
  regenerateMediaHandler,
  updateMediaHandler,
} from '../controllers/mediaController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * Media library desk.
 *
 * Uploading (`POST /api/upload`) stays role-gated so any team member can add a
 * product photo. *Curating* the library — listing every file, changing alt
 * text, rebuilding variants, deleting — is capability-gated, because deletion
 * is destructive and alt text drives accessibility on the public site.
 */
router.use(authenticate, authorize('admin', 'staff'));

router.get(
  '/',
  requirePermission('media:read'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('kind').optional().isIn(['image', 'video']),
    query('unusedOnly').optional().isBoolean(),
  ],
  validateRequest,
  listMediaHandler,
);

router.get('/folders', requirePermission('media:read'), listFoldersHandler);

router.get(
  '/:id',
  requirePermission('media:read'),
  [param('id').isMongoId().withMessage('Invalid media id')],
  validateRequest,
  getMediaHandler,
);

router.patch(
  '/:id',
  requirePermission('media:write'),
  [
    param('id').isMongoId().withMessage('Invalid media id'),
    body('alt').isString().isLength({ max: 300 }).withMessage('alt must be at most 300 characters'),
  ],
  validateRequest,
  updateMediaHandler,
);

router.post(
  '/:id/regenerate',
  requirePermission('media:write'),
  [param('id').isMongoId().withMessage('Invalid media id')],
  validateRequest,
  regenerateMediaHandler,
);

router.delete(
  '/:id',
  requirePermission('media:write'),
  [param('id').isMongoId().withMessage('Invalid media id')],
  validateRequest,
  deleteMediaHandler,
);

export default router;
