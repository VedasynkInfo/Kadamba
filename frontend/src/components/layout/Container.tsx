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
  lg: 'max-w-6xl',
  full: 'max-w-none',
};

/**
 * Horizontal page container with responsive padding.
 */
export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', sizeClasses[size], className)}>
      {children}
    </div>
  );
}
