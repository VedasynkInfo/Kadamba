import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Nightly database backup.
 *
 * MongoDB Atlas already takes its own snapshots, but they live in someone
 * else's account and are only reachable over the network. This job writes a
 * self-contained, restorable copy of the collections that hold the studio's
 * work — orders, leads, customers, payments, products, CMS — to the backup
 * directory (the Render Persistent Disk in production).
 *
 * The format is gzipped newline-delimited JSON: one document per line. It is
 * plain enough to read with `zcat` and to restore with a small script, and it
 * needs no extra binaries in the image (no `mongodump` dependency).
 */

/** Collections worth backing up, in restore order. */
const BACKUP_COLLECTIONS = [
  'users',
  'customers',
  'leads',
  'orders',
  'payments',
  'expenses',
  'salarypayments',
  'measurementprofiles',
  'measurementtemplates',
  'productcategories',
  'producttypes',
  'services',
  'galleryitems',
  'blogs',
  'portfolios',
  'staff',
  'website_settings',
  'portalmessages',
  'emailoutbox',
  'backuplogs',
] as const;

export interface BackupResult {
  ok: boolean;
  file: string;
  bytes: number;
  documents: number;
  collections: string[];
  skipped: string[];
  pruned: string[];
  error?: string;
}

export function backupDir(): string {
  // Read the environment at call time rather than only at boot, so a test (or
  // an operator moving the mount) can point the archive somewhere else.
  const configured = process.env.BACKUP_DIR || env.backup.dir;
  return configured ? path.resolve(configured) : path.join(process.cwd(), 'backups');
}

function timestampSlug(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, '-');
}

async function writeCollection(
  out: NodeJS.WritableStream,
  collectionName: string,
): Promise<{ documents: number; bytes: number }> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection is not open');

  const collection = db.collection(collectionName);
  const cursor = collection.find({});
  let documents = 0;
  let bytes = 0;

  for await (const doc of cursor) {
    // BSON types (ObjectId, Date) are not JSON-native; the replacer keeps them
    // readable and restorable as strings.
    const line = `${JSON.stringify(doc, (_key, value) => {
      if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
        return value.toHexString();
      }
      if (value && typeof value === 'object' && value._bsontype === 'Date') {
        return new Date(value.valueOf()).toISOString();
      }
      return value;
    })}\n`;
    bytes += Buffer.byteLength(line);
    if (!out.write(line)) {
      await new Promise((resolve) => out.once('drain', resolve));
    }
    documents += 1;
  }

  return { documents, bytes };
}

/** Delete backups older than the retention window. */
export async function pruneOldBackups(keepDays = env.backup.retentionDays): Promise<string[]> {
  const dir = backupDir();
  if (!fs.existsSync(dir)) return [];
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const removed: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    if (!entry.startsWith('kadamba-backup-') || !entry.endsWith('.jsonl.gz')) continue;
    const full = path.join(dir, entry);
    try {
      const stat = fs.statSync(full);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(full);
        removed.push(entry);
      }
    } catch {
      // A file that vanished between readdir and stat is already pruned.
    }
  }

  return removed;
}
/**
 * Write one backup archive. Returns a result object instead of throwing so
 * the cron job can record the failure without killing the scheduler.
 */
export async function runBackup(options: { now?: Date } = {}): Promise<BackupResult> {
  const now = options.now ?? new Date();
  const dir = backupDir();
  const fileName = `kadamba-backup-${timestampSlug(now)}.jsonl.gz`;
  const filePath = path.join(dir, fileName);

  const result: BackupResult = {
    ok: false,
    file: filePath,
    bytes: 0,
    documents: 0,
    collections: [],
    skipped: [],
    pruned: [],
  };

  try {
    fs.mkdirSync(dir, { recursive: true });

    const gzip = zlib.createGzip();
    const out = fs.createWriteStream(filePath);
    gzip.pipe(out);

    const header = `${JSON.stringify({
      type: 'manifest',
      createdAt: now.toISOString(),
      database: mongoose.connection.name,
    })}\n`;
    gzip.write(header);

    for (const name of BACKUP_COLLECTIONS) {
      try {
        const stats = await writeCollection(gzip, name);
        result.collections.push(name);
        result.documents += stats.documents;
        result.bytes += stats.bytes;
      } catch (error) {
        // A missing collection is normal on a fresh database.
        result.skipped.push(name);
        logger.debug({ collection: name, err: error }, 'Backup skipped a collection');
      }
    }

    await new Promise<void>((resolve, reject) => {
      out.on('finish', () => resolve());
      out.on('error', reject);
      gzip.end();
    });

    const stat = fs.statSync(filePath);
    result.bytes = stat.size;
    result.ok = true;
    result.pruned = await pruneOldBackups();

    logger.info(
      { file: filePath, bytes: stat.size, documents: result.documents },
      'Nightly backup written',
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.error = message;
    logger.error({ err: error }, 'Nightly backup failed');
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // best effort
    }
    return result;
  }
}
