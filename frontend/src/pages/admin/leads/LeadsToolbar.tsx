import { LEAD_DESK_OPTIONS, LEAD_QUALITY_OPTIONS, LEAD_STATUS_OPTIONS } from './types';

interface LeadsToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
  selectedDesk: string;
  onDeskChange: (desk: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onExportCsv: () => void;
  onNewLead: () => void;
}

export function LeadsToolbar({
  query,
  onQueryChange,
  selectedStatus,
  onStatusChange,
  selectedQuality,
  onQualityChange,
  selectedDesk,
  onDeskChange,
  hasActiveFilters,
  onResetFilters,
  filteredCount,
  totalCount,
  onExportCsv,
  onNewLead,
}: LeadsToolbarProps) {
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
        {/* Left side: Search & Filters */}
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
              placeholder="Search name, phone, service, city..."
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

          {/* Status Filter */}
          <div className="w-[125px] shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Statuses</option>
              {LEAD_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Filter */}
          <div className="w-[125px] shrink-0">
            <select
              value={selectedQuality}
              onChange={(e) => onQualityChange(e.target.value)}
              aria-label="Filter by quality"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Quality</option>
              {LEAD_QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q === 'hot' ? '🔥 Hot' : q === 'warm' ? '⚡ Warm' : '❄️ Cold'}
                </option>
              ))}
            </select>
          </div>

          {/* Desk / Assignee Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedDesk}
              onChange={(e) => onDeskChange(e.target.value)}
              aria-label="Filter by desk"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Desks</option>
              {LEAD_DESK_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
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

        {/* Right side: Count + CSV Export + New Lead */}
        <div className="flex items-center justify-between gap-2.5 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-lg border px-3 py-2 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer whitespace-nowrap"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
          >
            📥 Export CSV
          </button>

          <button
            type="button"
            onClick={onNewLead}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            <span className="text-sm font-black">+</span>
            <span>New Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
