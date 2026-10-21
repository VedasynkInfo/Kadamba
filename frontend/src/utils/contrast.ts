/**
 * Colour maths for the two questions the design system has to answer at
 * runtime: how much contrast does a pair actually have, and what is the nearest
 * readable version of a brand colour on a given surface.
 *
 * These live in JS rather than CSS because the theme editor lets a studio pick
 * arbitrary colours. `color-mix()` can lighten or darken, but it cannot ask
 * "does this pass?" and step until it does.
 */

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Expand three-digit hex to six; anything unparseable becomes black. */
function expandHex(hex: string): string {
  const cleaned = hex.trim().replace('#', '');
  if (cleaned.length === 3) {
    return cleaned
      .split('')
      .map((part) => part + part)
      .join('');
  }
  return cleaned.padEnd(6, '0').slice(0, 6);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const expanded = expandHex(hex);
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** WCAG contrast ratio: 1 (identical) to 21 (black on white). */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Blend `from` toward `to`; `amount` is how much of `to` to take (0–1). */
export function mixHex(from: string, to: string, amount: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const mix = (a: number, b: number) =>
    Math.round(a + (b - a) * Math.min(1, Math.max(0, amount)))
      .toString(16)
      .padStart(2, '0');

  return `#${mix(start.r, end.r)}${mix(start.g, end.g)}${mix(start.b, end.b)}`;
}

/**
 * A version of `preferred` that is readable on `background`.
 *
 * Returns the colour unchanged when it already passes `minimum`, so a studio
 * that picked a legible accent keeps exactly that accent. Otherwise it walks
 * toward whichever extreme — black or white — can reach the highest contrast on
 * this background, in 8% steps, and returns the first passing mix.
 */
export function readableOn(background: string, preferred: string, minimum = 4.5): string {
  if (contrastRatio(preferred, background) >= minimum) return preferred;

  const backgroundLuminance = relativeLuminance(background);
  const toBlack = (backgroundLuminance + 0.05) / 0.05;
  const toWhite = 1.05 / (backgroundLuminance + 0.05);
  // Pure black and white are the only values guaranteed to bracket every
  // background; they are the endpoints of the search, not brand choices.
  const target = toBlack >= toWhite ? '#000000' : '#ffffff'; // token-lint-disable-next-line

  for (let step = 1; step <= 12; step += 1) {
    const candidate = mixHex(preferred, target, step * 0.08);
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return target;
}
