import mongoose from 'mongoose';
import { ProductType } from '../models/ProductType';
import { MeasurementTemplate } from '../models/MeasurementTemplate';

/**
 * Convert legacy `ProductType.measurementTemplateId` strings (template codes
 * such as `BR-LH`) into real MeasurementTemplate ObjectId references.
 *
 * Uses the raw collection because Mongoose cannot hydrate a string into an
 * ObjectId field. Orphan codes are reported and cleared so a stale reference
 * cannot break the catalogue; the report is the quarantine list for relinking.
 *
 * Safe to run repeatedly.
 */
async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  await connectDB();

  const raw = ProductType.collection;
  const legacy = await raw
    .find({
      $or: [
        { measurementTemplateId: { $type: 'string' } },
        { measurementTemplateCode: { $exists: true, $ne: null } },
      ],
    })
    .toArray();

  const codes = new Set<string>();
  for (const doc of legacy) {
    const value = doc.measurementTemplateId ?? doc.measurementTemplateCode;
    if (value == null || value === '') continue;
    if (!mongoose.isValidObjectId(String(value))) codes.add(String(value).toUpperCase());
  }

  const templates = await MeasurementTemplate.find({ code: { $in: [...codes] } })
    .select('_id code')
    .lean();
  const byCode = new Map(templates.map((template) => [template.code, template._id]));

  let updated = 0;
  const orphans: Array<{ id: string; code: string; value: string }> = [];

  for (const doc of legacy) {
    const value = doc.measurementTemplateId ?? doc.measurementTemplateCode;
    if (value == null || value === '') continue;

    let templateId = null;
    if (mongoose.isValidObjectId(String(value))) {
      const exists = await MeasurementTemplate.exists({ _id: value });
      templateId = exists ? new mongoose.Types.ObjectId(String(value)) : null;
    } else {
      templateId = byCode.get(String(value).toUpperCase()) ?? null;
    }

    if (!templateId) {
      orphans.push({
        id: String(doc._id),
        code: String(doc.code ?? ''),
        value: String(value),
      });
      await raw.updateOne(
        { _id: doc._id },
        { $unset: { measurementTemplateId: '', measurementTemplateCode: '' } },
      );
      continue;
    }

    await raw.updateOne(
      { _id: doc._id },
      {
        $set: { measurementTemplateId: templateId },
        $unset: { measurementTemplateCode: '' },
      },
    );
    updated += 1;
  }

  console.log(`Backfilled ${updated} product template reference${updated === 1 ? '' : 's'}.`);
  if (orphans.length > 0) {
    console.warn(`Quarantined ${orphans.length} orphan template reference(s):`);
    for (const orphan of orphans) {
      console.warn(`  product ${orphan.code} (${orphan.id}) -> ${orphan.value}`);
    }
  }

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
