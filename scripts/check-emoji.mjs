#!/usr/bin/env node
/**
 * Icon guard: fails when a glyph is used as an icon in TSX/TS source.
 *
 * Icons must be real SVG components (`src/components/icons`), not emoji or
 * dingbats. A glyph is a font character: it renders differently on every
 * platform, cannot take a stroke weight, cannot inherit `currentColor` cleanly,
 * carries no accessible name, and cannot be aligned to a text baseline. The nav
 * alone carried twenty of them.
 *
 * Two classes are reported:
 *   - `pictographic` — anything matching \p{Extended_Pictographic}
 *   - `glyph`        — dingbats and arrows that are used as icons in this
 *                      codebase (✕ ✓ ↑ ↓ ← → ↗ ⚠ ⌕ …). Prose that genuinely
 *                      wants an arrow keeps it with a disable comment.
 *
 * Allowed:
 *   - an explicit `// emoji-lint-disable-next-line` comment (prose arrows,
 *     keyboard hints such as the command glyph, third-party copy)
 *   - `*.test.*` files, which may assert on a rendered label
 *
 * Usage:
 *   node scripts/check-emoji.mjs            # report + ratchet check
 *   node scripts/check-emoji.mjs --baseline # rewrite the baseline
 *
 * Ratchet: the count is allowed to stand at its current value but FAILS if it
 * grows. Lower the baseline as files are migrated; when it reaches zero the
 * gate is a hard zero.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendSrc = join(root, 'frontend/src');
const baselineFile = join(root, 'scripts/.emoji-baseline.json');

const PICTOGRAPHIC = /\p{Extended_Pictographic}/gu;

/**
 * Dingbats and arrows that this codebase uses *as icons*. Not exhaustive on
 * purpose: adding a character here is a decision that its use is iconographic,
 * and it should come with a migration to `src/components/icons`.
 */
const ICON_GLYPHS = /[✕✖✓✔☑⭕↑↓↕←→↔↗↘✎✏⌕⚠☰⋯]/gu;

const DISABLE = 'emoji-lint-disable-next-line';

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

let pictographic = 0;
let glyphs = 0;
const offenders = [];
const byFile = {};

for (const file of walk(frontendSrc)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes(DISABLE)) return;
    const pict = line.match(PICTOGRAPHIC) ?? [];
    const gly = line.match(ICON_GLYPHS) ?? [];
    const found = [...pict, ...gly];
    if (found.length === 0) return;
    pictographic += pict.length;
    glyphs += gly.length;
    byFile[rel] = (byFile[rel] || 0) + found.length;
    offenders.push({ line: i + 1, file: rel, chars: [...new Set(found)].join(' '), text: line.trim() });
  });
}

const total = pictographic + glyphs;

if (process.argv.includes('--baseline')) {
  writeFileSync(
    baselineFile,
    JSON.stringify({ count: total, generatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8',
  );
  console.log(`✔ Baseline written: ${total} glyph icon(s)`);
  process.exit(0);
}

const baseline = existsSync(baselineFile)
  ? JSON.parse(readFileSync(baselineFile, 'utf8')).count
  : null;

console.log(`Glyph icons in TS/TSX: ${total} (${pictographic} pictographic, ${glyphs} dingbat/arrow)`);
if (baseline !== null) console.log(`Baseline: ${baseline}`);

if (baseline !== null && total > baseline) {
  console.error(`\n✖ Glyph icon count increased by ${total - baseline} (${baseline} → ${total}).`);
  const worst = Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.error('\nWorst files:');
  for (const [f, n] of worst) console.error(`  ${n.toString().padStart(4)}  ${f}`);
  console.error('\nUse an icon from `src/components/icons`, or add `// emoji-lint-disable-next-line`.\n');
  process.exit(1);
}

if (baseline !== null && total < baseline) {
  console.log(
    `\n✔ Improved by ${baseline - total}. Run \`node scripts/check-emoji.mjs --baseline\` to lock it in.`,
  );
}

if (offenders.length === 0) {
  console.log('✔ No glyph icons in TS/TSX');
} else if (process.argv.includes('--list')) {
  for (const o of offenders) {
    const text = o.text.length > 110 ? `${o.text.slice(0, 110)}…` : o.text;
    console.log(`  ${o.file}:${o.line}  [${o.chars}]  ${text}`);
  }
}
process.exit(0);
