#!/usr/bin/env node
/**
 * Design-system guard: fails when raw hex colours appear in TSX/TS source.
 *
 * Colours must come from the design tokens in `src/index.css` (`@theme`) or
 * `src/theme/designTokens.ts`. Inline hex values cause the exact drift this
 * guard exists to prevent (3 competing token sources, 936 hex literals).
 *
 * Allowed:
 *   - src/index.css and other .css files (tokens live here)
 *   - src/theme/designTokens.ts (the palette definition itself)
 *   - an explicit `// token-lint-disable-next-line` comment
 *
 * Unit tests are not scanned: a test that asserts a theme token round-trips
 * (`{ accent: '#123456' }`) is checking plumbing, not shipping a colour. The
 * ratchet measures production source only.
 *
 * Usage:
 *   node scripts/check-tokens.mjs            # report + ratchet check
 *   node scripts/check-tokens.mjs --baseline # rewrite the baseline
 *
 * Ratchet: until the Phase 6 token migration is complete we allow the current
 * count but FAIL if the number of raw hex literals grows. Lower the baseline as
 * files are migrated; the gate tightens automatically.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendSrc = join(root, 'frontend/src');
const baselineFile = join(root, 'scripts/.token-baseline.json');

const ALLOWLIST = new Set([
  join(frontendSrc, 'theme/designTokens.ts'),
]);

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const DISABLE = 'token-lint-disable-next-line';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

let total = 0;
const offenders = [];
const byFile = {};

for (const file of walk(frontendSrc)) {
  if (ALLOWLIST.has(file)) continue;
  const rel = relative(root, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes(DISABLE)) return;
    const matches = line.match(HEX);
    if (!matches) return;
    total += matches.length;
    byFile[rel] = (byFile[rel] || 0) + matches.length;
    offenders.push({ file: rel, line: i + 1, matches });
  });
}

if (process.argv.includes('--baseline')) {
  writeFileSync(
    baselineFile,
    JSON.stringify({ count: total, generatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8',
  );
  console.log(`✔ Baseline written: ${total} raw hex literal(s)`);
  process.exit(0);
}

const baseline = existsSync(baselineFile)
  ? JSON.parse(readFileSync(baselineFile, 'utf8')).count
  : null;

console.log(`Raw hex literals in TS/TSX: ${total}`);
if (baseline !== null) console.log(`Baseline: ${baseline}`);

if (baseline !== null && total > baseline) {
  console.error(
    `\n✖ Raw hex colour count increased by ${total - baseline} (${baseline} → ${total}).`,
  );
  const worst = Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.error('\nWorst files:');
  for (const [f, n] of worst) console.error(`  ${n.toString().padStart(4)}  ${f}`);
  console.error('\nUse design tokens instead, or add `// token-lint-disable-next-line`.\n');
  process.exit(1);
}

if (baseline !== null && total < baseline) {
  console.log(
    `\n✔ Improved by ${baseline - total}. Run \`node scripts/check-tokens.mjs --baseline\` to lock it in.`,
  );
}

if (offenders.length === 0) {
  console.log('✔ No raw hex colours in TS/TSX');
}
process.exit(0);
