/**
 * Seed CMS collections from the demo content ported out of the frontend.
 *
 * Why: the public site used to fall back to hardcoded demo arrays in the React
 * layer. Those fallbacks are being replaced with real empty states, so the
 * database needs the same content seeded once and owned by admins from there.
 * The content itself lives in `../seed/cmsContent.ts` (plain data, no imports).
 *
 * Usage:
 *   npm run seed:cms              # insert any missing content
 *   npm run seed:cms -- --force   # overwrite existing records with seed values
 *   npm run seed:cms -- --dry-run # report what would happen, write nothing
 *
 * Guarantees, by design:
 *   - IDEMPOTENT: each record is matched on a stable natural key (`slug`, or
 *     `key: 'site'` for settings) and upserted. Re-running without `--force`
 *     reports "already present, skipped" and writes nothing.
 *   - NOTHING IS EVER DELETED. There is no delete path in this script.
 *   - `--dry-run` performs no writes at all; it prints the intended actions.
 *
 * This mirrors the house style of `seedAdmin.ts` (connect/disconnect helpers,
 * `main().catch(...)`, explicit exit codes).
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import { GalleryItem } from '../models/GalleryItem';
import { Service } from '../models/Service';
import { Portfolio } from '../models/Portfolio';
import { Blog } from '../models/Blog';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { cmsSeedContent } from '../seed/cmsContent';

/** Minimal model surface this script needs; the concrete models are passed in. */
// `any` document type lets one helper serve every content model.
type SeedModel = mongoose.Model<any>;

interface SeedOptions {
  force: boolean;
  dryRun: boolean;
}

interface SeedRecord {
  /** Natural-key filter for the upsert, e.g. `{ slug }` or `{ key: 'site' }`. */
  filter: Record<string, unknown>;
  /** Human-readable identifier used in the log lines. */
  label: string;
  /** Document fields to write. */
  data: object;
}

interface CollectionSummary {
  created: number;
  updated: number;
  skipped: number;
}

interface SeedCollection {
  name: string;
  model: SeedModel;
  records: SeedRecord[];
}

function parseArgs(argv: string[]): SeedOptions {
  const options: SeedOptions = { force: false, dryRun: false };
  for (const token of argv) {
    if (token === '--force') options.force = true;
    else if (token === '--dry-run') options.dryRun = true;
  }
  return options;
}

function buildCollections(): SeedCollection[] {
  const { gallery, services, portfolio, blogs, settings } = cmsSeedContent;

  return [
    {
      name: 'gallery',
      model: GalleryItem,
      records: gallery.map((item) => ({
        filter: { slug: item.slug },
        label: item.slug,
        data: item,
      })),
    },
    {
      name: 'services',
      model: Service,
      records: services.map((item) => ({
        filter: { slug: item.slug },
        label: item.slug,
        data: item,
      })),
    },
    {
      name: 'portfolio',
      model: Portfolio,
      records: portfolio.map((item) => ({
        filter: { slug: item.slug },
        label: item.slug,
        data: item,
      })),
    },
    {
      name: 'blogs',
      model: Blog,
      records: blogs.map((item) => ({
        filter: { slug: item.slug },
        label: item.slug,
        data: item,
      })),
    },
    {
      name: 'settings',
      model: WebsiteSettings,
      records: [
        { filter: { key: settings.key }, label: settings.key, data: settings },
      ],
    },
  ];
}

async function seedCollection(
  collection: SeedCollection,
  options: SeedOptions,
): Promise<CollectionSummary> {
  const summary: CollectionSummary = { created: 0, updated: 0, skipped: 0 };

  for (const record of collection.records) {
    const existing = await collection.model
      .findOne(record.filter)
      .select('_id')
      .lean();
    const present = existing !== null;

    if (options.dryRun) {
      if (present && !options.force) {
        summary.skipped += 1;
        console.log(
          `  SKIP          ${collection.name} ${record.label} (already present, skipped)`,
        );
      } else if (present) {
        summary.updated += 1;
        console.log(`  WOULD UPDATE  ${collection.name} ${record.label}`);
      } else {
        summary.created += 1;
        console.log(`  WOULD CREATE  ${collection.name} ${record.label}`);
      }
      continue;
    }

    // Idempotent no-op path: leave the existing document exactly as it is.
    if (present && !options.force) {
      summary.skipped += 1;
      console.log(
        `  SKIP          ${collection.name} ${record.label} (already present, skipped)`,
      );
      continue;
    }

    const result = await collection.model.updateOne(
      record.filter,
      { $set: record.data },
      { upsert: true, runValidators: true },
    );

    if (result.upsertedCount > 0) {
      summary.created += 1;
      console.log(`  CREATE        ${collection.name} ${record.label}`);
    } else {
      summary.updated += 1;
      console.log(`  UPDATE        ${collection.name} ${record.label}`);
    }
  }

  return summary;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Mode: ${options.dryRun ? 'dry run (no writes)' : options.force ? 'force overwrite' : 'insert missing'}`);
  console.log('');

  await connectDB();
  console.log('Connected to MongoDB.\n');

  const collections = buildCollections();
  const totals: CollectionSummary = { created: 0, updated: 0, skipped: 0 };

  for (const collection of collections) {
    console.log(`${collection.name} (${collection.records.length} record(s)):`);
    const summary = await seedCollection(collection, options);
    totals.created += summary.created;
    totals.updated += summary.updated;
    totals.skipped += summary.skipped;

    if (!options.dryRun) {
      console.log(
        `  ${collection.name.padEnd(10, ' ')} created=${summary.created} updated=${summary.updated} skipped=${summary.skipped}`,
      );
    }
    console.log('');
  }

  const verb = options.dryRun ? 'would be' : '';
  console.log(
    `TOTAL ${verb} created=${totals.created} updated=${totals.updated} skipped=${totals.skipped}`,
  );

  await disconnectDB();

  if (options.dryRun) {
    console.log('Dry run — no writes were made.');
  } else {
    console.log('Nothing was deleted.');
  }

  process.exit(0);
}

main().catch(async (error) => {
  console.error('✖ seed:cms failed:', error);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
