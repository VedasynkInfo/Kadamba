import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: ContainerSize;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-[var(--shell-max)]',
  full: 'max-w-none',
};

/**
 * Horizontal page container with responsive padding.
 *
 * The width and gutter are tokens (`--shell-max`, `--gutter`) so the public
 * shell can widen every page to the house measure without the console moving:
 * outside `.public-shell` the fallbacks are the old 72rem / 1rem.
 */
export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-[var(--gutter)]', sizeClasses[size], className)}>
      {children}
    </div>
  );
}
