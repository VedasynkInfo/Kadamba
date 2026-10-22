import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Container } from '@/components/layout/Container';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Constrain inner content to the site max-width. */
  contained?: boolean;
  /** Visual surface: light cream or dark black. */
  tone?: 'light' | 'dark';
  as?: 'section' | 'div';
}

/**
 * Full-width page section with optional container and tone.
 */
export function Section({
  children,
  contained = true,
  tone = 'light',
  as: Comp = 'section',
  className,
  ...props
}: SectionProps) {
  return (
    <Comp
      className={cn(
        'w-full py-12 md:py-16',
        tone === 'dark' ? 'bg-espresso text-ink-inverse' : 'bg-surface text-ink',
        className,
      )}
      {...props}
    >
      {contained ? <Container>{children}</Container> : children}
    </Comp>
  );
}
