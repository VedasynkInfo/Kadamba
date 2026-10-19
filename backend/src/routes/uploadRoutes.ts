import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { ensureUploadDirs, uploadsDir } from '../config/storage';
import { uploadImage } from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { verifyUploadedFile } from '../middleware/verifyUploadedFile';
import { safeUploadName } from '../services/mediaService';

const router = Router();

// Originals live directly in the uploads directory so every URL already stored
// in the database keeps working. On Render this is the Persistent Disk mount.
ensureUploadDirs();

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, safeUploadName(file.originalname)),
});

const upload = multer({
  storage: diskStorage,
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
