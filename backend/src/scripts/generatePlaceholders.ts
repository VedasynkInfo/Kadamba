/**
 * Generates the frontend's local placeholder artwork.
 *
 * Why this exists
 * ---------------
 * The marketing pages used to fall back to hotlinked third-party photos. That
 * made every page load depend on someone else's CDN (an availability, privacy
 * and performance liability), and it meant the site could not render offline.
 *
 * These placeholders are generated locally instead and committed, so the site
 * has zero external image dependencies.
 *
 * The art direction
 * -----------------
 * The first generation was a set of saturated gradients — violet, teal,
 * magenta — with a diamond motif on top. They were loud, they fought the
 * cream-and-gold palette of the site, and a page of them read as a placeholder
 * rather than as a design. They have been redrawn as *atelier plates*: the
 * colours of cloth (raw silk, unbleached cotton, oxblood, espresso, zari gold)
 * and the shapes of the work (a fall of silk, a woven field, a loom, an arch,
 * a bolt of cloth). They are still abstract — a fabricated photograph
 * pretending to be real work would be worse than an honest abstract — but they
 * now belong to the same room as the rest of the site.
 *
 * Replace them with studio photography as it becomes available.
 *
 * The script lives in the backend because `sharp` is a backend dependency; it
 * is a one-off asset generator, not part of the application runtime, and it
 * deliberately does not touch the database or `config/env` (which validates
 * configuration on import).
 *
 * Usage: npm run assets:placeholders
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT_DIR = path.resolve(__dirname, '../../../frontend/public/media/placeholders');
const OG_OUT = path.resolve(__dirname, '../../../frontend/public/media/og-default.jpg');

/** The palette of the studio, named by what it is made of. */
const palette = {
  ivory: ['#fbf6ec', '#f0e5d2', '#ddc9a8'],
  parchment: ['#f4ecdd', '#e4d4b8', '#c9b08a'],
  sand: ['#e9dcc3', '#d6c09a', '#b49568'],
  oxblood: ['#4a121c', '#6b1c29', '#2a0a10'],
  espresso: ['#241d15', '#3a3024', '#120e0a'],
  charcoal: ['#2b2a27', '#45423b', '#15140f'],
  gold: ['#c9a227', '#a8801c', '#6d5110'],
  rose: ['#e7cfc4', '#d1a898', '#a87664'],
  olive: ['#3c3a28', '#565238', '#211f14'],
} as const;

type PaletteName = keyof typeof palette;
type Motif = 'drape' | 'loom' | 'arch' | 'bolt' | 'field' | 'veil';

interface Spec {
  name: string;
  width: number;
  height: number;
  palette: PaletteName;
  motif: Motif;
  /** Direction of the light sweep, 0–360. */
  light?: number;
  /** Pattern scale multiplier. */
  scale?: number;
}

const SPECS: Spec[] = [
  // Heroes and banners.
  { name: 'bridal', width: 2000, height: 1250, palette: 'oxblood', motif: 'drape', light: 205, scale: 1.15 },
  { name: 'fabric', width: 2000, height: 1250, palette: 'olive', motif: 'loom', light: 170, scale: 1.35 },

  // Editorial covers (16:10).
  { name: 'stitching', width: 1600, height: 1000, palette: 'espresso', motif: 'bolt', light: 140 },
  { name: 'boutique', width: 1600, height: 1000, palette: 'sand', motif: 'arch', light: 150 },
  { name: 'lehenga', width: 1600, height: 1000, palette: 'oxblood', motif: 'field', light: 200 },
  { name: 'saree', width: 1600, height: 1000, palette: 'rose', motif: 'drape', light: 160, scale: 0.9 },
  { name: 'jewelry', width: 1600, height: 1000, palette: 'espresso', motif: 'arch', light: 210 },
  { name: 'embroidery', width: 1600, height: 1000, palette: 'oxblood', motif: 'loom', light: 110, scale: 1.6 },
  { name: 'fitting', width: 1600, height: 1000, palette: 'charcoal', motif: 'veil', light: 150 },
  { name: 'runway', width: 1600, height: 1000, palette: 'charcoal', motif: 'bolt', light: 180 },

  // Compact tiles (8:5).
  { name: 'bridal-alt', width: 1200, height: 750, palette: 'oxblood', motif: 'drape', light: 205, scale: 1.3 },
  { name: 'saree-alt', width: 1200, height: 750, palette: 'olive', motif: 'loom', light: 130, scale: 1.8 },
  { name: 'festive', width: 1200, height: 750, palette: 'gold', motif: 'field', light: 200 },
  { name: 'atelier', width: 1200, height: 750, palette: 'charcoal', motif: 'bolt', light: 170 },

  // Portraits (4:5) for team and testimonial slots.
  { name: 'portrait-1', width: 900, height: 1125, palette: 'espresso', motif: 'veil', light: 100 },
  { name: 'portrait-2', width: 900, height: 1125, palette: 'rose', motif: 'drape', light: 175 },
  { name: 'portrait-3', width: 900, height: 1125, palette: 'oxblood', motif: 'arch', light: 200 },
];

/** Deterministic pseudo-random — the plates must regenerate identically. */
function seeded(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * A fall of silk: overlapping folds, each a broad bezier ribbon lit from one
 * edge and falling into shadow. This is the motif that reads as cloth.
 */
function drape(width: number, height: number, ink: string, scale: number): string {
  const rand = seeded(97);
  const folds: string[] = [];
  const count = Math.round(7 * scale);

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const x = -width * 0.25 + t * width * 1.5;
    const sway = (rand() - 0.5) * width * 0.22;
    const lift = (rand() - 0.5) * height * 0.18;

    folds.push(`
      <path d="M${x - width * 0.18} ${-height * 0.2}
               C${x + sway} ${height * 0.18}, ${x - sway} ${height * 0.55}, ${x + sway * 0.6} ${height * 1.2}
               L${x + sway * 0.6 + width * 0.3} ${height * 1.2}
               C${x - sway + width * 0.28} ${height * 0.5}, ${x + sway + width * 0.26} ${height * 0.16}, ${x - width * 0.18 + width * 0.3} ${-height * 0.2} Z"
            fill="url(#fold-${i % 3})" />
      <path d="M${x - width * 0.04 + lift * 0.1} ${-height * 0.2}
               C${x + sway * 0.7} ${height * 0.25}, ${x - sway * 0.7} ${height * 0.6}, ${x + sway * 0.4} ${height * 1.2}"
            fill="none" stroke="${ink}" stroke-opacity="0.16" stroke-width="${Math.max(1, width * 0.0012)}" />
    `);
  }

  return folds.join('');
}

/** A woven field: warp and weft, with a slub every so often. */
function loom(width: number, height: number, ink: string, scale: number): string {
  const step = Math.max(8, Math.round(26 / scale));
  const rand = seeded(31);
  const lines: string[] = [];

  for (let x = 0; x < width; x += step) {
    const opacity = 0.16 + rand() * 0.2;
    lines.push(
      `<line x1="${x}" y1="0" x2="${x + step * 0.6}" y2="${height}" stroke="${ink}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${Math.max(0.6, step * 0.06)}" />`,
    );
  }
  for (let y = 0; y < height; y += step) {
    const opacity = 0.1 + rand() * 0.14;
    lines.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y + step * 0.3}" stroke="${ink}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${Math.max(0.5, step * 0.04)}" />`,
    );
  }
  return lines.join('');
}

/** An architectural niche — the shape a boutique is photographed in. */
function arch(width: number, height: number, ink: string): string {
  const cx = width * 0.5;
  const top = height * 0.12;
  const w = width * 0.42;
  const bottom = height * 1.02;
  const r = w / 2;

  return `
    <path d="M${cx - r} ${bottom} L${cx - r} ${top + r * 1.4}
             A${r} ${r * 1.25} 0 0 1 ${cx + r} ${top + r * 1.4}
             L${cx + r} ${bottom}"
          fill="none" stroke="${ink}" stroke-opacity="0.46" stroke-width="${Math.max(1.4, width * 0.0018)}" />
    <path d="M${cx - r * 0.78} ${bottom} L${cx - r * 0.78} ${top + r * 1.6}
             A${r * 0.78} ${r} 0 0 1 ${cx + r * 0.78} ${top + r * 1.6}
             L${cx + r * 0.78} ${bottom}"
          fill="none" stroke="${ink}" stroke-opacity="0.26" stroke-width="1" />
    <line x1="0" y1="${height * 0.86}" x2="${width}" y2="${height * 0.86}"
          stroke="${ink}" stroke-opacity="0.14" stroke-width="1" />
    <circle cx="${cx}" cy="${top + r * 1.1}" r="${Math.max(2, width * 0.004)}" fill="${ink}" fill-opacity="0.4" />
  `;
}

/** A bolt of cloth: a long diagonal band with a selvedge line. */
function bolt(width: number, height: number, ink: string): string {
  const rand = seeded(53);
  const folds = Array.from({ length: 5 }, (_, i) => {
    const offset = (i - 2) * height * 0.14 + rand() * height * 0.04;
    return `
      <path d="M${-width * 0.1} ${height * 0.5 + offset}
               C${width * 0.3} ${height * 0.35 + offset}, ${width * 0.65} ${height * 0.72 + offset}, ${width * 1.1} ${height * 0.45 + offset}"
            fill="none" stroke="${ink}" stroke-opacity="${(0.28 - i * 0.04).toFixed(2)}"
            stroke-width="${Math.max(2, height * 0.012)}" />
    `;
  }).join('');
  return folds;
}

/** A field of buti — the small repeating flower of a silk ground. */
function field(width: number, height: number, ink: string): string {
  const rand = seeded(71);
  const step = Math.max(5, Math.round(width / 14));
  const dots: string[] = [];

  for (let y = step * 0.6; y < height; y += step) {
    for (let x = step * 0.6; x < width; x += step) {
      const jx = x + (rand() - 0.5) * step * 0.3;
      const jy = y + (rand() - 0.5) * step * 0.3;
      const r = step * (0.045 + rand() * 0.025);
      dots.push(`
        <g transform="translate(${jx.toFixed(1)} ${jy.toFixed(1)})">
          <circle r="${r.toFixed(1)}" fill="${ink}" fill-opacity="0.34" />
          ${[0, 90, 180, 270]
            .map(
              (deg) =>
                `<ellipse rx="${(r * 0.7).toFixed(1)}" ry="${(r * 2.2).toFixed(1)}" fill="${ink}" fill-opacity="0.16" transform="rotate(${deg}) translate(0 ${(-r * 1.6).toFixed(1)})" />`,
            )
            .join('')}
        </g>
      `);
    }
  }
  return dots.join('');
}

/** A veil: a soft, semi-transparent wash laid over the ground. */
function veil(width: number, height: number, ink: string): string {
  return `
    <path d="M${-width * 0.05} ${height * 0.24}
             C${width * 0.28} ${height * 0.02}, ${width * 0.66} ${height * 0.4}, ${width * 1.05} ${height * 0.16}
             L${width * 1.05} ${height * 1.05} L${-width * 0.05} ${height * 1.05} Z"
          fill="${ink}" fill-opacity="0.14" />
    <path d="M${-width * 0.05} ${height * 0.58}
             C${width * 0.3} ${height * 0.4}, ${width * 0.7} ${height * 0.78}, ${width * 1.05} ${height * 0.5}"
          fill="none" stroke="${ink}" stroke-opacity="0.3" stroke-width="${Math.max(1.2, width * 0.0016)}" />
  `;
}

function motifBody(motif: Motif, width: number, height: number, ink: string, scale: number): string {
  switch (motif) {
    case 'drape':
      return drape(width, height, ink, scale);
    case 'loom':
      return loom(width, height, ink, scale);
    case 'arch':
      return arch(width, height, ink);
    case 'bolt':
      return bolt(width, height, ink);
    case 'field':
      return field(width, height, ink);
    case 'veil':
      return veil(width, height, ink);
  }
}

function buildSvg(spec: Spec): string {
  const [from, mid, to] = palette[spec.palette];
  const scale = spec.scale ?? 1;
  const { width, height } = spec;
  const light = spec.light ?? 135;
  const rad = (light * Math.PI) / 180;
  const lx = 50 + Math.cos(rad) * 45;
  const ly = 50 + Math.sin(rad) * 45;
  const ink = '#f0cd7a';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="base" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${from}" />
      <stop offset="0.55" stop-color="${mid}" />
      <stop offset="1" stop-color="${to}" />
    </linearGradient>

    <linearGradient id="fold-0" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14" />
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.015" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.12" />
    </linearGradient>
    <linearGradient id="fold-1" x1="1" y1="0" x2="0" y2="0.4">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.01" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.16" />
    </linearGradient>
    <linearGradient id="fold-2" x1="0" y1="1" x2="0.6" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.14" />
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.01" />
    </linearGradient>

    <radialGradient id="keylight" gradientUnits="userSpaceOnUse"
                    cx="${(width * lx) / 100}" cy="${(height * ly) / 100}" r="${Math.round(Math.max(width, height) * 0.72)}">
      <stop offset="0" stop-color="#fff6e2" stop-opacity="0.26" />
      <stop offset="0.35" stop-color="#fff6e2" stop-opacity="0.07" />
      <stop offset="1" stop-color="#fff6e2" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.09" />
      <stop offset="0.42" stop-color="#ffffff" stop-opacity="0.015" />
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <radialGradient id="vignette" gradientUnits="userSpaceOnUse"
                    cx="${width / 2}" cy="${height / 2}" r="${Math.round(Math.max(width, height) * 0.74)}">
      <stop offset="0.42" stop-color="#000000" stop-opacity="0" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.5" />
    </radialGradient>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.055" />
      </feComponentTransfer>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#base)" />
  <g clip-path="inset(0)">${motifBody(spec.motif, width, height, ink, scale)}</g>
  <rect width="100%" height="100%" fill="url(#keylight)" />
  <rect width="100%" height="100%" fill="url(#sheen)" />
  <rect width="100%" height="100%" fill="url(#vignette)" />
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.5" />
</svg>`;
}

const OG_SPEC: Spec = {
  name: 'og-default',
  width: 1200,
  height: 630,
  palette: 'oxblood',
  motif: 'drape',
  light: 200,
};

async function render(spec: Spec, outFile: string): Promise<number> {
  const buffer = Buffer.from(buildSvg(spec));
  await sharp(buffer, { density: 96 })
    .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(outFile);
  return fs.statSync(outFile).size;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OG_OUT), { recursive: true });

  let total = 0;
  for (const spec of SPECS) {
    const outFile = path.join(OUT_DIR, `${spec.name}.jpg`);
    total += await render(spec, outFile);
    console.log(
      `  ${spec.name.padEnd(16)} ${spec.width}x${spec.height}  ${Math.round(fs.statSync(outFile).size / 1024)} KB`,
    );
  }

  await render(OG_SPEC, OG_OUT);
  total += fs.statSync(OG_OUT).size;

  console.log('');
  console.log(`${SPECS.length} placeholder(s) + og-default.jpg → ${Math.round(total / 1024)} KB total`);
  console.log(`Artwork written to ${path.relative(process.cwd(), OUT_DIR)}`);
}

main().catch((error) => {
  console.error('✖ Placeholder generation failed:', error);
  process.exit(1);
});
