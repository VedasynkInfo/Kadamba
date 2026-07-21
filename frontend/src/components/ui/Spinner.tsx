import { cn } from '@/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'size-4 border-2',
  md: 'size-8 border-2',
  lg: 'size-12 border-[3px]',
};

/**
 * Loading spinner with accessible label.
 */
export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('inline-flex items-center gap-2 text-gold', className)}
    >
      <span
        className={cn(
          'animate-spin-luxury rounded-full border-gold/30 border-t-gold',
          sizeMap[size],
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
