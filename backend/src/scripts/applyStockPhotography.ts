import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { connectDB, disconnectDB } from '../config/database';
import { ProductCategory } from '../models/ProductCategory';
import { ProductType } from '../models/ProductType';
import { GalleryItem } from '../models/GalleryItem';
import { Portfolio } from '../models/Portfolio';
import { Blog } from '../models/Blog';
import { Service } from '../models/Service';
import { WebsiteSettings } from '../models/WebsiteSettings';

interface StockImage {
  name: string;
  src: string;
  alt: string;
  category: string;
}

const library = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), '../frontend/src/data/imageLibrary.json'), 'utf8'),
) as StockImage[];
const byName = new Map(library.map((image) => [image.name, image]));
const assetRoot = path.resolve(process.cwd(), '../frontend/public');

function img(name: string): StockImage {
  const image = byName.get(name);
  if (!image) throw new Error(`Unknown stock image: ${name}`);
  return image;
}

const PRODUCT_POOLS: Record<string, string[]> = {
  BRIDAL: [
    'bridal-red-lehenga',
    'bridal-seated',
    'bridal-window',
    'bridal-venue',
    'bridal-walk',
    'bridal-steps',
    'bridal-pink',
    'bridal-red-jewels',
    'bridal-portrait',
    'bridal-veil',
  ],
  BLOUSES: [
    'fabric-embroidery',
    'jewelry-bridal',
    'atelier-machine',
    'fabric-red',
    'fabric-ivory',
    'jewelry-necklace',
    'jewelry-bangles',
  ],
  KURTIS: [
    'saree-portrait-1',
    'saree-portrait-2',
    'saree-portrait-3',
    'saree-portrait-4',
    'wedding-three',
    'saree-green',
  ],
  GOWNS: ['gown-red', 'gown-black', 'gown-blue', 'gown-white'],
  SALWAR: [
    'saree-green',
    'saree-portrait-2',
    'saree-portrait-4',
    'fabric-ivory',
    'wedding-three',
  ],
  SKIRTS: ['fabric-ivory', 'fabric-blue', 'fabric-purple', 'atelier-machine', 'saree-jodhpur'],
  KIDS: ['kids-lehenga', 'kids-festive', 'kids-twirl', 'kids-yellow'],
  CUSTOM: [
    'atelier-sewing',
    'atelier-seamstress',
    'atelier-machine',
    'boutique-racks',
    'boutique-warm',
    'fabric-embroidery',
    'sewing-vintage',
  ],
};

const BLOG_POOLS: Record<string, string[]> = {
  Bridal: [
    'bridal-red-lehenga',
    'bridal-steps',
    'bridal-window',
    'bridal-venue',
    'bridal-pink',
    'bridal-red-jewels',
    'bridal-seated',
    'bridal-walk',
    'bridal-veil',
  ],
  Traditional: [
    'saree-jodhpur',
    'saree-green',
    'saree-portrait-1',
    'saree-portrait-2',
    'saree-portrait-3',
    'saree-portrait-4',
    'wedding-three',
    'wedding-couple',
  ],
  Tailoring: [
    'atelier-machine',
    'atelier-seamstress',
    'atelier-detail',
    'atelier-sewing',
    'fabric-ivory',
    'fabric-white',
    'boutique-neutral',
  ],
  'Studio Notes': [
    'boutique-warm',
    'boutique-racks',
    'boutique-interior',
    'jewelry-gold',
    'fabric-embroidery',
    'lehenga-palm',
    'lehenga-hanging',
  ],
};

const PORTFOLIO_POOLS: Record<string, string[]> = {
  Bridal: ['bridal-red-lehenga', 'bridal-steps', 'fabric-embroidery', 'jewelry-bridal', 'bridal-seated'],
  Traditional: ['saree-jodhpur', 'saree-green', 'saree-portrait-1', 'fabric-red'],
  'Before/After': ['fabric-ivory', 'atelier-seamstress', 'atelier-machine', 'atelier-sewing', 'boutique-neutral'],
  Fashion: ['gown-red', 'gown-black', 'gown-blue', 'gown-white'],
  'Client Stories': [
    'wedding-three',
    'bridal-pink',
    'saree-portrait-2',
    'jewelry-bridal',
    'wedding-couple',
  ],
};

const GALLERY_POOLS: Record<string, string[]> = {
  Bridal: ['bridal-red-lehenga', 'bridal-seated', 'bridal-steps', 'bridal-window'],
  Traditional: ['saree-jodhpur', 'saree-green'],
  Festive: ['fabric-embroidery', 'wedding-three'],
  Tailoring: ['fabric-ivory', 'atelier-machine'],
  Details: ['atelier-detail', 'jewelry-bridal', 'fabric-red'],
};

const SERVICE_POOLS: Record<string, string[]> = {
  'bridal-wear': ['bridal-red-lehenga', 'bridal-steps', 'jewelry-bridal', 'fabric-embroidery'],
  'traditional-wear': ['saree-jodhpur', 'saree-green', 'saree-portrait-1', 'fabric-red'],
  'custom-tailoring': ['atelier-machine', 'atelier-seamstress', 'fabric-ivory', 'boutique-neutral'],
  'boutique-styling': ['boutique-racks', 'boutique-warm', 'jewelry-display', 'saree-portrait-4'],
};

function take(pool: string[], start: number, count: number): StockImage[] {
  return Array.from({ length: count }, (_, offset) => img(pool[(start + offset) % pool.length]));
}

async function dimensions(name: string) {
  const metadata = await sharp(path.join(assetRoot, img(name).src)).metadata();
  return { width: metadata.width ?? 1800, height: metadata.height ?? 2400 };
}

async function main() {
  await connectDB();

  const categories = await ProductCategory.find().select('_id code');
  const codeById = new Map(categories.map((category) => [String(category._id), category.code]));

  const products = await ProductType.find().sort({ sortOrder: 1, name: 1 });
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const code = codeById.get(String(product.categoryId)) ?? 'CUSTOM';
    const pool = PRODUCT_POOLS[code] ?? PRODUCT_POOLS.CUSTOM;
    const gallery = take(pool, index, 3).map((image, imageIndex) => ({
      id: `${product.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-image-${imageIndex + 1}`,
      url: image.src,
      alt: `${product.name} — ${image.alt}`,
    }));
    product.gallery = gallery;
    if (!product.seo?.ogImage) {
      product.seo = { ...(product.seo ?? {}), ogImage: gallery[0].url };
    }
    await product.save();
  }

  const galleryItems = await GalleryItem.find().sort({ sortOrder: 1, createdAt: 1 });
  const galleryCounters: Record<string, number> = {};
  for (const item of galleryItems) {
    const category = item.category ?? 'Details';
    const pool = GALLERY_POOLS[category] ?? GALLERY_POOLS.Details;
    const next = galleryCounters[category] ?? 0;
    const image = img(pool[next % pool.length]);
    galleryCounters[category] = next + 1;
    const dims = await dimensions(image.name);
    item.src = image.src;
    item.alt = image.alt;
    item.width = dims.width;
    item.height = dims.height;
    if (!item.ogImage) item.ogImage = image.src;
    await item.save();
  }

  const portfolios = await Portfolio.find().sort({ createdAt: 1 });
  for (let index = 0; index < portfolios.length; index += 1) {
    const portfolio = portfolios[index];
    const pool = PORTFOLIO_POOLS[portfolio.category] ?? PORTFOLIO_POOLS.Bridal;
    const images = take(pool, index, Math.max(3, Math.min(5, pool.length)));
    portfolio.coverImage = images[0].src;
    portfolio.coverAlt = images[0].alt;
    portfolio.bannerImage = images[1 % images.length].src;
    portfolio.bannerAlt = images[1 % images.length].alt;
    portfolio.gallery = images.map((image, imageIndex) => ({
      id: portfolio.gallery[imageIndex]?.id ?? `g${imageIndex + 1}`,
      image: image.src,
      alt: image.alt,
      caption: portfolio.gallery[imageIndex]?.caption ?? image.alt,
    }));
    if (portfolio.beforeAfter) {
      portfolio.beforeAfter.beforeImage = images[0].src;
      portfolio.beforeAfter.beforeAlt = `Before — ${images[0].alt}`;
      portfolio.beforeAfter.afterImage = images[images.length - 1].src;
      portfolio.beforeAfter.afterAlt = `After — ${images[images.length - 1].alt}`;
    }
    if (!portfolio.ogImage) portfolio.ogImage = portfolio.coverImage;
    await portfolio.save();
  }

  const blogs = await Blog.find().sort({ date: -1, createdAt: 1 });
  const blogCounters: Record<string, number> = {};
  for (const blog of blogs) {
    const pool = BLOG_POOLS[blog.category] ?? BLOG_POOLS['Studio Notes'];
    const next = blogCounters[blog.category] ?? 0;
    const image = img(pool[next % pool.length]);
    blogCounters[blog.category] = next + 1;
    blog.coverImage = image.src;
    blog.coverAlt = image.alt;
    if (!blog.ogImage) blog.ogImage = image.src;
    await blog.save();
  }

  const services = await Service.find().sort({ sortOrder: 1 });
  for (let index = 0; index < services.length; index += 1) {
    const service = services[index];
    const pool = SERVICE_POOLS[service.slug] ?? SERVICE_POOLS['custom-tailoring'];
    const images = take(pool, index, Math.min(4, pool.length));
    service.bannerImage = images[0].src;
    service.bannerAlt = images[0].alt;
    service.cardImage = images[0].src;
    service.gallery = images.map((image, imageIndex) => ({
      id: service.gallery[imageIndex]?.id ?? `sg${imageIndex + 1}`,
      image: image.src,
      alt: image.alt,
      title: service.gallery[imageIndex]?.title ?? image.alt,
    }));
    if (!service.ogImage) service.ogImage = service.bannerImage;
    await service.save();
  }

  await WebsiteSettings.updateOne(
    { key: 'site' },
    { $set: { 'seo.defaultOgImage': '/media/photos/bridal-red-lehenga.jpg' } },
  );

  console.log(
    JSON.stringify(
      {
        products: products.length,
        galleryItems: galleryItems.length,
        portfolios: portfolios.length,
        blogs: blogs.length,
        services: services.length,
      },
      null,
      2,
    ),
  );

  await disconnectDB();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDB().catch(() => undefined);
  process.exitCode = 1;
});
