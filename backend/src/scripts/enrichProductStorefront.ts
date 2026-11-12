import { ProductCategory } from '../models/ProductCategory';
import { ProductType } from '../models/ProductType';
import { GalleryItem } from '../models/GalleryItem';
import { buildStorefrontMeta, publicDescriptionFor } from '../seed/productStorefront';

/**
 * Fill the storefront layer on catalogue records created for the workshop.
 *
 * Safe to run repeatedly: a product that already has a real gallery, variants,
 * price range or lead time is left alone. The two demo records that were
 * published by mistake are unpublished rather than deleted, so any historical
 * order or audit entry that references them keeps working.
 */
async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  await connectDB();

  const categories = await ProductCategory.find().select('_id code name');
  const codeById = new Map(categories.map((category) => [String(category._id), category.code]));

  const products = await ProductType.find({ active: true });
  let enriched = 0;

  for (const product of products) {
    const categoryCode = codeById.get(String(product.categoryId)) ?? 'CUSTOM';
    const storefront = buildStorefrontMeta({
      categoryCode,
      code: product.code,
      name: product.name,
      description: product.description,
      seed: true,
    });

    let changed = false;

    if (!product.gallery || product.gallery.length === 0) {
      product.gallery = storefront.gallery;
      changed = true;
    }
    if (!product.variants || product.variants.length === 0) {
      product.variants = storefront.variants;
      changed = true;
    }
    if (!product.indicativePriceRange) {
      product.indicativePriceRange = storefront.indicativePriceRange;
      changed = true;
    }
    if (!product.leadTimeDays) {
      product.leadTimeDays = storefront.leadTimeDays;
      changed = true;
    }
    if (!product.leadTimeNote) {
      product.leadTimeNote = storefront.leadTimeNote;
      changed = true;
    }
    if (!product.publicDescription || product.publicDescription.length < 120) {
      product.publicDescription = publicDescriptionFor(product.name, product.description);
      changed = true;
    }
    if (!product.seo?.metaDescription) {
      product.seo = {
        ...(product.seo ?? {}),
        metaTitle: product.seo?.metaTitle || `${product.name} in Kurnool`,
        metaDescription:
          product.seo?.metaDescription ||
          `${publicDescriptionFor(product.name, product.description)} Indicative range ${storefront.indicativePriceRange}.`,
      };
      changed = true;
    }

    if (changed) {
      await product.save();
      enriched += 1;
    }
  }

  // Two records created during testing were published to the live storefront.
  const removedProduct = await ProductType.updateOne(
    { $or: [{ slug: 'bridal-blouse-2' }, { code: 'BR-LL' }] },
    { $set: { active: false } },
  );
  const removedGallery = await GalleryItem.updateOne(
    { $or: [{ slug: 'w' }, { title: 'uhi' }] },
    { $set: { published: false } },
  );

  console.log(
    `Enriched ${enriched} product${enriched === 1 ? '' : 's'}; unpublished ` +
      `${removedProduct.modifiedCount} product and ${removedGallery.modifiedCount} gallery item.`,
  );

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
