import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Icon, type GlyphName } from '@/components/icons';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { type Column } from './Table';

export type SortDirection = 'asc' | 'desc';

export interface BulkAction {
  label: string;
  icon?: GlyphName;
  variant?: 'secondary' | 'danger';
  onClick: (keys: string[]) => void;
}

export interface VirtualizeOptions {
  /** Only virtualise once the table is this long. Below it, plain rows are cheaper. */
  threshold?: number;
  /** Estimated row height in pixels. Rows are measured after mount. */
  rowHeight?: number;
}

export interface DataTableProps<T> {
  /** Same shape as `Table`'s columns, so one definition drives either table. */
  columns: Column<T>[];
  data: T[];
  /** Stable identity per row; also the selection key. */
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  /**
   * Selection is controlled: pass both props to enable the selection column.
   * Leave both off for a read-only table (uncontrolled selection would need its
   * own state for no real gain).
   */
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Actions offered while rows are selected, rendered above the table. */
  bulkActions?: BulkAction[];
  /**
   * Controlled sort. Pair with `sortKey`/`sortDir`; the parent does the ordering.
   * Without `onSort` the table keeps its own sort state and orders `data` itself.
   */
  onSort?: (key: string, dir: SortDirection) => void;
  sortKey?: string;
  sortDir?: SortDirection;
  /** Seed for the uncontrolled sort, used only when `onSort` is absent. */
  defaultSortKey?: string;
  defaultSortDir?: SortDirection;
  /**
   * A pointer convenience only. A row is not a control: when this is used the
   * same destination must also be reachable from a focusable element inside the
   * row (a link, or an action button), or the table stops being operable from
   * the keyboard.
   */
  onRowClick?: (row: T) => void;
  /** Accessible name for the header select-all checkbox. */
  selectAllLabel?: string;
  /** Accessible name for each row checkbox. */
  selectRowLabel?: string;
  /** Keep the header row pinned while the table scrolls. */
  stickyHeader?: boolean;
  /**
   * Cap the scroll area. Without a cap the page scrolls and a sticky header has
   * nothing to stick to.
   */
  maxHeight?: number | string;
  /**
   * Window the rows. Ten thousand rows and a thousand DOM nodes are the same
   * picture, and only one of them keeps the desk responsive.
   */
  virtualize?: boolean | VirtualizeOptions;
  /** Describes the table for screen readers. */
  ariaLabel?: string;
  className?: string;
}

const CHECKBOX_CLASSES =
  'size-4 shrink-0 cursor-pointer appearance-none rounded border border-line-strong bg-surface-field checked:border-gold checked:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';

function visibilityClasses<T>(column: Column<T>): string {
  return cn(
    column.hide === 'sm' && 'hidden sm:table-cell',
    column.hide === 'md' && 'hidden md:table-cell',
    column.hide === 'lg' && 'hidden lg:table-cell',
  );
}

/** Numbers numerically, everything else as text, ignoring case and punctuation. */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Table with client-side sorting, optional row selection, bulk actions, a
 * sticky header, optional row virtualisation and explicit loading/empty states.
 *
 * It reuses `Column<T>` from `Table` but renders its own markup: `Table` has no
 * way to express a header checkbox or a sticky, interactive header. Sorting
 * works uncontrolled by default and switches to controlled as soon as `onSort`
 * is supplied. Every interactive control is a native `<input>` or `<button>`, so
 * the whole table is operable from the keyboard.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage,
  emptyState,
  selectedKeys,
  onSelectionChange,
  bulkActions,
  onSort,
  sortKey,
  sortDir,
  defaultSortKey,
  defaultSortDir = 'asc',
  onRowClick,
  selectAllLabel = 'Select all rows',
  selectRowLabel = 'Select row',
  stickyHeader = true,
  maxHeight,
  virtualize = false,
  ariaLabel,
  className,
}: DataTableProps<T>) {
  const selectable = onSelectionChange !== undefined;
  const controlledSort = onSort !== undefined;

  const [internalSort, setInternalSort] = useState<{ key: string; dir: SortDirection } | null>(
    defaultSortKey ? { key: defaultSortKey, dir: defaultSortDir } : null,
  );

  const activeSortKey = controlledSort ? sortKey : internalSort?.key;
  const activeSortDir = controlledSort ? sortDir : internalSort?.dir;

  const sortedData = useMemo(() => {
    if (controlledSort || !internalSort) return data;
    const column = columns.find((c) => c.key === internalSort.key);
    if (!column) return data;
    const valueOf =
      column.sortValue ?? ((row: T) => (row as Record<string, unknown>)[column.key]);
    const factor = internalSort.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      // Blanks last in both directions: a row with no value is not "smallest",
      // it is unknown, and flipping the direction should not promote it.
      if (left == null || right == null) {
        if (left == null && right == null) return 0;
        return left == null ? 1 : -1;
      }
      return compareValues(left, right) * factor;
    });
  }, [columns, data, internalSort, controlledSort]);

  const selection = useMemo(() => selectedKeys ?? [], [selectedKeys]);
  const selectionSet = useMemo(() => new Set(selection), [selection]);

  const visibleKeys = sortedData.map((row) => rowKey(row));
  const selectedVisibleCount = visibleKeys.filter((key) => selectionSet.has(key)).length;
  const allSelected = visibleKeys.length > 0 && selectedVisibleCount === visibleKeys.length;
  const someSelected = selectedVisibleCount > 0 && !allSelected;

  const headerCheckbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // `indeterminate` is a DOM property with no HTML attribute, so it can only
    // be set imperatively.
    if (headerCheckbox.current) headerCheckbox.current.indeterminate = someSelected;
  }, [someSelected]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualOptions = typeof virtualize === 'object' ? virtualize : {};
  const virtualEnabled = Boolean(virtualize) && sortedData.length >= (virtualOptions.threshold ?? 50);

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => virtualOptions.rowHeight ?? 48,
    overscan: 10,
    enabled: virtualEnabled,
  });

  const virtualRows = virtualEnabled ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;
  const renderedRows = virtualEnabled
    ? virtualRows.map((item) => sortedData[item.index])
    : sortedData;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selection);
    if (allSelected) visibleKeys.forEach((key) => next.delete(key));
    else visibleKeys.forEach((key) => next.add(key));
    onSelectionChange([...next]);
  };

  const toggleRow = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selection);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange([...next]);
  };

  const handleSort = (key: string) => {
    const dir: SortDirection = activeSortKey === key && activeSortDir === 'asc' ? 'desc' : 'asc';
    if (onSort) onSort(key, dir);
    else setInternalSort({ key, dir });
  };

  const headerCell = cn('px-4 py-3.5 font-semibold', stickyHeader && 'sticky top-0 z-10');
  const columnCount = columns.length + (selectable ? 1 : 0);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-surface-raised text-ink shadow-xs',
        className,
      )}
    >
      {selectable && selection.length > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-2 border-b border-line bg-brand/10 px-4 py-2"
        >
          <span className="mr-auto text-xs font-semibold" aria-live="polite">
            {selection.length} selected
          </span>
          {bulkActions?.map((action) => (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={action.variant === 'danger' ? 'danger' : 'secondary'}
              onClick={() => action.onClick(selection)}
            >
              {action.icon ? <Icon name={action.icon} size={14} /> : null}
              {action.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectionChange?.([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="overflow-auto"
        style={maxHeight !== undefined ? { maxHeight } : undefined}
        aria-busy={loading || undefined}
      >
        <table className="w-full border-collapse text-left text-sm" aria-label={ariaLabel}>
          <thead>
            <tr className="border-b border-current/10 text-[0.65rem] font-semibold uppercase tracking-wider text-ink/75">
              {selectable ? (
                <th scope="col" className={cn(headerCell, 'w-10 bg-surface-raised')}>
                  <span className="relative inline-flex items-center justify-center">
                    <input
                      ref={headerCheckbox}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={selectAllLabel}
                      className={CHECKBOX_CLASSES}
                    />
                    {someSelected ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute h-0.5 w-2.5 rounded-full bg-ink"
                      />
                    ) : null}
                  </span>
                </th>
              ) : null}
              {columns.map((column) => {
                const isActive = activeSortKey === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      column.sortable
                        ? isActive
                          ? activeSortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    className={cn(
                      headerCell,
                      'bg-surface-raised',
                      column.className,
                      visibilityClasses(column),
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="inline-flex items-center gap-1 rounded-sm font-semibold uppercase tracking-wider transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {column.header ?? column.label}
                        <span className={cn('text-gold', !isActive && 'opacity-30')}>
                          <Icon
                            name={
                              isActive ? (activeSortDir === 'asc' ? 'sortAsc' : 'sortDesc') : 'sort'
                            }
                            size={14}
                          />
                        </span>
                      </button>
                    ) : (
                      (column.header ?? column.label)
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="stagger-rows divide-y divide-current/[0.06]">
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {selectable ? (
                    <td className="px-4 py-3">
                      <div className="size-4 animate-pulse rounded bg-current/10" />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-4 py-3', column.cellClassName, visibilityClasses(column))}
                    >
                      <div className="h-4 w-full animate-pulse rounded bg-current/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-ink/60">{emptyMessage || 'No data found'}</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={columnCount} style={{ height: paddingTop, padding: 0 }} />
                  </tr>
                ) : null}
                {renderedRows.map((row) => {
                  const key = rowKey(row);
                  const selected = selectionSet.has(key);
                  return (
                    <tr
                      key={key}
                      aria-selected={selectable ? selected : undefined}
                      className={cn(
                        'transition-colors',
                        selected ? 'bg-brand/10' : undefined,
                        onRowClick
                          ? 'cursor-pointer hover:bg-current/[0.04]'
                          : 'hover:bg-current/[0.02]',
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable ? (
                        <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleRow(key)}
                            aria-label={selectRowLabel}
                            className={CHECKBOX_CLASSES}
                          />
                        </td>
                      ) : null}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3.5 text-sm text-ink/90',
                            column.cellClassName,
                            visibilityClasses(column),
                          )}
                        >
                          {column.render
                            ? column.render(row)
                            : String((row as Record<string, unknown>)[column.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={columnCount} style={{ height: paddingBottom, padding: 0 }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
