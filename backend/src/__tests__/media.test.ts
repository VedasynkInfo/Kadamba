import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { optimizedDir, uploadsDir } from '../config/storage';
import { GalleryItem } from '../models/GalleryItem';
import { ImageAsset } from '../models/ImageAsset';
import { backfillImages } from '../services/imageBackfillService';
import { targetWidths } from '../utils/imagePipeline';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

/** sha256 of a file, used to prove originals are never rewritten. */
function sha256(absPath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

/** A real JPEG with EXIF orientation 6 (rotate 90° CW on display). */
async function jpegWithOrientation(width = 2000, height = 1000): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 40, b: 200 } },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
}

/** A plain landscape JPEG with no EXIF rotation. */
async function plainJpeg(width = 1600, height = 900): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 60, b: 90 } },
  })
    .jpeg()
    .toBuffer();
}

describe('image pipeline', () => {
  it('never upscales and always emits a full-size modern-format variant', () => {
    // Exactly on a breakpoint: no extra full-size entry needed.
    expect(targetWidths(2400)).toEqual([400, 800, 1200, 1600, 2400]);
    // Off-breakpoint sources get their own width appended.
    expect(targetWidths(5000)).toEqual([400, 800, 1200, 1600, 2400, 5000]);
    expect(targetWidths(1000)).toEqual([400, 800, 1000]);
    // Smaller than every configured width: a single variant at source size.
    expect(targetWidths(300)).toEqual([300]);
  });

  it('generates modern-format variants, strips EXIF and auto-orients', async () => {
    const token = await registerAdminAndGetToken(app);
    // 2000x1000 landscape + orientation 6 (rotate 90° CW) => displays as a
    // 1000x2000 portrait. Everything downstream must describe the *oriented*
    // image, not the raw pixel grid.
    const buffer = await jpegWithOrientation();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'portrait.jpg');

    expect(res.status).toBe(201);
    const asset = res.body.data.asset as {
      hash: string;
      width: number;
      height: number;
      aspectRatio: number;
      blurhash: string;
      dominantColor: string;
      variants: Array<{ width: number; format: string; url: string; bytes: number }>;
    };

    // Dimensions are the post-rotation ones, so the aspect-ratio box the UI
    // renders (which is what keeps CLS at 0) is correct.
    expect(asset.width).toBe(1000);
    expect(asset.height).toBe(2000);
    expect(asset.aspectRatio).toBeCloseTo(0.5, 3);
    expect(asset.blurhash).toBeTruthy();
    expect(asset.blurhash.length).toBeGreaterThan(6);
    expect(asset.dominantColor).toMatch(/^#[0-9a-f]{6}$/i);

    // Widths are derived from the oriented width (1000), so nothing exceeds it.
    const widths = [...new Set(asset.variants.map((v) => v.width))].sort((a, b) => a - b);
    expect(widths).toEqual([400, 800, 1000]);

    const formats = new Set(asset.variants.map((v) => v.format));
    expect(formats).toEqual(new Set(['avif', 'webp', 'jpeg']));

    // Every claimed variant must exist on disk with the advertised size.
    for (const variant of asset.variants) {
      const abs = path.join(optimizedDir, variant.url.replace('/uploads/optimized/', ''));
      expect(fs.existsSync(abs)).toBe(true);
      expect(fs.statSync(abs).size).toBe(variant.bytes);
    }

    // The original is untouched and still served from its own path.
    const originalName = path.basename(res.body.data.url as string);
    expect(fs.existsSync(path.join(uploadsDir, originalName))).toBe(true);

    // Variants carry no EXIF orientation (it has been baked in) and no other
    // metadata, and the pixels are the correctly rotated portrait.
    const webp = asset.variants.find((v) => v.width === 800 && v.format === 'webp')!;
    const meta = await sharp(
      path.join(optimizedDir, webp.url.replace('/uploads/optimized/', '')),
    ).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(1600);
    expect(meta.orientation).toBeUndefined();
    expect(meta.exif).toBeUndefined();
  });

  it('records the asset once per unique content hash', async () => {
    const token = await registerAdminAndGetToken(app);
    const buffer = await jpegWithOrientation(1200, 800);

    const first = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'a.jpg');
    const second = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'b.jpg');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.asset.hash).toBe(second.body.data.asset.hash);

    // One asset record, reusing the first run's variants rather than re-encoding.
    expect(await ImageAsset.countDocuments({ hash: first.body.data.asset.hash })).toBe(1);
  });

  it('rejects a spoofed file type and leaves nothing behind', async () => {
    const token = await registerAdminAndGetToken(app);

    // The uploads directory is shared across this file's tests, so compare the
    // listing before/after rather than asserting it is empty.
    const before = fs.readdirSync(uploadsDir).sort();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<html><script>alert(1)</script></html>'), 'evil.png');

    expect(res.status).toBe(400);
    expect(fs.readdirSync(uploadsDir).sort()).toEqual(before);
  });
});

describe('media library', () => {
  async function uploadOne(token: string, name = 'shot.jpg') {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .query({ folder: 'gallery' })
      .attach('file', await plainJpeg(1600, 900), name);
    expect(res.status).toBe(201);
    return res.body.data as { url: string; asset: { id: string; hash: string } };
  }

  it('lists assets with their usage and refuses to delete a referenced file', async () => {
    const token = await registerAdminAndGetToken(app);
    const uploaded = await uploadOne(token);

    // Reference it from real content.
    await GalleryItem.create({
      slug: `item-${Date.now()}`,
      title: 'Bridal Blouse',
      category: 'Bridal',
      alt: 'Bridal blouse',
      mediaType: 'image',
      src: uploaded.url,
      width: 1600,
      height: 900,
      published: true,
      sortOrder: 1,
    });

    const list = await request(app)
      .get('/api/admin/media')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const item = (list.body.data.items as Array<{ _id: string; usage: unknown[] }>)[0];
    expect(item.usage).toHaveLength(1);

    // Orphan-safe delete: referenced file is refused with the reason.
    const blocked = await request(app)
      .delete(`/api/admin/media/${item._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(blocked.status).toBe(409);

    // Forced delete goes through.
    const forced = await request(app)
      .delete(`/api/admin/media/${item._id}?force=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(forced.status).toBe(200);
    expect(await ImageAsset.countDocuments({})).toBe(0);
  });

  it('flags unused media so orphans can be found', async () => {
    const token = await registerAdminAndGetToken(app);
    await uploadOne(token, 'orphan.jpg');

    const res = await request(app)
      .get('/api/admin/media?unusedOnly=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect((res.body.data.items as unknown[]).length).toBe(1);
  });

  it('stores and returns alt text', async () => {
    const token = await registerAdminAndGetToken(app);
    const uploaded = await uploadOne(token, 'alt.jpg');

    const patched = await request(app)
      .patch(`/api/admin/media/${uploaded.asset.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ alt: 'Ivory silk blouse with gold zari' });

    expect(patched.status).toBe(200);
    expect(patched.body.data.alt).toBe('Ivory silk blouse with gold zari');
  });

  it('rebuilds variants on demand', async () => {
    const token = await registerAdminAndGetToken(app);
    const uploaded = await uploadOne(token, 'rebuild.jpg');

    const res = await request(app)
      .post(`/api/admin/media/${uploaded.asset.id}/regenerate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect((res.body.data.variants as unknown[]).length).toBeGreaterThan(0);
  });

  it('resolves image metadata publicly, without a session', async () => {
    const token = await registerAdminAndGetToken(app);
    const uploaded = await uploadOne(token, 'resolve.jpg');

    const res = await request(app)
      .get('/api/media/resolve')
      .query({ urls: [uploaded.url, 'https://example.com/not-ours.jpg'] });

    expect(res.status).toBe(200);
    const items = res.body.data.items as Record<
      string,
      { width: number; height: number; blurhash?: string; variants: Array<{ width: number }> }
    >;

    expect(items[uploaded.url].width).toBe(1600);
    expect(items[uploaded.url].height).toBe(900);
    expect(items[uploaded.url].variants.length).toBeGreaterThan(0);
    expect(items[uploaded.url].variants.map((v) => v.width)).toContain(1600);
    // URLs that are not ours are simply not answered.
    expect(items['https://example.com/not-ours.jpg']).toBeUndefined();
    expect(String(res.headers['cache-control'])).toContain('public');
  });

  it('requires media:read to browse the library', async () => {
    const { User } = await import('../models/User');
    const email = `nomediaread-${Date.now()}@test.local`;
    await User.create({
      name: 'No Media',
      email,
      password: 'staff-password-1234',
      role: 'staff',
      permissions: ['orders:read'],
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'staff-password-1234' });
    const token = login.body.data.token as string;

    const res = await request(app)
      .get('/api/admin/media')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('image backfill', () => {
  // The backfill walks a whole directory, so give each test a pristine tree
  // rather than scanning whatever other tests left in the shared uploads dir.
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'kadamba-backfill-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  /** Drop a pre-existing "legacy" upload straight into the tree. */
  async function seedLegacyFile(name: string, width = 1400, height = 900): Promise<string> {
    const buffer = await sharp({
      create: { width, height, channels: 3, background: { r: 10, g: 90, b: 70 } },
    })
      .png()
      .toBuffer();
    const abs = path.join(root, name);
    fs.writeFileSync(abs, buffer);
    return abs;
  }

  it('generates variants for pre-existing files, then skips them on a re-run', async () => {
    const a = await seedLegacyFile('legacy-a.png');
    const b = await seedLegacyFile('legacy-b.png', 900, 900);
    const beforeHashes = [a, b].map((p) => sha256(p));

    const first = await backfillImages({ root });
    expect(first.processed).toBe(2);
    expect(first.failed).toBe(0);
    expect(await ImageAsset.countDocuments({})).toBe(2);

    const assets = await ImageAsset.find({}).lean();
    for (const asset of assets) {
      expect(asset.variants.length).toBeGreaterThan(0);
      expect(asset.blurhash).toBeTruthy();
      // Every claimed variant exists on disk.
      for (const variant of asset.variants) {
        const abs = path.join(optimizedDir, variant.url.replace('/uploads/optimized/', ''));
        expect(fs.existsSync(abs)).toBe(true);
      }
    }

    // Idempotent: a second pass does no work.
    const second = await backfillImages({ root });
    expect(second.processed).toBe(0);
    expect(second.skipped).toBe(2);
    expect(await ImageAsset.countDocuments({})).toBe(2);

    // Force rebuild re-encodes.
    const third = await backfillImages({ root, force: true });
    expect(third.processed).toBe(2);

    // The originals are untouched, byte for byte.
    expect([a, b].map((p) => sha256(p))).toEqual(beforeHashes);
  });

  it('dry run reports accurately and writes nothing', async () => {
    await seedLegacyFile('already-done.png', 800, 600);
    await backfillImages({ root });
    expect(await ImageAsset.countDocuments({})).toBe(1);

    // A new file appears after the first pass.
    await seedLegacyFile('still-pending.png', 640, 480);

    const events: string[] = [];
    const summary = await backfillImages({
      root,
      dryRun: true,
      onFile: (event) => events.push(`${event.status}:${event.relativePath}`),
    });

    // Accurate report: the optimised file is skipped, only the new one is due.
    expect(summary.processed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(events).toContain('skipped:already-done.png');
    expect(events).toContain('pending:still-pending.png');

    // And nothing was written.
    expect(await ImageAsset.countDocuments({})).toBe(1);
  });
});
