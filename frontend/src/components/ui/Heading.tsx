import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  children: ReactNode;
  /** Soft entrance animation. */
  animated?: boolean;
  /** Gold shimmer accent on the text. */
  accent?: boolean;
}

const levelClasses: Record<HeadingLevel, string> = {
  1: 'text-4xl md:text-5xl lg:text-[length:var(--font-size-h1)]',
  2: 'text-3xl md:text-[length:var(--font-size-h2)]',
  3: 'text-2xl md:text-[length:var(--font-size-h3)]',
  4: 'text-xl',
};

/**
 * Display heading using Playfair Display with optional motion.
 */
export function Heading({
  as = 2,
  children,
  animated = false,
  accent = false,
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${as}` as const;

  return (
    <Tag
      className={cn(
        'font-heading font-semibold tracking-tight',
        levelClasses[as],
        animated && 'animate-fade-in-up',
        accent && 'text-gold',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
