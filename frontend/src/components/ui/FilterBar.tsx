import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 mb-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface FilterGroupProps {
  children: ReactNode;
  className?: string;
}

export function FilterGroup({ children, className }: FilterGroupProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  );
}
