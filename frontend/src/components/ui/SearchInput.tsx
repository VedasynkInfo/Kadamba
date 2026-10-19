import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchInput({
  containerClassName,
  className,
  placeholder = 'Search...',
  ...props
}: SearchInputProps) {
  const id = useId();

  return (
    <div className={cn('relative min-w-[200px] flex-1 max-w-xs', containerClassName)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30 text-sm">
        ⌕
      </span>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-black/15 bg-cream py-2.5 pl-8 pr-3 text-sm text-black',
          'placeholder:text-black/40',
          'focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30',
          className,
        )}
        {...props}
      />
    </div>
  );
}
