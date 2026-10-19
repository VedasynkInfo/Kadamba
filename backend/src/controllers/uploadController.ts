import type { Request, Response } from 'express';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

/**
 * Build an absolute URL for a locally-stored upload.
 *
 * Derived ONLY from trusted configuration (PUBLIC_API_URL / RENDER_EXTERNAL_URL).
 * We deliberately do NOT read x-forwarded-host/proto here — on Render those are
 * client-controllable and would let an attacker poison the returned URL.
 */
function absoluteLocalUploadUrl(filename: string): string {
  const base =
    env.publicApiUrl ||
    (env.isProduction ? '' : `http://localhost:${env.port}`);
  if (!base) {
    // Production without an explicit origin — fall back to a path-only URL.
    return `/uploads/${filename}`;
  }
  return `${base.replace(/\/$/, '')}/uploads/${encodeURIComponent(filename)}`;
}

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const file = req.file as Express.Multer.File & {
    path?: string;
    filename?: string;
  };

  const viaCloudinary = Boolean(
    (req as Request & { uploadViaCloudinary?: boolean }).uploadViaCloudinary,
  );

  const filename = file.filename || file.path?.split(/[/\\]/).pop() || '';
  // Cloudinary storage sets `path` to the secure delivery URL.
  // Local disk returns an absolute API URL so the SPA (separate origin) can load it.
  const url = viaCloudinary
    ? file.path
    : absoluteLocalUploadUrl(filename);

  if (!url) {
    throw new ApiError(500, 'Upload succeeded but no URL was returned');
  }

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url,
      publicId: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storage: viaCloudinary ? 'cloudinary' : 'local',
    },
  });
});
