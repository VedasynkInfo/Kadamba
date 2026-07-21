import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

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

  // Cloudinary storage sets `path` to the secure delivery URL.
  // Local disk fallback returns a same-origin path proxied via Vite `/uploads`.
  const url = viaCloudinary
    ? file.path
    : `/uploads/${file.filename || file.path?.split(/[/\\]/).pop()}`;

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
