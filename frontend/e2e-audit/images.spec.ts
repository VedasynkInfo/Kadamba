import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loadRoutes } from './routes';

const BASE = 'http://localhost:3002';
const OUT = path.resolve(process.cwd(), '..', 'audit-artifacts');
const PHOTO_DIR = path.resolve(process.cwd(), 'public', 'media', 'photos');

interface ImageCheck {
  path: string;
  images: number;
  photos: number;
  placeholders: number;
  broken: number;
  remote: number;
  missingAlt: number;
  missingDimensions: number;
  ogImage: string;
  ogStatus: number | null;
}

test('open-source photography audit across every public route', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Photography is device-independent; one profile is enough');
  test.setTimeout(25 * 60_000);

  const files = fs
    .readdirSync(PHOTO_DIR)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort();

  const fileResults: Array<{ file: string; status: number; type: string; bytes: number }> = [];
  for (const file of files) {
    const response = await request.get(`${BASE}/media/photos/${file}`);
    fileResults.push({
      file,
      status: response.status(),
      type: response.headers()['content-type'] ?? '',
      bytes: Number(response.headers()['content-length'] ?? 0),
    });
  }

  const routes = (await loadRoutes(request)).filter(
    (route) => route.kind !== '404' && route.kind !== 'design-system',
  );

  const results: ImageCheck[] = [];
  const seenPhotos = new Set<string>();
  const ogFailures: Array<{ path: string; image: string; status: number | null }> = [];

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor({ state: 'attached' });
    await page.waitForTimeout(250);

    await page.evaluate(async () => {
      const step = Math.max(320, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 70));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(350);

    const data = await page.evaluate(() => {
      const images = [...document.images];
      return {
        images: images.map((image) => ({
          src: image.getAttribute('src') ?? '',
          current: image.currentSrc || image.src || '',
          alt: image.getAttribute('alt'),
          width: image.naturalWidth,
          height: image.naturalHeight,
          complete: image.complete,
        })),
        og: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
        twitter:
          document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ?? '',
        resources: performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => /\.(jpe?g|png|webp)(\?|$)/i.test(name)),
      };
    });

    const photos = data.images.filter((image) =>
      [image.src, image.current].some((value) => value.includes('/media/photos/')),
    );
    for (const image of photos) {
      const match = image.current.match(/\/media\/photos\/([^/?#]+)/);
      if (match) seenPhotos.add(match[1]);
    }

    const placeholders = [
      ...data.images.flatMap((image) => [image.src, image.current]),
      ...data.resources,
    ].filter((value) => value.includes('/media/placeholders/')).length;
    const remote = data.images.filter((image) => {
      const current = image.current;
      if (!/^https?:\/\//i.test(current)) return false;
      if (current.startsWith(BASE)) return false;
      if (current.startsWith('http://localhost:3002')) return false;
      return true;
    }).length;
    const broken = data.images.filter(
      (image) => image.complete && image.width === 0 && image.height === 0,
    ).length;
    const missingAlt = data.images.filter((image) => image.alt === null).length;
    const missingDimensions = data.images.filter(
      (image) => image.width > 0 && (!image.width || !image.height),
    ).length;

    let ogStatus: number | null = null;
    if (data.og) {
      try {
        const url = new URL(data.og, BASE);
        const response = await request.get(url.toString());
        ogStatus = response.status();
        if (ogStatus !== 200) ogFailures.push({ path: route.path, image: data.og, status: ogStatus });
      } catch {
        ogFailures.push({ path: route.path, image: data.og, status: null });
      }
    } else {
      ogFailures.push({ path: route.path, image: '', status: null });
    }

    results.push({
      path: route.path,
      images: data.images.length,
      photos: photos.length,
      placeholders,
      broken,
      remote,
      missingAlt,
      missingDimensions,
      ogImage: data.og,
      ogStatus,
    });
  }

  const summary = {
    routes: results.length,
    imageFiles: fileResults.length,
    filesServed: fileResults.filter((file) => file.status === 200).length,
    filesWithWrongType: fileResults.filter((file) => !file.type.startsWith('image/')).length,
    filesUnder20KB: fileResults.filter((file) => file.bytes > 0 && file.bytes < 20 * 1024).length,
    pagesWithPhotos: results.filter((result) => result.photos > 0).length,
    uniquePhotosSeen: seenPhotos.size,
    unusedFiles: files.filter((file) => !seenPhotos.has(file)),
    images: results.reduce((sum, result) => sum + result.images, 0),
    photoImages: results.reduce((sum, result) => sum + result.photos, 0),
    placeholders: results.reduce((sum, result) => sum + result.placeholders, 0),
    brokenImages: results.reduce((sum, result) => sum + result.broken, 0),
    remoteImages: results.reduce((sum, result) => sum + result.remote, 0),
    missingAlt: results.reduce((sum, result) => sum + result.missingAlt, 0),
    missingOg: ogFailures.length,
    ogFailures,
    routeFailures: results.filter(
      (result) =>
        result.placeholders > 0 ||
        result.broken > 0 ||
        result.remote > 0 ||
        result.missingAlt > 0 ||
        result.ogStatus !== 200,
    ),
  };

  fs.writeFileSync(path.join(OUT, 'image-audit.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  expect(summary.imageFiles, 'image files in the library').toBeGreaterThanOrEqual(40);
  expect(summary.filesServed, 'image files served').toBe(summary.imageFiles);
  expect(summary.filesWithWrongType, 'image files with a non-image content type').toBe(0);
  expect(summary.pagesWithPhotos, 'pages showing photography').toBeGreaterThan(150);
  expect(summary.placeholders, 'placeholder image references').toBe(0);
  expect(summary.brokenImages, 'broken images').toBe(0);
  expect(summary.remoteImages, 'remote image dependencies').toBe(0);
  expect(summary.missingAlt, 'images without an alt attribute').toBe(0);
  expect(summary.missingOg, 'pages without a reachable OG image').toBe(0);
  expect(summary.routeFailures, 'routes with image issues').toEqual([]);
});
