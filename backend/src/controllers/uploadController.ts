import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { registerUploadedFile } from '../services/mediaService';

/**
 * POST /api/upload
 *
 * Stores a single image or video on local disk (see `config/storage.ts`) and
 * records an `ImageAsset`. For images, responsive AVIF/WebP/JPEG variants are
 * generated alongside the untouched original.
 *
 * The response keeps the original `url`/`publicId`/`size` shape that existing
 * callers depend on, and adds an `asset` block the newer UI reads for srcset,
 * blurhash placeholders and aspect-ratio hints.
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const file = req.file as Express.Multer.File;
  const absPath = file.path || (file as { destination?: string }).destination;
  if (!absPath) {
    throw new ApiError(400, 'Upload failed: no stored file');
  }

  const folder =
    typeof req.query.folder === 'string' && req.query.folder.trim()
      ? req.query.folder.trim().slice(0, 60)
      : 'general';

  const asset = await registerUploadedFile({
    absPath,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder,
    uploadedBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: asset.originalUrl,
      publicId: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storage: 'local',
      asset: {
        id: String(asset._id),
        hash: asset.hash,
        kind: asset.kind,
        width: asset.width,
        height: asset.height,
        aspectRatio: asset.aspectRatio,
        blurhash: asset.blurhash,
        dominantColor: asset.dominantColor,
        variants: asset.variants,
      },
    },
  });
});
