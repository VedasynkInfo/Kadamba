import type { Request, Response } from 'express';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function absoluteLocalUploadUrl(req: Request, filename: string): string {
  const base =
    env.publicApiUrl ||
    (() => {
      const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https')
        .split(',')[0]
        .trim();
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost';
      return `${proto}://${host}`;
    })();
  return `${base.replace(/\/$/, '')}/uploads/${filename}`;
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
    : absoluteLocalUploadUrl(req, filename);

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
