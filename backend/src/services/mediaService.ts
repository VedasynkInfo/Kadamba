import fs from 'fs/promises';
import path from 'path';
import type { Types } from 'mongoose';
import { Blog } from '../models/Blog';
import { GalleryItem } from '../models/GalleryItem';
import { ImageAsset, type IImageAsset, type ImageVariant } from '../models/ImageAsset';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { Portfolio } from '../models/Portfolio';
import { ProductType } from '../models/ProductType';
import { Service } from '../models/Service';
import { Staff } from '../models/Staff';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { logger } from '../config/logger';
import { assetVariantDir, isInsideUploads, publicUploadUrl, uploadsDir } from '../config/storage';
import { hashFile, processImageFile, variantContentType } from '../utils/imagePipeline';
import { imageJobPool } from './jobPool';
import { ALLOWED_UPLOAD_MIMES, detectFileType } from '../utils/fileSignature';
import { ApiError } from '../utils/ApiError';
import {
  deleteBlob,
  deleteBlobsByPrefix,
  downloadBlobToFile,
  isAzureBlobConfigured,
  isAzureBlobUrl,
  isAzureStorageActive,
  uploadFileToBlob,
} from './azureBlobService';

/**
 * Where an uploaded file can be referenced. Kept as data rather than bespoke
 * per-model code so the media library's "used by" list stays in step with the
 * schema, and so orphan detection is exhaustive rather than best-effort.
 */
interface ReferenceSource {
  label: string;
  entityType: string;
  titleField: string;
  /**
   * Dot paths that may hold an upload URL. Array paths (e.g. `gallery.image`)
   * are matched element-wise; Mongoose `find` with a dot path already does the
   * right thing for arrays.
   */
  paths: string[];
  filter?: Record<string, unknown>;
}

const REFERENCE_SOURCES: ReferenceSource[] = [
  {
    label: 'Website settings',
    entityType: 'settings',
    titleField: 'studioName',
    paths: ['logoUrl', 'logoDarkUrl', 'defaultOgImage'],
  },
  {
    label: 'Blog post',
    entityType: 'blog',
    titleField: 'title',
    paths: ['coverImage', 'ogImage', 'twitterImage'],
  },
  {
    label: 'Portfolio project',
    entityType: 'portfolio',
    titleField: 'title',
    paths: [
      'image',
      'beforeImage',
      'afterImage',
      'bannerImage',
      'coverImage',
      'ogImage',
      'twitterImage',
      'gallery.image',
      'gallery.beforeImage',
      'gallery.afterImage',
    ],
  },
  {
    label: 'Service',
    entityType: 'service',
    titleField: 'title',
    paths: ['bannerImage', 'cardImage', 'ogImage', 'twitterImage', 'gallery.image'],
  },
  {
    label: 'Gallery item',
    entityType: 'gallery',
    titleField: 'title',
    paths: ['src', 'poster', 'ogImage', 'twitterImage'],
  },
  {
    label: 'Product type',
    entityType: 'productType',
    titleField: 'name',
    paths: ['image'],
  },
  {
    label: 'Staff member',
    entityType: 'staff',
    titleField: 'fullName',
    paths: ['photoUrl'],
  },
  {
    label: 'Measurement profile',
    entityType: 'measurement',
    titleField: 'profileName',
    paths: ['referenceImages'],
  },
];

const MODEL_BY_ENTITY: Record<string, { find: (q: Record<string, unknown>) => any }> = {
  settings: WebsiteSettings as unknown as { find: (q: Record<string, unknown>) => any },
  blog: Blog as unknown as { find: (q: Record<string, unknown>) => any },
  portfolio: Portfolio as unknown as { find: (q: Record<string, unknown>) => any },
  service: Service as unknown as { find: (q: Record<string, unknown>) => any },
  gallery: GalleryItem as unknown as { find: (q: Record<string, unknown>) => any },
  productType: ProductType as unknown as { find: (q: Record<string, unknown>) => any },
  staff: Staff as unknown as { find: (q: Record<string, unknown>) => any },
  measurement: MeasurementProfile as unknown as { find: (q: Record<string, unknown>) => any },
};

export interface MediaUsage {
  entityType: string;
  label: string;
  entityId: string;
  title: string;
  /** Which field on the record points at this file. */
  field: string;
}

/** Basename of an upload URL, ignoring query strings and fragments. */
function basenameOf(urlOrPath: string): string {
  const withoutQuery = String(urlOrPath).split(/[?#]/)[0];
  const parts = withoutQuery.split(/[/\\]/);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find every record that references this file.
 *
 * Matching is done on the file's basename as a suffix so it works whether the
 * stored value is an absolute API URL, a bare `/uploads/...` path, or a
 * Cloudinary URL that happens to end the same way.
 */
export async function findMediaUsage(originalUrl: string): Promise<MediaUsage[]> {
  const basename = basenameOf(originalUrl);
  if (!basename) return [];

  const suffix = new RegExp(`${escapeRegex(basename)}$`);
  const usage: MediaUsage[] = [];

  await Promise.all(
    REFERENCE_SOURCES.map(async (source) => {
      const model = MODEL_BY_ENTITY[source.entityType];
      if (!model) return;

      const or = source.paths.map((field) => ({ [field]: suffix }));
      const filter: Record<string, unknown> = { $or: or, ...(source.filter ?? {}) };

      // Project only what is needed: the identifying fields plus the TOP-LEVEL
      // segment of each path (e.g. `gallery` for `gallery.image`). Selecting
      // just the title would strip the very URL fields compared below.
      const projection = new Set<string>(['_id', source.titleField]);
      for (const path of source.paths) projection.add(path.split('.')[0]);

      try {
        const rows = await model
          .find(filter)
          .select([...projection].join(' '))
          .limit(50)
          .lean();

        for (const row of rows as Array<Record<string, unknown>>) {
          // Identify the specific field(s) that matched, for a precise report.
          for (const field of source.paths) {
            if (valueMatches(row, field, suffix)) {
              usage.push({
                entityType: source.entityType,
                label: source.label,
                entityId: String(row._id),
                title: String(row[source.titleField] ?? '(untitled)'),
                field,
              });
            }
          }
        }
      } catch (error) {
        logger.warn({ err: error, entityType: source.entityType }, 'Media usage scan failed');
      }
    }),
  );

  return usage;
}

/** Does a dotted path on a lean document hold a value matching `suffix`? */
function valueMatches(row: Record<string, unknown>, dottedPath: string, suffix: RegExp): boolean {
  const segments = dottedPath.split('.');
  let current: unknown = row;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      // Fan out across array elements: any match counts.
      return current.some((entry) => {
        if (entry === null || typeof entry !== 'object') {
          return typeof entry === 'string' && suffix.test(entry);
        }
        return valueMatches(entry as Record<string, unknown>, segment, suffix);
      });
    }
    if (current === null || typeof current !== 'object') return false;
    current = (current as Record<string, unknown>)[segment];
  }

  if (Array.isArray(current)) {
    return current.some((entry) => typeof entry === 'string' && suffix.test(entry));
  }
  return typeof current === 'string' && suffix.test(current);
}

export interface RegisterUploadInput {
  /** Absolute path of the stored original. */
  absPath: string;
  originalName?: string;
  mimeType: string;
  folder?: string;
  uploadedBy?: string;
}

/** Turn an untrusted filename into a safe, collision-free on-disk name. */
export function safeUploadName(originalName: string): string {
  const safe = (originalName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
}

/**
 * Persist an in-memory upload to the uploads directory and register it.
 *
 * The real format is taken from the file's magic bytes, never from the client's
 * declared Content-Type — the same rule the multer path enforces. Rejects
 * anything that is not an allow-listed image/video signature.
 */
export async function storeUploadedBuffer(input: {
  buffer: Buffer;
  originalName: string;
  folder?: string;
  uploadedBy?: string;
}): Promise<IImageAsset> {
  const detected = detectFileType(input.buffer);
  if (!detected || !ALLOWED_UPLOAD_MIMES.has(detected.mime)) {
    throw new ApiError(
      400,
      'Unsupported or spoofed file type. Allowed: JPEG, PNG, WebP, GIF, AVIF, BMP, MP4, WebM, MOV.',
    );
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = safeUploadName(input.originalName);
  const absPath = path.join(uploadsDir, filename);
  await fs.writeFile(absPath, input.buffer);

  return registerUploadedFile({
    absPath,
    originalName: input.originalName,
    mimeType: detected.mime,
    folder: input.folder,
    uploadedBy: input.uploadedBy,
  });
}

function safeFolderSegment(folder?: string): string {
  const cleaned = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
  return cleaned || 'general';
}

async function uploadVariantsToAzure(
  hash: string,
  variants: ImageVariant[],
): Promise<ImageVariant[]> {
  if (variants.length === 0) return [];
  const dir = assetVariantDir(hash);

  const uploaded = await Promise.all(
    variants.map(async (variant): Promise<ImageVariant | null> => {
      const variantFile = path.basename(variant.url);
      const localVariantPath = path.join(dir, variantFile);
      const blobName = `uploads/optimized/${hash}/${variantFile}`;
      try {
        const url = await uploadFileToBlob(blobName, localVariantPath, {
          contentType: variantContentType(variant.format),
        });
        return { ...variant, url };
      } catch (err) {
        logger.warn({ err, blobName }, 'Failed to upload image variant to Azure Blob');
        return null;
      }
    }),
  );

  return uploaded.filter((item): item is ImageVariant => item !== null);
}

/**
 * Record an upload: hash it, generate variants, and upsert the `ImageAsset`.
 *
 * When Azure Blob Storage is active (`UPLOAD_STORAGE=azure`), both the
 * original and generated variants are pushed to Azure Blob Storage and the
 * temporary local files are removed afterwards.
 *
 * The original file is never modified. Variant generation failure is logged and
 * swallowed — the upload still succeeds, it simply serves the original only.
 */
export async function registerUploadedFile(input: RegisterUploadInput): Promise<IImageAsset> {
  const filename = path.basename(input.absPath);
  const useAzure = isAzureStorageActive();

  const hash = await hashFile(input.absPath);
  const stat = await fs.stat(input.absPath);

  const isVideo = input.mimeType.startsWith('video/');
  const processed = isVideo
    ? { hash, kind: 'video' as const, bytes: stat.size, variants: [] }
    : await imageJobPool
        .run(`process:${filename}`, () => processImageFile(input.absPath, hash))
        .catch((error) => {
          logger.error({ err: error, absPath: input.absPath }, 'Image processing failed');
          return { hash, kind: 'image' as const, bytes: stat.size, variants: [] };
        });

  // Identical bytes already stored → reuse the existing variants, just record
  // this occurrence (the file on disk / blob is a distinct copy with its own URL).
  const existing = await ImageAsset.findOne({ hash }).lean();

  let originalUrl = publicUploadUrl(filename);
  let variantsToStore: ImageVariant[] = existing?.variants?.length
    ? existing.variants
    : processed.variants;

  if (useAzure) {
    const folderSeg = safeFolderSegment(input.folder);
    const originalBlobName = `uploads/${folderSeg}/${filename}`;
    originalUrl = await uploadFileToBlob(originalBlobName, input.absPath, {
      contentType: input.mimeType,
    });

    const reuseExistingAzureVariants =
      Boolean(existing?.variants?.length) &&
      existing!.variants.every((v) => isAzureBlobUrl(v.url));

    if (reuseExistingAzureVariants) {
      variantsToStore = existing!.variants;
    } else {
      variantsToStore = await uploadVariantsToAzure(hash, processed.variants);
    }

    // Remove temporary local files after successful Azure Blob upload.
    await fs.unlink(input.absPath).catch(() => undefined);
    if (isInsideUploads(assetVariantDir(hash))) {
      await fs.rm(assetVariantDir(hash), { recursive: true, force: true }).catch(() => undefined);
    }
  }

  const doc = await ImageAsset.findOneAndUpdate(
    { hash },
    {
      $set: {
        kind: processed.kind,
        // Latest URL wins for display; earlier copies are still valid.
        originalUrl,
        originalName: input.originalName,
        mimeType: input.mimeType,
        format: 'format' in processed ? processed.format : undefined,
        width: 'width' in processed ? processed.width : undefined,
        height: 'height' in processed ? processed.height : undefined,
        aspectRatio: 'aspectRatio' in processed ? processed.aspectRatio : undefined,
        bytes: processed.bytes,
        blurhash: existing?.blurhash ?? ('blurhash' in processed ? processed.blurhash : undefined),
        dominantColor:
          existing?.dominantColor ??
          ('dominantColor' in processed ? processed.dominantColor : undefined),
        variants: variantsToStore,
        folder: input.folder,
        uploadedBy: input.uploadedBy,
      },
      $setOnInsert: { hash },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return doc as IImageAsset;
}

export interface MediaListQuery {
  page?: number;
  limit?: number;
  folder?: string;
  kind?: 'image' | 'video';
  q?: string;
  unusedOnly?: boolean;
}

/** Paginated media library with a usage count per asset. */
export async function listMedia(query: MediaListQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));

  const filter: Record<string, unknown> = {};
  if (query.folder) filter.folder = query.folder;
  if (query.kind) filter.kind = query.kind;
  if (query.q) {
    const regex = new RegExp(escapeRegex(String(query.q)), 'i');
    filter.$or = [{ originalName: regex }, { alt: regex }, { hash: regex }];
  }

  const [items, total] = await Promise.all([
    ImageAsset.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ImageAsset.countDocuments(filter),
  ]);

  const withUsage = await Promise.all(
    items.map(async (asset) => {
      const usage = await findMediaUsage(asset.originalUrl);
      return { ...asset, usage };
    }),
  );

  const results = query.unusedOnly ? withUsage.filter((a) => a.usage.length === 0) : withUsage;

  return {
    items: results,
    pagination: {
      page,
      limit,
      total: query.unusedOnly ? results.length : total,
      pages: Math.max(1, Math.ceil((query.unusedOnly ? results.length : total) / limit)),
    },
  };
}

export async function getMediaById(id: string) {
  const asset = await ImageAsset.findById(id).lean();
  if (!asset) return null;
  return { ...asset, usage: await findMediaUsage(asset.originalUrl) };
}

export interface DeleteMediaResult {
  deleted: boolean;
  blockedBy?: MediaUsage[];
  removedFiles: number;
}

/**
 * Delete an asset, its variants, and (optionally) the original file.
 *
 * Orphan-safe by default: if any content still references the file the delete
 * is refused unless `force` is set. Variants are always safe to remove — they
 * can be regenerated — but the original is only unlinked when `force` AND the
 * path is verifiably inside the uploads directory (so a poisoned record can
 * never make the server unlink an arbitrary path).
 */
export async function deleteMedia(
  id: string,
  options: { force?: boolean; keepOriginal?: boolean } = {},
): Promise<DeleteMediaResult | null> {
  const asset = await ImageAsset.findById(id).lean();
  if (!asset) return null;

  const usage = await findMediaUsage(asset.originalUrl);
  if (usage.length > 0 && !options.force) {
    return { deleted: false, blockedBy: usage, removedFiles: 0 };
  }

  let removedFiles = 0;

  // Variants are keyed by hash and are never referenced directly by content
  // URLs, so they are always safe to remove — they can be regenerated.
  const dir = assetVariantDir(asset.hash);
  if (isInsideUploads(dir)) {
    try {
      const files = await fs.readdir(dir);
      removedFiles += files.length;
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      /* nothing to remove */
    }
  }

  const hasAzureVariants =
    isAzureBlobUrl(asset.originalUrl) || asset.variants.some((v) => isAzureBlobUrl(v.url));
  if (hasAzureVariants && isAzureBlobConfigured()) {
    try {
      removedFiles += await deleteBlobsByPrefix(`uploads/optimized/${asset.hash}/`);
    } catch (err) {
      logger.warn({ err, hash: asset.hash }, 'Failed to delete Azure Blob variants');
    }
  }

  if (options.force && !options.keepOriginal) {
    const abs = path.join(uploadsDir, basenameOf(asset.originalUrl));
    // Verify containment so a poisoned database record can never make the
    // server unlink a path outside the uploads directory.
    if (isInsideUploads(abs)) {
      try {
        await fs.unlink(abs);
        removedFiles += 1;
      } catch {
        /* already gone */
      }
    }

    if (isAzureBlobUrl(asset.originalUrl) && isAzureBlobConfigured()) {
      try {
        if (await deleteBlob(asset.originalUrl)) {
          removedFiles += 1;
        }
      } catch (err) {
        logger.warn({ err, url: asset.originalUrl }, 'Failed to delete Azure Blob original');
      }
    }
  }

  await ImageAsset.deleteOne({ _id: asset._id });
  return { deleted: true, removedFiles };
}

export async function updateMediaAlt(id: string, alt: string) {
  return ImageAsset.findByIdAndUpdate(id, { $set: { alt } }, { returnDocument: 'after' }).lean();
}

/** Distinct folders present in the library (for the filter UI). */
export async function listFolders(): Promise<string[]> {
  const folders = await ImageAsset.distinct('folder');
  return folders.filter((f): f is string => typeof f === 'string' && f.length > 0).sort();
}

/** Metadata the public site needs to render a responsive image. */
export interface ResolvedAsset {
  hash: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  blurhash?: string;
  dominantColor?: string;
  kind: 'image' | 'video';
  posterUrl?: string;
  variants: Array<{ width: number; format: string; url: string }>;
}

/**
 * Resolve a batch of image URLs to their responsive metadata.
 *
 * The public site needs `srcset` widths and blurhash placeholders to render an
 * optimised image, but sending that with every content payload would bloat
 * every list response. Instead the client asks once per page for the URLs it is
 * about to render.
 *
 * Only URLs that point at our own `/uploads/` path are answered — the endpoint
 * reveals nothing that the caller could not already fetch, and any URL the
 * caller supplies is already public content.
 */
export async function resolveAssets(urls: string[]): Promise<Record<string, ResolvedAsset>> {
  const wanted = [...new Set(urls)]
    .filter((url) => typeof url === 'string' && (url.includes('/uploads/') || isAzureBlobUrl(url)))
    .slice(0, 60);

  if (wanted.length === 0) return {};

  const or = wanted.map((url) => ({ originalUrl: new RegExp(`${escapeRegex(basenameOf(url))}$`) }));

  const rows = await ImageAsset.find({ $or: or })
    .select('hash originalUrl width height aspectRatio blurhash dominantColor kind posterUrl variants')
    .limit(200)
    .lean();

  const byBasename = new Map<string, (typeof rows)[number]>();
  for (const row of rows) byBasename.set(basenameOf(row.originalUrl), row);

  const result: Record<string, ResolvedAsset> = {};
  for (const url of wanted) {
    const row = byBasename.get(basenameOf(url));
    if (!row) continue;

    result[url] = {
      hash: row.hash,
      width: row.width,
      height: row.height,
      aspectRatio: row.aspectRatio,
      blurhash: row.blurhash,
      dominantColor: row.dominantColor,
      kind: row.kind,
      posterUrl: row.posterUrl,
      variants: row.variants.map((v) => ({ width: v.width, format: v.format, url: v.url })),
    };
  }
  return result;
}

/** Re-run variant generation for one asset (media library "rebuild"). */
export async function regenerateVariants(id: string) {
  const asset = await ImageAsset.findById(id).lean();
  if (!asset) return null;

  let abs = path.join(uploadsDir, basenameOf(asset.originalUrl));
  if (!isInsideUploads(abs)) return null;

  let downloadedTemp = false;
  try {
    await fs.access(abs);
  } catch {
    if (isAzureBlobUrl(asset.originalUrl) && isAzureBlobConfigured()) {
      await fs.mkdir(uploadsDir, { recursive: true });
      const tmpPath = path.join(uploadsDir, `tmp-regen-${Date.now()}-${basenameOf(asset.originalUrl)}`);
      if (!isInsideUploads(tmpPath)) return null;
      const ok = await downloadBlobToFile(asset.originalUrl, tmpPath);
      if (!ok) return null;
      abs = tmpPath;
      downloadedTemp = true;
    } else {
      return null;
    }
  }

  try {
    await fs.rm(assetVariantDir(asset.hash), { recursive: true, force: true });
  } catch {
    /* fine */
  }

  try {
    const processed = await imageJobPool.run(`regenerate:${asset.hash}`, () =>
      processImageFile(abs, asset.hash),
    );

    let variants = processed.variants;
    if (isAzureStorageActive() || isAzureBlobUrl(asset.originalUrl)) {
      if (isAzureBlobConfigured()) {
        variants = await uploadVariantsToAzure(asset.hash, processed.variants);
        if (isInsideUploads(assetVariantDir(asset.hash))) {
          await fs.rm(assetVariantDir(asset.hash), { recursive: true, force: true }).catch(() => undefined);
        }
      }
    }

    return ImageAsset.findByIdAndUpdate(
      id,
      {
        $set: {
          width: processed.width,
          height: processed.height,
          aspectRatio: processed.aspectRatio,
          blurhash: processed.blurhash,
          dominantColor: processed.dominantColor,
          variants,
        },
      },
      { returnDocument: 'after' },
    ).lean();
  } finally {
    if (downloadedTemp) {
      await fs.unlink(abs).catch(() => undefined);
    }
  }
}

export type MediaId = Types.ObjectId;
