#!/usr/bin/env node
/**
 * Syncs the shared domain contract (enums + API envelope) from the backend
 * source of truth into the frontend, or verifies they are identical.
 *
 *   node scripts/sync-shared.mjs          # write the frontend copy
 *   node scripts/sync-shared.mjs --check  # fail if out of date (CI)
 *
 * Why copy instead of a workspace package: the backend compiles with
 * `rootDir: ./src` and CommonJS, and the frontend ships via Vite. Copying a
 * single dependency-free file keeps both builds untouched while the `--check`
 * mode guarantees the copies can never drift.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'backend/src/shared/enums.ts');
const target = resolve(root, 'frontend/src/shared/enums.ts');

const banner = `/* AUTO-GENERATED — do not edit directly.\n * Source: backend/src/shared/enums.ts\n * Regenerate: node scripts/sync-shared.mjs\n */\n`;

const src = readFileSync(source, 'utf8');
const expected = banner + src;
const check = process.argv.includes('--check');

let current = '';
try {
  current = readFileSync(target, 'utf8');
} catch {
  current = '';
}

if (check) {
  if (current !== expected) {
    console.error(
      '\n✖ Shared contract is out of date.\n' +
        '  Run: node scripts/sync-shared.mjs\n' +
        '  (backend/src/shared/enums.ts → frontend/src/shared/enums.ts)\n',
    );
    process.exit(1);
  }
  console.log('✔ Shared contract is in sync');
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, expected, 'utf8');
console.log('✔ Synced shared contract → frontend/src/shared/enums.ts');
