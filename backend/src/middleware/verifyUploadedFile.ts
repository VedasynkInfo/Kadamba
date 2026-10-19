import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { ApiError } from '../utils/ApiError';
import { detectFileType, ALLOWED_UPLOAD_MIMES } from '../utils/fileSignature';

/**
 * Post-multer guard. Multer's `fileFilter` only sees the (spoofable) client
 * Content-Type, so we re-verify the file that actually landed on disk by
 * reading its magic bytes. On mismatch the file is deleted and the request is
 * rejected with 400 — nothing unsafe is ever persisted or served.
 *
 * Must run AFTER the multer middleware and BEFORE the controller.
 */
export function verifyUploadedFile(req: Request, _res: Response, next: NextFunction) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return next(); // no file — controller will handle

  const path = (file as { path?: string }).path;
  if (!path) {
    return next(ApiError.uploadInvalid('Upload failed: no stored file'));
  }

  let buf: Buffer;
  try {
    // Only the first 4KB are needed for signature detection.
    const fd = fs.openSync(path, 'r');
    try {
      buf = Buffer.alloc(4096);
      const read = fs.readSync(fd, buf, 0, 4096, 0);
      buf = buf.subarray(0, read);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return next(ApiError.uploadInvalid('Upload failed: could not read file'));
  }

  const detected = detectFileType(buf);
  if (!detected || !ALLOWED_UPLOAD_MIMES.has(detected.mime)) {
    // Remove the unsafe/mislabelled file immediately.
    fs.unlink(path, () => undefined);
    return next(
      ApiError.uploadInvalid(
        'Unsupported or spoofed file type. Allowed: JPEG, PNG, WebP, GIF, AVIF, BMP, MP4, WebM, MOV.',
      ),
    );
  }

  // Trust the real signature, not the client's Content-Type.
  file.mimetype = detected.mime;
  next();
}
