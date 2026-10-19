import { CUSTOMER_SOURCES } from './types';

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
      className="rounded-xl border p-3.5 shadow-xs transition-colors"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Filter controls */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search name, phone, email, locality..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-50 hover:opacity-100 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Source Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              aria-label="Filter by source"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="">All Sources</option>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Portal Status Filter */}
          <div className="w-[135px] shrink-0">
            <select
              value={selectedPortal}
              onChange={(e) => onPortalChange(e.target.value)}
              aria-label="Filter by portal status"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="">All Portal Status</option>
              <option value="active">Active Login</option>
              <option value="invited">Invite Sent</option>
              <option value="none">No Portal Account</option>
            </select>
          </div>

          {/* Open Orders Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedOrders}
              onChange={(e) => onOrdersChange(e.target.value)}
              aria-label="Filter by open orders"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="">All Orders</option>
              <option value="true">In Production (Active)</option>
              <option value="false">No Active Orders</option>
            </select>
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
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onNewCustomer}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            <span className="text-sm font-black">+</span>
            <span>Register Client</span>
          </button>
        </div>
      </div>
    </div>
  );
}
