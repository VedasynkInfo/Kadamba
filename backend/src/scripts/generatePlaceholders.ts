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
 * has zero external image dependencies. They are deliberately abstract —
 * layered gradients with a textile-inspired ornament in the studio palette —
 * because a fabricated "photo" pretending to be real work would be worse than
 * an honest abstract. Replace them with real studio photography when available.
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

type Motif = 'buti' | 'lattice' | 'stripes' | 'weave' | 'arch' | 'grid';

interface Spec {
  name: string;
  width: number;
  height: number;
  /** Background gradient, top-left → bottom-right. */
  from: string;
  mid: string;
  to: string;
  motif: Motif;
  /** Pattern scale multiplier. */
  scale?: number;
  /** Ornament colour; defaults to the studio gold. */
  ink?: string;
}

const GOLD = '#ffd700';

const SPECS: Spec[] = [
  // Heros and banners (widest, used at the top of a page).
  { name: 'bridal', width: 2000, height: 1250, from: '#3a0d16', mid: '#7b1f33', to: '#12040a', motif: 'arch' },
  { name: 'fabric', width: 2000, height: 1250, from: '#1e1c18', mid: '#413d35', to: '#0a0a09', motif: 'weave', scale: 2.2 },

  // Editorial covers (16:10).
  { name: 'stitching', width: 1600, height: 1000, from: '#2a1f12', mid: '#6b4b24', to: '#120d07', motif: 'lattice', ink: '#ffe08a' },
  { name: 'boutique', width: 1600, height: 1000, from: '#241811', mid: '#5c3a24', to: '#0f0a06', motif: 'lattice' },
  { name: 'lehenga', width: 1600, height: 1000, from: '#1d1035', mid: '#4b2a7a', to: '#0d0718', motif: 'buti' },
  { name: 'saree', width: 1600, height: 1000, from: '#3d0a2a', mid: '#8e1d5a', to: '#1a0512', motif: 'stripes' },
  { name: 'jewelry', width: 1600, height: 1000, from: '#0b0a0d', mid: '#2f2718', to: '#050506', motif: 'buti', scale: 0.7 },
  { name: 'embroidery', width: 1600, height: 1000, from: '#33130a', mid: '#7a3218', to: '#140704', motif: 'buti' },
  { name: 'fitting', width: 1600, height: 1000, from: '#140f24', mid: '#382a5c', to: '#08060f', motif: 'arch' },
  { name: 'runway', width: 1600, height: 1000, from: '#0e0e12', mid: '#25262e', to: '#050506', motif: 'stripes', scale: 1.6 },

  // Compact tiles (3:2 and 8:5).
  { name: 'bridal-alt', width: 1200, height: 750, from: '#2b0a12', mid: '#5c1526', to: '#120408', motif: 'buti', ink: '#ffcf6b' },
  { name: 'saree-alt', width: 1200, height: 750, from: '#10241c', mid: '#1f5a41', to: '#06120e', motif: 'weave' },
  { name: 'festive', width: 1200, height: 750, from: '#2b0020', mid: '#6b0f4e', to: '#120009', motif: 'arch' },
  { name: 'atelier', width: 1200, height: 750, from: '#1c1a24', mid: '#3f3a4d', to: '#0a090e', motif: 'grid' },

  // Portraits (4:5) for team and testimonial slots.
  { name: 'portrait-1', width: 900, height: 1125, from: '#111a30', mid: '#2b3f6b', to: '#070c16', motif: 'buti' },
  { name: 'portrait-2', width: 900, height: 1125, from: '#0f1e1a', mid: '#235045', to: '#060f0d', motif: 'weave' },
  { name: 'portrait-3', width: 900, height: 1125, from: '#101c22', mid: '#1f4550', to: '#060f12', motif: 'lattice' },
];

/** The repeating textile ornament, as an SVG <pattern> body. */
function motifBody(motif: Motif, ink: string, scale: number): string {
  const s = (n: number) => Math.round(n * scale);

  switch (motif) {
    case 'buti':
      return `
        <pattern id="ornament" width="${s(160)}" height="${s(160)}" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <path d="M${s(80)} ${s(34)} L${s(126)} ${s(80)} L${s(80)} ${s(126)} L${s(34)} ${s(80)} Z"
                fill="none" stroke="${ink}" stroke-width="${s(2)}" stroke-opacity="0.5" />
          <circle cx="${s(80)}" cy="${s(80)}" r="${s(5)}" fill="${ink}" fill-opacity="0.55" />
          <circle cx="${s(80)}" cy="${s(14)}" r="${s(2.5)}" fill="${ink}" fill-opacity="0.35" />
          <circle cx="${s(80)}" cy="${s(146)}" r="${s(2.5)}" fill="${ink}" fill-opacity="0.35" />
        </pattern>`;

    case 'lattice':
      return `
        <pattern id="ornament" width="${s(120)}" height="${s(120)}" patternUnits="userSpaceOnUse">
          <rect x="${s(10)}" y="${s(10)}" width="${s(100)}" height="${s(100)}"
                fill="none" stroke="${ink}" stroke-width="${s(1.6)}" stroke-opacity="0.42" />
          <rect x="${s(40)}" y="${s(40)}" width="${s(40)}" height="${s(40)}"
                fill="none" stroke="${ink}" stroke-width="${s(1.6)}" stroke-opacity="0.3"
                transform="rotate(45 ${s(60)} ${s(60)})" />
        </pattern>`;

    case 'stripes':
      return `
        <pattern id="ornament" width="${s(26)}" height="${s(26)}" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="${s(26)}" stroke="${ink}" stroke-width="${s(2)}" stroke-opacity="0.26" />
          <line x1="${s(0)}" y1="${s(13)}" x2="${s(26)}" y2="${s(13)}" stroke="${ink}" stroke-width="${s(1)}" stroke-opacity="0.12" />
        </pattern>`;

    case 'weave':
      return `
        <pattern id="ornament" width="${s(18)}" height="${s(18)}" patternUnits="userSpaceOnUse">
          <line x1="0" y1="${s(9)}" x2="${s(18)}" y2="${s(9)}" stroke="${ink}" stroke-width="${s(1.4)}" stroke-opacity="0.22" />
          <line x1="${s(9)}" y1="0" x2="${s(9)}" y2="${s(18)}" stroke="${ink}" stroke-width="${s(1.4)}" stroke-opacity="0.16" />
          <circle cx="${s(9)}" cy="${s(9)}" r="${s(1.4)}" fill="${ink}" fill-opacity="0.3" />
        </pattern>`;

    case 'arch':
      return `
        <pattern id="ornament" width="${s(220)}" height="${s(150)}" patternUnits="userSpaceOnUse">
          <path d="M${s(10)} ${s(140)} L${s(10)} ${s(80)} A${s(100)} ${s(70)} 0 0 1 ${s(210)} ${s(80)} L${s(210)} ${s(140)}"
                fill="none" stroke="${ink}" stroke-width="${s(2.2)}" stroke-opacity="0.4" />
          <circle cx="${s(110)}" cy="${s(46)}" r="${s(4)}" fill="${ink}" fill-opacity="0.45" />
          <line x1="0" y1="${s(140)}" x2="${s(220)}" y2="${s(140)}" stroke="${ink}" stroke-width="${s(1.2)}" stroke-opacity="0.2" />
        </pattern>`;

    case 'grid':
      return `
        <pattern id="ornament" width="${s(80)}" height="${s(80)}" patternUnits="userSpaceOnUse">
          <line x1="0" y1="${s(40)}" x2="${s(80)}" y2="${s(40)}" stroke="${ink}" stroke-width="${s(1)}" stroke-opacity="0.16" />
          <line x1="${s(40)}" y1="0" x2="${s(40)}" y2="${s(80)}" stroke="${ink}" stroke-width="${s(1)}" stroke-opacity="0.16" />
          <rect x="${s(30)}" y="${s(30)}" width="${s(20)}" height="${s(20)}"
                fill="${ink}" fill-opacity="0.07" />
        </pattern>`;
  }
}

/** A soft light sweep plus a vignette — what stops the art looking flat. */
function atmosphere(width: number, height: number, ink: string): string {
  const cx = Math.round(width * 0.24);
  const cy = Math.round(height * 0.14);
  return `
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${Math.round(width * 0.6)}">
      <stop offset="0" stop-color="${ink}" stop-opacity="0.22" />
      <stop offset="0.4" stop-color="${ink}" stop-opacity="0.05" />
      <stop offset="1" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="vignette" gradientUnits="userSpaceOnUse"
                    cx="${Math.round(width / 2)}" cy="${Math.round(height / 2)}" r="${Math.round(Math.max(width, height) * 0.7)}">
      <stop offset="0.48" stop-color="#000000" stop-opacity="0" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.68" />
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="0.35" stop-color="#ffffff" stop-opacity="0.02" />
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.07" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>`;
}

function buildSvg(spec: Spec): string {
  const ink = spec.ink ?? GOLD;
  const scale = spec.scale ?? 1;
  const { width, height } = spec;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${spec.from}" />
      <stop offset="0.58" stop-color="${spec.mid}" />
      <stop offset="1" stop-color="${spec.to}" />
    </linearGradient>
    ${motifBody(spec.motif, ink, scale)}
    ${atmosphere(width, height, ink)}
  </defs>
  <rect width="100%" height="100%" fill="url(#base)" />
  <rect width="100%" height="100%" fill="url(#ornament)" opacity="0.5" />
  <rect width="100%" height="100%" fill="url(#glow)" />
  <rect width="100%" height="100%" fill="url(#sheen)" />
  <rect width="100%" height="100%" fill="url(#vignette)" />
</svg>`;
}

/** A shelf of generator specs is not needed for the OG card; it is its own crop. */
const OG_SPEC: Spec = {
  name: 'og-default',
  width: 1200,
  height: 630,
  from: '#2b0a12',
  mid: '#7b1f33',
  to: '#12040a',
  motif: 'arch',
  scale: 0.9,
};

async function render(spec: Spec, outFile: string): Promise<number> {
  const buffer = Buffer.from(buildSvg(spec));
  await sharp(buffer, { density: 96 })
    .jpeg({ quality: 76, mozjpeg: true, chromaSubsampling: '4:2:0' })
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
    console.log(`  ${spec.name.padEnd(16)} ${spec.width}x${spec.height}  ${Math.round(fs.statSync(outFile).size / 1024)} KB`);
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
