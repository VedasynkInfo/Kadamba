import { type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  cellClassName?: string;
  hide?: 'sm' | 'md' | 'lg';
  /**
   * Value used when `DataTable` sorts this column client-side. `Table` ignores
   * it. Falls back to the row's `key` property, so it is only needed when the
   * displayed value is computed rather than read straight off the row.
   */
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T) => string;
  rowKey?: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  className?: string;
  /**
   * Accepted for compatibility; the shell decides the surface now
   * (`bg-surface-raised` resolves to the console's card under `.admin-shell`).
   */
  variant?: 'default' | 'admin';
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  rowKey,
  loading,
  emptyMessage,
  emptyState,
  onSort,
  sortKey,
  sortDir,
  onRowClick,
  className,
}: TableProps<T>) {
  const getKey = (row: T, i: number) => {
    if (keyExtractor) return keyExtractor(row);
    if (rowKey) return rowKey(row);
    return String(i);
  };

  const toggleSort = (key: string) => {
    if (!onSort) return;
    const dir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(key, dir);
  };

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-line bg-surface-raised text-ink transition-all duration-200 shadow-xs',
        className,
      )}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b text-[0.65rem] uppercase tracking-wider font-semibold border-current/10 bg-current/[0.03] opacity-75">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3.5 font-semibold',
                  col.sortable && 'cursor-pointer select-none hover:text-ink',
                  col.className,
                  col.hide === 'sm' && 'hidden sm:table-cell',
                  col.hide === 'md' && 'hidden md:table-cell',
                  col.hide === 'lg' && 'hidden lg:table-cell',
                )}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header ?? col.label}
                  {col.sortable && sortKey === col.key ? (
                    <Icon
                      name={sortDir === 'asc' ? 'sortAsc' : 'sortDesc'}
                      size={14}
                      className="text-gold"
                    />
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="stagger-rows divide-y divide-current/[0.06]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.cellClassName)}>
                    <div className="h-4 w-full animate-pulse rounded bg-current/10" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                {emptyState || (
                  <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm opacity-60">
                      {emptyMessage || 'No data found'}
                    </p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={getKey(row, i)}
                className={cn(
                  'transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-current/[0.04]'
                    : 'hover:bg-current/[0.02]',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-sm opacity-90',
                      col.cellClassName,
                      col.hide === 'sm' && 'hidden sm:table-cell',
                      col.hide === 'md' && 'hidden md:table-cell',
                      col.hide === 'lg' && 'hidden lg:table-cell',
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
