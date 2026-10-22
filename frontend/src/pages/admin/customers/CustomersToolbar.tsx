import { Icon } from '@/components/icons';
import { CUSTOMER_SOURCES } from './types';
import { Select } from '@/components/ui';

interface CustomersToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedSource: string;
  onSourceChange: (source: string) => void;
  selectedPortal: string;
  onPortalChange: (portal: string) => void;
  selectedOrders: string;
  onOrdersChange: (orders: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onNewCustomer: () => void;
}

export function CustomersToolbar({
  query,
  onQueryChange,
  selectedSource,
  onSourceChange,
  selectedPortal,
  onPortalChange,
  selectedOrders,
  onOrdersChange,
  hasActiveFilters,
  onResetFilters,
  filteredCount,
  totalCount,
  onNewCustomer,
}: CustomersToolbarProps) {
  return (
    <div
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Filter controls */}
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
              placeholder="Search name, phone, email, locality..."
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

          {/* Source Filter */}
          <div className="w-[140px] shrink-0">
            <Select
              value={selectedSource}
              aria-label="Filter by source"
              onChange={(value) => onSourceChange(value)}
              options={[{ value: '', label: 'All Sources' }, ...CUSTOMER_SOURCES.map((s) => ({ value: s.value, label: s.label }))]}
            />
          </div>

          {/* Portal Status Filter */}
          <div className="w-[135px] shrink-0">
            <Select
              value={selectedPortal}
              aria-label="Filter by portal status"
              onChange={(value) => onPortalChange(value)}
              options={[{ value: '', label: 'All Portal Status' }, { value: 'active', label: 'Active Login' }, { value: 'invited', label: 'Invite Sent' }, { value: 'none', label: 'No Portal Account' }]}
            />
          </div>

          {/* Open Orders Filter */}
          <div className="w-[140px] shrink-0">
            <Select
              value={selectedOrders}
              aria-label="Filter by open orders"
              onChange={(value) => onOrdersChange(value)}
              options={[{ value: '', label: 'All Orders' }, { value: 'true', label: 'In Production (Active)' }, { value: 'false', label: 'No Active Orders' }]}
            />
          </div>

          {/* Active Filter Clear Button */}
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

        {/* Right side: Count + Register Button */}
        <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-70 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onNewCustomer}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Register Client</span>
          </button>
        </div>
      </div>
    </div>
  );
}
