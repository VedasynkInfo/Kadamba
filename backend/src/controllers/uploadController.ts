import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { extractBlobNameFromUrl, isAzureBlobUrl } from '../services/azureBlobService';
import { registerUploadedFile } from '../services/mediaService';

/**
 * POST /api/upload
 *
 * Stores a single image or video (Azure Blob Storage when `UPLOAD_STORAGE=azure`,
 * otherwise local disk — see `config/storage.ts`) and records an `ImageAsset`.
 * For images, responsive AVIF/WebP/JPEG variants are generated alongside the
 * untouched original.
 *
 * The response keeps the original `url`/`publicId`/`size` shape that existing
 * callers depend on, and adds an `asset` block the newer UI reads for srcset,
 * blurhash placeholders and aspect-ratio hints.
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.uploadInvalid('No file uploaded');
  }

  const file = req.file as Express.Multer.File;
  const absPath = file.path || (file as { destination?: string }).destination;
  if (!absPath) {
    throw ApiError.uploadInvalid('Upload failed: no stored file');
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

  const isAzure = isAzureBlobUrl(asset.originalUrl);

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: asset.originalUrl,
      publicId: isAzure ? (extractBlobNameFromUrl(asset.originalUrl) ?? file.filename) : file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storage: isAzure ? 'azure' : 'local',
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
