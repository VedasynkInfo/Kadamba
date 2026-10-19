/**
 * Social brand marks.
 *
 * lucide-react ships no logos, and a social channel is the one place a generic
 * icon is the wrong answer: a designer scanning the Social Channels tab reads
 * the mark, not the label beside it. These are the official marks from Simple
 * Icons (CC0), rendered as a single `currentColor` fill so they follow the shell
 * exactly like the stroked icons in `components/icons`.
 *
 * They are filled rather than stroked on purpose — a brand mark is not a
 * variable-weight glyph — which is why they do not live in that vocabulary.
 */
import type { SVGProps } from 'react';
import { SOCIAL_PATHS, type SocialName } from './socialLookup';

export type SocialIconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  name: SocialName;
  /** Same scale as `components/icons`: 16 by default. */
  size?: number;
};

export function SocialIcon({ name, size = 16, ...rest }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d={SOCIAL_PATHS[name]} />
    </svg>
  );
}

export type { SocialName } from './socialLookup';
