import { Router, type Request, type RequestHandler, type Response } from 'express';
import { query } from 'express-validator';
import mongoose from 'mongoose';
import { Blog } from '../models/Blog';
import { GalleryItem } from '../models/GalleryItem';
import { Portfolio } from '../models/Portfolio';
import { Service } from '../models/Service';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
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

  /**
   * A helper for the CMS editors — reachable by anyone who can write content.
   *
   * The gate is attached per route, not with `router.use`. Mounted under
   * `/api/admin`, a blanket `use` would run for *every* unmatched admin path
   * (a typo, a removed endpoint) and answer 403 to a staff member who lacks
   * `content:write` — hiding a genuine 404 behind a permission error. Per route,
   * an unknown admin URL falls through to the real not-found handler.
   */
  const gate: RequestHandler[] = [
    authenticate,
    authorize('admin', 'staff'),
    requirePermission('content:write'),
  ];

  router.get('/blogs/slug-available', ...gate, checks, validateRequest, makeSlugHandler(Blog));
  router.get('/services/slug-available', ...gate, checks, validateRequest, makeSlugHandler(Service));
  router.get('/portfolio/slug-available', ...gate, checks, validateRequest, makeSlugHandler(Portfolio));
  router.get('/gallery/slug-available', ...gate, checks, validateRequest, makeSlugHandler(GalleryItem));

  return router;
}
