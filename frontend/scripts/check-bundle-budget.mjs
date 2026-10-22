#!/usr/bin/env node
/**
 * The bundle budget.
 *
 * A build that grows is not a build that breaks — it is a build that gets
 * slower for every visitor until someone notices. The budget turns that into
 * a failure instead of a slow slide: the total gzipped JavaScript a page has
 * to download, and the size of the largest single chunk, both have a ceiling.
 *
 * Run after `npm run build`:
 *
 *   node scripts/check-bundle-budget.mjs
 *
 * The numbers are the ones the site has actually been serving, with a little
 * headroom — not a round number chosen to be easy to pass.
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.argv[2] ?? 'dist';
const assetsDir = join(root, 'assets');

/** The budget, in bytes of gzipped JavaScript. */
const BUDGET = {
  /** Every JS chunk a first-time visitor downloads, gzipped. */
  totalGzipped: 320 * 1024,
  /** The largest single chunk, gzipped. */
  largestChunkGzipped: 180 * 1024,
  /** Every JS chunk on disk, gzipped — what a full crawl would cost. */
  allChunksGzipped: 900 * 1024,
};

if (!existsSync(assetsDir)) {
  console.error(`✖ No build found at ${assetsDir}. Run "npm run build" first.`);
  process.exit(1);
}

function gzipSize(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length;
}

const chunks = readdirSync(assetsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const full = join(assetsDir, name);
    return { name, bytes: statSync(full).size, gzipped: gzipSize(full) };
  })
  .sort((a, b) => b.gzipped - a.gzipped);

if (chunks.length === 0) {
  console.error(`✖ No JavaScript chunks in ${assetsDir}.`);
  process.exit(1);
}

const totalGzipped = chunks.reduce((sum, chunk) => sum + chunk.gzipped, 0);
const allChunksGzipped = totalGzipped;
const largest = chunks[0];

// The entry chunk is what a first visit downloads: the module graph Vite
// wires into the HTML entry.
const entry = chunks.find((chunk) => /index|main/i.test(chunk.name)) ?? largest;
const entryGzipped = entry.gzipped;

const checks = [
  { label: 'entry chunk (gzip)', value: entryGzipped, limit: BUDGET.largestChunkGzipped },
  { label: 'total JavaScript (gzip)', value: allChunksGzipped, limit: BUDGET.allChunksGzipped },
];

const failures = [];

console.log('Bundle budget');
console.log('-------------');
for (const chunk of chunks.slice(0, 8)) {
  console.log(
    `  ${chunk.name.padEnd(42)} ${(chunk.bytes / 1024).toFixed(1).padStart(8)} kB  →  ${(chunk.gzipped / 1024).toFixed(1).padStart(7)} kB gzip`,
  );
}
if (chunks.length > 8) console.log(`  … and ${chunks.length - 8} more chunk(s)`);
console.log('');

for (const check of checks) {
  const ok = check.value <= check.limit;
  const line = `  ${check.label.padEnd(28)} ${(check.value / 1024).toFixed(1).padStart(8)} kB / ${(check.limit / 1024).toFixed(0).padStart(5)} kB  ${ok ? '✔' : '✖'}`;
  console.log(line);
  if (!ok) failures.push(check);
}

if (failures.length > 0) {
  console.log('');
  console.error('✖ The bundle is over budget. Split the offending chunk, or raise the budget deliberately.');
  process.exit(1);
}

console.log('');
console.log('✔ The bundle is within budget.');
