import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  deleteMedia,
  getMediaById,
  listFolders,
  listMedia,
  regenerateVariants,
  resolveAssets,
  updateMediaAlt,
} from '../services/mediaService';
import { actorFromRequest, recordAudit } from '../services/auditService';

/**
 * GET /api/media/resolve?urls=<url>&urls=<url>…
 *
 * Public, unauthenticated batch resolver. Given image URLs the caller is about
 * to render, returns the responsive variant list, intrinsic dimensions and
 * blurhash so `OptimizedImage` can emit a real `srcset`/`<picture>` without
 * every content payload carrying media metadata.
 *
 * Only `/uploads/` URLs are answered, and only for assets that exist — the
 * response is derived entirely from data the caller can already fetch.
 */
export const resolveMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.urls ?? (req.body as { urls?: unknown } | undefined)?.urls;

  const urls = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string'
      ? raw.split(',')
      : [];

  const items = await resolveAssets(urls.map((u) => u.trim()).filter(Boolean));

  // Public asset metadata is stable; let the browser and any CDN keep it.
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
  res.status(200).json({ success: true, message: 'Resolved media', data: { items } });
});

/** GET /api/admin/media — paginated library with per-asset usage. */
export const listMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, folder, kind, q, unusedOnly } = req.query as Record<string, string>;
  const data = await listMedia({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    folder: folder || undefined,
    kind: kind === 'image' || kind === 'video' ? kind : undefined,
    q: q || undefined,
    unusedOnly: unusedOnly === 'true',
  });
  res.status(200).json({ success: true, message: 'Media library', data });
});

/** GET /api/admin/media/folders — distinct folder names for the filter. */
export const listFoldersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const folders = await listFolders();
  res.status(200).json({ success: true, message: 'Media folders', data: folders });
});

/** GET /api/admin/media/:id */
export const getMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const asset = await getMediaById(String(req.params.id));
  if (!asset) throw new ApiError(404, 'Media asset not found');
  res.status(200).json({ success: true, message: 'Media asset', data: asset });
});

/** PATCH /api/admin/media/:id — currently alt text only. */
export const updateMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const alt = String(req.body?.alt ?? '');
  const asset = await updateMediaAlt(String(req.params.id), alt.slice(0, 300));
  if (!asset) throw new ApiError(404, 'Media asset not found');

  await recordAudit(
    {
      action: 'media.updated',
      actor: actorFromRequest(req),
      entityType: 'media',
      entityId: String(asset._id),
      summary: `Updated alt text for ${asset.originalName ?? asset.hash}`,
      changes: { alt: asset.alt },
    },
    req,
  );

  res.status(200).json({ success: true, message: 'Media updated', data: asset });
});

/** POST /api/admin/media/:id/regenerate — rebuild variants from the original. */
export const regenerateMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const asset = await regenerateVariants(String(req.params.id));
  if (!asset) throw new ApiError(404, 'Media asset not found or original missing');

  await recordAudit(
    {
      action: 'media.variants_regenerated',
      actor: actorFromRequest(req),
      entityType: 'media',
      entityId: String(asset._id),
      summary: `Regenerated ${asset.variants.length} variant(s) for ${asset.originalName ?? asset.hash}`,
    },
    req,
  );

  res.status(200).json({ success: true, message: 'Variants regenerated', data: asset });
});

/**
 * DELETE /api/admin/media/:id
 *
 * Orphan-safe: refuses with 409 when content still references the file unless
 * `?force=true` is passed. Variants are always removed (regenerable); the
 * original is only unlinked when forced.
 */
export const deleteMediaHandler = asyncHandler(async (req: Request, res: Response) => {
  const force = req.query.force === 'true' || req.body?.force === true;

  const result = await deleteMedia(String(req.params.id), { force });
  if (!result) throw new ApiError(404, 'Media asset not found');

  if (!result.deleted) {
    throw new ApiError(409, 'This file is still in use', [
      { usage: result.blockedBy, hint: 'Retry with ?force=true to delete anyway' },
    ]);
  }

  await recordAudit(
    {
      action: 'media.deleted',
      actor: actorFromRequest(req),
      entityType: 'media',
      entityId: String(req.params.id),
      summary: `Deleted a media asset (${result.removedFiles} file(s) removed)`,
      changes: { force },
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: 'Media deleted',
    data: { removedFiles: result.removedFiles },
  });
});
