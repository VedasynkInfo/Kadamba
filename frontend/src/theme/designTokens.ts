/**
 * The design tokens JavaScript needs.
 *
 * Colour, type and spacing live in `index.css` as CSS custom properties — the
 * browser reads them directly, and there is no second copy in JS to drift. The
 * previous file here was a hand-maintained mirror of the palette that *nothing
 * imported*: it had already fallen out of step with the CSS, which is exactly the
 * failure mode three competing token sources produce.
 *
 * What remains is the pair of things TSX genuinely needs as values in JS:
 * animation timing (for framer-motion, which cannot read a CSS var into a
 * spring) and breakpoints (for `useMediaQuery`). The CSS side is `--duration-*`
 * and `--ease-*` in `index.css`; `designTokens.test.ts` asserts the two agree, so
 * changing one without the other fails the build rather than drifting.
 */

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const ease = {
  /** The house curve: quick to move, gentle to settle. Matches `--ease-luxury`. */
  luxury: [0.22, 1, 0.36, 1] as const,
  /** Decelerate — for elements entering the viewport. Matches `--ease-out-soft`. */
  out: [0.16, 1, 0.3, 1] as const,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const motion = {
  duration,
  ease,
} as const;

export type Duration = keyof typeof duration;
export type Ease = keyof typeof ease;
export type Breakpoint = keyof typeof breakpoints;
