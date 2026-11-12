/**
 * Normalise the demo media.
 *
 * The development database was seeded over several months, and three records
 * still point at screenshots that have nothing to do with the studio (uploaded
 * while testing the media pipeline). They are the only records that do — every
 * other seeded item already uses the atelier plates.
 *
 * This script is a one-off for that development data, not a migration for real
 * content: it only touches records whose media lives under `/uploads/`, and it
 * leaves every other field alone. Run it after regenerating the plates:
 *
 *   npx tsx src/scripts/normaliseDemoMedia.ts
 */
import { connectDB, disconnectDB } from '../config/database';
import { logger } from '../config/logger';
import { Blog } from '../models/Blog';
import { GalleryItem } from '../models/GalleryItem';

const GALLERY_PLATES: Record<string, string> = {
  Bridal: '/media/photos/bridal-red-lehenga.jpg',
  Traditional: '/media/photos/saree-jodhpur.jpg',
  Festive: '/media/photos/wedding-three.jpg',
  Tailoring: '/media/photos/atelier-machine.jpg',
  Details: '/media/photos/fabric-embroidery.jpg',
};

const BLOG_PLATES: Record<string, string> = {
  Bridal: '/media/photos/bridal-red-lehenga.jpg',
  Traditional: '/media/photos/saree-jodhpur.jpg',
  Tailoring: '/media/photos/atelier-machine.jpg',
  Styling: '/media/photos/jewelry-bridal.jpg',
  'Studio Notes': '/media/photos/atelier-sewing.jpg',
};

function isUpload(value?: string): boolean {
  return Boolean(value && value.startsWith('/uploads/'));
}

async function main() {
  await connectDB();

  const gallery = await GalleryItem.find({ published: true });
  let galleryChanged = 0;

  for (const item of gallery) {
    if (!isUpload(item.src) && !isUpload(item.poster)) continue;

    const plate = GALLERY_PLATES[item.category] ?? '/media/photos/bridal-red-lehenga.jpg';
    item.src = plate;
    if (isUpload(item.poster)) item.poster = plate;
    if (!item.alt || item.alt.length < 6) {
      item.alt = `${item.title}, ${item.category.toLowerCase()} work from the Kadamba atelier`;
    }
    await item.save();
    galleryChanged += 1;
  }

  const blogs = await Blog.find({ published: true });
  let blogChanged = 0;

  for (const post of blogs) {
    if (!isUpload(post.coverImage)) continue;

    post.coverImage = BLOG_PLATES[post.category] ?? '/media/photos/atelier-sewing.jpg';
    if (!post.coverAlt || post.coverAlt.length < 6) {
      post.coverAlt = `${post.title} — the Kadamba journal`;
    }
    await post.save();
    blogChanged += 1;
  }

  logger.info({ galleryChanged, blogChanged }, 'Demo media normalised');
  await disconnectDB();
}

main().catch((error) => {
  logger.error({ err: error }, 'normaliseDemoMedia failed');
  process.exitCode = 1;
  void disconnectDB();
});
