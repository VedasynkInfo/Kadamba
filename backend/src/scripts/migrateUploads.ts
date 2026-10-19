/**
 * Checksum-verified uploads migration.
 *
 * Moves (copies) an existing uploads tree onto the target location — typically
 * the Render Persistent Disk mount, e.g.
 *
 *   npm run uploads:migrate -- --to /var/data/uploads --verify
 *
 * Guarantees, by design:
 *   - The SOURCE IS NEVER MODIFIED OR DELETED. There is no flag to delete it;
 *     if you want it gone, remove it yourself after verifying.
 *   - Every file is copied and then re-hashed at the destination. A mismatch
 *     fails that file and the run exits non-zero.
 *   - A destination file that already exists with DIFFERENT content is never
 *     silently overwritten — it is reported as a conflict.
 *   - Re-running is safe: files that already match are skipped (idempotent).
 *
 * Usage:
 *   --from <dir>    source directory (default: <cwd>/uploads)
 *   --to   <dir>    destination directory (required)
 *   --verify        compare only; copy nothing
 *   --dry-run       list what would happen, change nothing
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface Args {
  from: string;
  to: string;
  verify: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    from: path.join(process.cwd(), 'uploads'),
    to: '',
    verify: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--from') args.from = path.resolve(argv[++i] ?? '');
    else if (token === '--to') args.to = path.resolve(argv[++i] ?? '');
    else if (token === '--verify') args.verify = true;
    else if (token === '--dry-run') args.dryRun = true;
  }
  return args;
}

function sha256(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Recursively list files, returning paths relative to `root`. */
function walk(root: string, prefix = '', out: string[] = []): string[] {
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      walk(path.join(root, entry.name), rel, out);
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.to) {
    console.error('✖ --to <directory> is required.');
    console.error('  e.g. npm run uploads:migrate -- --to /var/data/uploads');
    process.exit(1);
  }
  if (path.resolve(args.from) === path.resolve(args.to)) {
    console.error('✖ --from and --to are the same directory; nothing to do.');
    process.exit(1);
  }
  if (!fs.existsSync(args.from)) {
    console.error(`✖ Source not found: ${args.from}`);
    process.exit(1);
  }

  console.log(`Source:      ${args.from}`);
  console.log(`Destination: ${args.to}`);
  console.log(`Mode:        ${args.verify ? 'verify only' : args.dryRun ? 'dry run' : 'copy'}`);
  console.log('');

  const files = walk(args.from);
  console.log(`Found ${files.length} file(s).\n`);

  let copied = 0;
  let skipped = 0;
  let mismatched = 0;
  let missing = 0;
  const conflicts: string[] = [];

  for (const rel of files) {
    const src = path.join(args.from, rel);
    const dest = path.join(args.to, rel);

    const srcHash = sha256(src);

    if (!fs.existsSync(dest)) {
      if (args.verify) {
        missing += 1;
        console.log(`  MISSING   ${rel}`);
        continue;
      }
      if (!args.dryRun) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
      copied += 1;
      console.log(`  ${args.dryRun ? 'WOULD COPY' : 'COPIED  '}  ${rel}`);
      continue;
    }

    const destHash = sha256(dest);
    if (destHash === srcHash) {
      skipped += 1;
      continue;
    }

    // Same path, different bytes: refuse to clobber.
    mismatched += 1;
    conflicts.push(rel);
    console.log(`  CONFLICT  ${rel}`);
  }

  console.log('');
  console.log(`copied=${copied} identical=${skipped} conflicts=${mismatched} missing=${missing}`);

  // Verify pass: every source file must exist at the destination with the same
  // hash. This is the acceptance check for the cutover.
  let verified = 0;
  let failures = 0;
  for (const rel of files) {
    const dest = path.join(args.to, rel);
    if (!fs.existsSync(dest) || sha256(dest) !== sha256(path.join(args.from, rel))) {
      failures += 1;
      console.log(`  FAIL      ${rel}`);
    } else {
      verified += 1;
    }
  }

  console.log('');
  console.log(`Verified ${verified}/${files.length} file(s) byte-identical at the destination.`);
  if (!args.verify && !args.dryRun) {
    console.log('The source directory was NOT modified — every original is still in place.');
  }

  if (mismatched > 0 || failures > 0) {
    console.error('\n✖ Migration incomplete. Resolve the conflicts above before switching UPLOAD_DIR.');
    process.exit(1);
  }

  console.log('\n✔ Migration complete.');
}

main();
