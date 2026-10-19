import fs from 'fs';
import path from 'path';
import { ImageAsset } from '../models/ImageAsset';
import { optimizedDir, publicUploadUrl, uploadsDir } from '../config/storage';
import { hashFile, processImageFile } from '../utils/imagePipeline';

/**
 * Backfill responsive variants for images already on disk.
 *
 * This is the logic behind `npm run uploads:optimize`, factored out of the CLI
 * so it can be tested: it writes to the production database and reads the
 * production uploads tree, so it is exactly the kind of code that should be
 * covered rather than trusted.
 *
 * Guarantees:
 *   - Originals are opened read-only. Nothing in here writes to or deletes a
 *     source file — the only writes are inside `optimized/<hash>/`.
 *   - Idempotent and resumable: an asset whose variants are all present is
 *     skipped, so an interrupted run can simply be repeated.
 *   - A single unreadable/corrupt image is counted as a failure and does not
 *     abort the run.
 *   - `dryRun` performs no writes at all (it still reads, so its report is
 *     accurate for an already-optimised library).
 */

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
]);

export interface BackfillOptions {
  /** Report what would happen without writing anything. */
  dryRun?: boolean;
  /** Rebuild variants even when they already exist. */
  force?: boolean;
  /** Stop after this many processed images (0 = no limit). */
  limit?: number;
  /** Only files directly under this first-level folder of the tree. */
  folder?: string | null;
  /** Source tree to scan. Defaults to the configured uploads directory. */
  root?: string;
  /** Called after each file, for CLI progress output. */
  onFile?: (event: BackfillEvent) => void;
}

export interface BackfillEvent {
  relativePath: string;
  status: 'pending' | 'processed' | 'skipped' | 'failed';
  variants?: number;
  variantBytes?: number;
  error?: string;
}

export interface BackfillSummary {
  scanned: number;
  processed: number;
  skipped: number;
  failed: number;
  bytesBefore: number;
  bytesAfter: number;
}

/** Image files in the uploads tree, excluding the generated variant subtree. */
export function collectOriginalImages(root: string = uploadsDir): string[] {
  const found: string[] = [];
  const optimizedRoot = path.resolve(optimizedDir);

  const visit = (dir: string) => {
    // Never descend into `optimized/` — those are outputs, not sources.
    if (path.resolve(dir).startsWith(optimizedRoot)) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(abs);
      } else if (
        entry.isFile() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'Thumbs.db' &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        found.push(abs);
      }
    }
  };

  visit(root);
  return found.sort();
}

/** True when at least `expected` variant files are present for a hash. */
export function variantsPresent(hash: string, expected: number): boolean {
  if (expected <= 0) return false;
  try {
    const files = fs.readdirSync(path.join(optimizedDir, hash));
    return files.filter((f) => !f.startsWith('.')).length >= expected;
  } catch {
    return false;
  }
}

export async function backfillImages(options: BackfillOptions = {}): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    scanned: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    bytesBefore: 0,
    bytesAfter: 0,
  };

  const root = options.root ?? uploadsDir;
  const originals = collectOriginalImages(root);
  summary.scanned = originals.length;

  for (const abs of originals) {
    const relativePath = path.relative(root, abs);

    if (options.folder) {
      const folder = path.dirname(relativePath).split(path.sep)[0];
      if (folder !== options.folder) continue;
    }

    if (options.limit && summary.processed >= options.limit) break;

    let hash: string;
    try {
      hash = await hashFile(abs);
    } catch (error) {
      summary.failed += 1;
      options.onFile?.({
        relativePath,
        status: 'failed',
        error: error instanceof Error ? error.message : 'unreadable',
      });
      continue;
    }

    // The database is read even on a dry run, otherwise an already-optimised
    // library would be reported as entirely "pending" — a misleading report.
    // "Dry" means no *writes*, and nothing below this point writes when set.
    const existing = await ImageAsset.findOne({ hash }).lean();

    if (!options.force && existing && variantsPresent(hash, existing.variants.length)) {
      summary.skipped += 1;
      options.onFile?.({ relativePath, status: 'skipped' });
      continue;
    }

    if (options.dryRun) {
      summary.processed += 1;
      options.onFile?.({ relativePath, status: 'pending' });
      continue;
    }

    try {
      const originalBytes = fs.statSync(abs).size;
      const result = await processImageFile(abs, hash);
      const variantBytes = result.variants.reduce((sum, v) => sum + v.bytes, 0);

      await ImageAsset.findOneAndUpdate(
        { hash },
        {
          $set: {
            kind: result.kind,
            // URLs are relative to the uploads root, so a file in a subfolder
            // keeps that subfolder in its public path (and still resolves,
            // because the static handler serves the whole tree).
            originalUrl: publicUploadUrl(relativePath.split(path.sep).join('/')),
            originalName: path.basename(abs),
            mimeType: result.format ? `image/${result.format}` : 'image/jpeg',
            format: result.format,
            width: result.width,
            height: result.height,
            aspectRatio: result.aspectRatio,
            bytes: result.bytes,
            blurhash: result.blurhash,
            dominantColor: result.dominantColor,
            variants: result.variants,
            folder:
              path.dirname(relativePath) === '.'
                ? 'general'
                : path.dirname(relativePath).split(path.sep)[0],
          },
          $setOnInsert: { hash },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );

      summary.processed += 1;
      summary.bytesBefore += originalBytes;
      summary.bytesAfter += variantBytes;
      options.onFile?.({
        relativePath,
        status: 'processed',
        variants: result.variants.length,
        variantBytes,
      });
    } catch (error) {
      summary.failed += 1;
      options.onFile?.({
        relativePath,
        status: 'failed',
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  return summary;
}
