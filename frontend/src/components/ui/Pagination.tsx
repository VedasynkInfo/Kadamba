import { cn } from '@/utils/cn';
import { pageWindow } from '@/utils/pagination';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination controls with previous / next and a windowed page list.
 */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="text-ink border-line hover:border-gold"
      >
        Previous
      </Button>
      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-xs text-ink/65">
              …
            </li>
          ) : (
            <li key={entry}>
              <Button
                variant={entry === page ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(entry)}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
                className="min-w-9"
              >
                {entry}
              </Button>
            </li>
          ),
        )}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="text-ink border-line hover:border-gold"
      >
        Next
      </Button>
    </nav>
  );
}
