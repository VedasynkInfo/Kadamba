#!/usr/bin/env node
/**
 * Syncs the shared domain contract from the backend source of truth into the
 * frontend, or verifies the copies are identical.
 *
 *   node scripts/sync-shared.mjs          # write the frontend copies
 *   node scripts/sync-shared.mjs --check  # fail if out of date (CI)
 *
 * Why copy instead of a workspace package: the backend compiles with
 * `rootDir: ./src` and CommonJS, and the frontend ships via Vite. Copying
 * dependency-light files keeps both builds untouched while the `--check` mode
 * guarantees the copies can never drift.
 *
 * Everything a copied file imports must itself be copied (or be `zod`, which
 * both apps depend on) — so the contract stays self-contained.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The contract, as a file list.
 *
 * `enums.ts` is dependency-free domain vocabulary; `schemas.ts` adds the
 * payload shapes and imports only `zod` plus `./enums` (which is why the
 * relative import survives the copy).
 */
const FILES = ['enums.ts', 'schemas.ts'];

const banner = (source) =>
  `/* AUTO-GENERATED — do not edit directly.\n * Source: backend/src/shared/${source}\n * Regenerate: node scripts/sync-shared.mjs\n */\n`;

const check = process.argv.includes('--check');
let drifted = 0;

for (const file of FILES) {
  const source = resolve(root, 'backend/src/shared', file);
  const target = resolve(root, 'frontend/src/shared', file);
  const expected = banner(file) + readFileSync(source, 'utf8');

  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    current = '';
  }

  if (check) {
    if (current !== expected) {
      console.error(`\n✖ Shared contract is out of date: ${file}`);
      drifted += 1;
    } else {
      console.log(`✔ In sync: frontend/src/shared/${file}`);
    }
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, expected, 'utf8');
  console.log(`✔ Synced → frontend/src/shared/${file}`);
}

if (check && drifted > 0) {
  console.error('\n  Run: node scripts/sync-shared.mjs\n');
  process.exit(1);
}

if (check) console.log('✔ Shared contract is in sync');
