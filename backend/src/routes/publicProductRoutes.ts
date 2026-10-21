import { Router } from 'express';
import {
  getPublicCatalogHandler,
  getPublicProductHandler,
} from '../controllers/productCatalogController';

/**
 * The public boutique catalogue.
 *
 * Kept separate from `/admin/products`: that router authenticates every path in
 * one `router.use`, and loosening it would put write handlers one typo away from
 * being anonymous. These two reads are the only public product surface.
 */
const router = Router();

router.get('/', getPublicCatalogHandler);
router.get('/:slug', getPublicProductHandler);

export default router;
