import { Router, type Request, type Response } from 'express';
import { query } from 'express-validator';
import mongoose from 'mongoose';
import { Blog } from '../models/Blog';
import { GalleryItem } from '../models/GalleryItem';
import { Portfolio } from '../models/Portfolio';
import { Service } from '../models/Service';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { suggestUniqueSlug, slugify } from '../utils/generateSeo';

type ModelLike = {
  exists: (filter: Record<string, unknown>) => Promise<unknown>;
};

function makeSlugHandler(Model: ModelLike) {
  return asyncHandler(async (req: Request, res: Response) => {
    const raw = String(req.query.slug || '').trim();
    const excludeId = typeof req.query.excludeId === 'string' ? req.query.excludeId : undefined;
    const slug = slugify(raw);

    if (!slug) {
      res.status(200).json({
        success: true,
        message: 'Slug check',
        data: { available: false, suggestion: 'item' },
      });
      return;
    }

    const filter: Record<string, unknown> = { slug };
    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    const taken = Boolean(await Model.exists(filter));
    if (!taken) {
      res.status(200).json({
        success: true,
        message: 'Slug available',
        data: { available: true, slug },
      });
      return;
    }

    const suggestion = await suggestUniqueSlug(slug, async (s) => {
      const f: Record<string, unknown> = { slug: s };
      if (excludeId && mongoose.isValidObjectId(excludeId)) {
        f._id = { $ne: excludeId };
      }
      return Boolean(await Model.exists(f));
    });

    res.status(200).json({
      success: true,
      message: 'Slug taken',
      data: { available: false, slug, suggestion },
    });
  });
}

const checks = [
  query('slug').trim().notEmpty().withMessage('slug is required'),
  query('excludeId').optional().isString(),
];

/**
 * Mount under /api/admin — provides slug-available for CMS collections.
 */
export function createSlugAvailableRouter(): Router {
  const router = Router();
  router.use(authenticate, authorize('admin'));

  router.get('/blogs/slug-available', checks, validateRequest, makeSlugHandler(Blog));
  router.get('/services/slug-available', checks, validateRequest, makeSlugHandler(Service));
  router.get('/portfolio/slug-available', checks, validateRequest, makeSlugHandler(Portfolio));
  router.get('/gallery/slug-available', checks, validateRequest, makeSlugHandler(GalleryItem));

  return router;
}
