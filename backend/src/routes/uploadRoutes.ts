import { Router, type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { uploadImage } from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { verifyUploadedFile } from '../middleware/verifyUploadedFile';

const router = Router();

export const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/** True when real (non-placeholder) Cloudinary credentials are configured. */
function cloudinaryCredentialsPresent(): boolean {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return false;
  if (cloudName.startsWith('your_') || apiKey.startsWith('your_') || apiSecret.startsWith('your_')) {
    return false;
  }
  // Reject obviously truncated / mistyped keys (Cloudinary keys are numeric-ish, no trailing letters like "s").
  if (!/^\d+$/.test(apiKey.trim())) return false;
  return true;
}

/**
 * Prefer local disk by default (UPLOAD_STORAGE=local).
 * Use Cloudinary only when explicitly requested and credentials look valid.
 */
export function useCloudinaryUpload(): boolean {
  if (env.uploadStorage === 'local') return false;
  if (env.uploadStorage === 'cloudinary') return cloudinaryCredentialsPresent();
  // auto
  return cloudinaryCredentialsPresent();
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
  storage: useCloudinaryUpload() ? cloudStorage : diskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1, // single file only
    fields: 8,
  },
  fileFilter: (_req, file, cb) => {
    // Coarse gate on the client-declared type; the real check is the
    // magic-byte verification in verifyUploadedFile (which runs after).
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image or video uploads are allowed'));
  },
});

/**
 * Accept a single file under an explicit field whitelist. Replaces the old
 * `upload.any()`, which accepted unlimited fields and any name. Unknown names
 * are rejected rather than silently consumed.
 */
const SINGLE_UPLOAD_FIELDS = [
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
];

function uploadMedia(req: Request, res: Response, next: NextFunction) {
  upload.fields(SINGLE_UPLOAD_FIELDS)(req, res, (err: unknown) => {
    if (err) return next(err);
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const picked = files?.file?.[0] ?? files?.image?.[0];
    if (picked) {
      req.file = picked;
    }
    (req as Request & { uploadViaCloudinary?: boolean }).uploadViaCloudinary =
      useCloudinaryUpload();
    next();
  });
}

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  uploadMedia,
  verifyUploadedFile,
  uploadImage,
);

export default router;
