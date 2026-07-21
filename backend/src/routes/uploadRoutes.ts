import { Router, type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { uploadImage } from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function cloudinaryReady(): boolean {
  return Boolean(
    env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
  );
}

const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder =
      typeof req.query?.folder === 'string' && req.query.folder.trim()
        ? `kadamba-uploads/${req.query.folder.trim()}`
        : 'kadamba-uploads';
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder,
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'webm', 'mov']
        : ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: isVideo ? undefined : [{ width: 1600, height: 1600, crop: 'limit' }],
    };
  },
});

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage: cloudinaryReady() ? cloudStorage : diskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image or video uploads are allowed'));
  },
});

/** Accept either `file` or legacy `image` field name. */
function uploadMedia(req: Request, res: Response, next: NextFunction) {
  upload.any()(req, res, (err: unknown) => {
    if (err) return next(err);
    const files = req.files as Express.Multer.File[] | undefined;
    if (files?.length) {
      req.file = files[0];
    }
    // Flag for controller so local URLs are shaped correctly
    (req as Request & { uploadViaCloudinary?: boolean }).uploadViaCloudinary =
      cloudinaryReady();
    next();
  });
}

router.post('/', authenticate, authorize('admin'), uploadMedia, uploadImage);

export default router;
