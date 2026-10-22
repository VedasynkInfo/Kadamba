import { Icon } from '@/components/icons';
import { Link } from 'react-router-dom';
import { ORDER_PRIORITIES } from './types';
import { Select } from '@/components/ui';

interface OrdersToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onNewOrder: () => void;
}

export function OrdersToolbar({
  query,
  onQueryChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  hasActiveFilters,
  onResetFilters,
  filteredCount,
  totalCount,
  onNewOrder,
}: OrdersToolbarProps) {
  return (
    <div
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-70">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search order #, client, phone, title..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition border-line"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-70 hover:opacity-100 cursor-pointer"
                title="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            ) : null}
          </div>

          {/* Status Filter */}
          <div className="w-[145px] shrink-0">
            <Select
              value={selectedStatus}
              aria-label="Filter by order status"
              onChange={(value) => onStatusChange(value)}
              options={[{ value: 'All', label: 'All Statuses' }]}
            />
          </div>

          {/* Priority Filter */}
          <div className="w-[130px] shrink-0">
            <Select
              value={selectedPriority}
              aria-label="Filter by priority"
              onChange={(value) => onPriorityChange(value)}
              options={[{ value: '', label: 'All Priorities' }, ...ORDER_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer"
              title="Reset all filters"
            >
              Reset
            </button>
          ) : null}
        </div>

        {/* Right side: Count & Action */}
        <div className="flex items-center justify-between gap-2.5 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-70 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <Link
            to="/admin/orders/board"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-current/[0.05] whitespace-nowrap cursor-pointer border-line"
          >
            <Icon name="grid" size={14} />
            <span>Board</span>
          </Link>

          <button
            type="button"
            onClick={onNewOrder}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>New Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
