import { Router } from 'express';
import { resolveMediaHandler } from '../controllers/mediaController';

/**
 * Public media metadata resolver — mounted at `/api/media`.
 *
 * Deliberately unauthenticated: the public marketing site renders images
 * without a session, and the data returned (variant URLs, dimensions, a
 * blurhash) describes files that are already publicly fetchable. Nothing here
 * lists or enumerates the library; a caller only gets answers for URLs it
 * already possesses.
 */
const router = Router();

router.get('/resolve', resolveMediaHandler);
router.post('/resolve', resolveMediaHandler);

export default router;
