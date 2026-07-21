import { Router } from 'express';
import authRoutes from './authRoutes';
import blogRoutes from './blogRoutes';
import contactRoutes from './contactRoutes';
import galleryRoutes from './galleryRoutes';
import healthRoutes from './healthRoutes';
import leadRoutes from './leadRoutes';
import portfolioRoutes from './portfolioRoutes';
import serviceRoutes from './serviceRoutes';
import settingsRoutes from './settingsRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/gallery', galleryRoutes);
router.use('/services', serviceRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/blogs', blogRoutes);
router.use('/leads', leadRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);

export default router;
