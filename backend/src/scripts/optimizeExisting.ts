/**
 * Idempotent image backfill CLI.
 *
 * Generates responsive AVIF/WebP/JPEG variants for images already on disk.
 * Originals are only ever READ — this script cannot modify or delete them.
 * Safe to interrupt and re-run: work already done is skipped.
 *
 * Usage:
 *   npm run uploads:optimize -- --dry-run        # report only, no writes
 *   npm run uploads:optimize -- --limit 20       # process at most 20 images
 *   npm run uploads:optimize                      # process everything pending
 *   npm run uploads:optimize -- --force           # rebuild variants even if present
 *
 * A dry run still connects to MongoDB so the report is accurate (an
 * already-optimised library must not show up as entirely "pending"); it simply
 * performs no writes.
 *
 * The implementation lives in `services/imageBackfillService.ts` so it can be
 * tested; this file is only argument parsing and progress output.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { optimizedDir, uploadsDir } from '../config/storage';
import { backfillImages, type BackfillOptions } from '../services/imageBackfillService';

function parseArgs(argv: string[]): BackfillOptions {
  const options: BackfillOptions = { dryRun: false, force: false, limit: 0, folder: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--dry-run') options.dryRun = true;
    else if (token === '--force') options.force = true;
    else if (token === '--limit') options.limit = Number(argv[++i] ?? 0) || 0;
    else if (token === '--folder') options.folder = argv[++i] ?? null;
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Uploads:   ${uploadsDir}`);
  console.log(`Optimized: ${optimizedDir}`);
  console.log(`Mode:      ${options.dryRun ? 'dry run' : options.force ? 'force rebuild' : 'backfill'}`);
  console.log('');

  // Connect for both modes: even a dry run reads the asset index to report
  // accurately what is already done.
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB.\n');

  let seen = 0;
  const started = Date.now();

  const summary = await backfillImages({
    ...options,
    onFile: (event) => {
      seen += 1;
      // Progress heartbeat for long runs.
      if (seen % 25 === 0) console.log(`  … ${seen} scanned`);

      if (event.status === 'pending') console.log(`  PENDING ${event.relativePath}`);
      else if (event.status === 'processed') {
        console.log(
          `  OK      ${event.relativePath} → ${event.variants} variant(s), ${Math.round((event.variantBytes ?? 0) / 1024)} KB`,
        );
      } else if (event.status === 'failed') {
        console.log(`  FAIL    ${event.relativePath} (${event.error})`);
      }
    },
  });

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log('');
  console.log(
    `scanned=${summary.scanned} processed=${summary.processed} skipped=${summary.skipped} failed=${summary.failed} in ${seconds}s`,
  );

  if (summary.bytesAfter > 0) {
    console.log(
      `variants: ${Math.round(summary.bytesAfter / 1024)} KB across all widths vs ` +
        `${Math.round(summary.bytesBefore / 1024)} KB of originals`,
    );
    console.log('(a given request only ever downloads one width, so real saving is far larger)');
  }

  console.log('\nOriginals were not modified.');

  if (options.dryRun) console.log('Dry run — no writes were made.');

  await mongoose.disconnect();
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error('✖ Backfill failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
