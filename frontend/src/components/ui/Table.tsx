import { type ReactNode } from 'react';
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
  variant = 'default',
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

  const isAdmin = variant === 'admin';

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border transition-all duration-200 shadow-xs',
        className
      )}
      style={{
        backgroundColor: isAdmin ? 'var(--admin-card, #1f2937)' : 'var(--public-card, #ffffff)',
        borderColor: isAdmin ? 'var(--admin-border, rgba(128, 128, 128, 0.18))' : 'rgba(0, 0, 0, 0.08)',
        color: isAdmin ? 'var(--admin-card-text, var(--admin-text, #f3f4f6))' : 'var(--public-card-text, var(--public-text, #171717))',
      }}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b text-[0.65rem] uppercase tracking-wider font-semibold border-current/10 bg-current/[0.03] opacity-75">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3.5 font-semibold',
                  col.sortable && 'cursor-pointer select-none hover:text-black',
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
                    <span className="text-gold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-current/[0.06]">
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
