import { ProductType } from '../models/ProductType';
import { ensureProductSlug } from '../services/productCatalogService';

/**
 * Fill `slug` on product types created before Phase 8.
 *
 * Safe to run repeatedly: documents that already have a slug are left alone, so
 * published URLs do not move.
 */
async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  await connectDB();

  const products = await ProductType.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] });
  let updated = 0;

  for (const product of products) {
    product.slug = await ensureProductSlug(product.name, undefined, String(product._id));
    await product.save();
    updated += 1;
  }

  console.log(`Backfilled ${updated} product slug${updated === 1 ? '' : 's'}.`);
  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
