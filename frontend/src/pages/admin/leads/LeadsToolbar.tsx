import { Icon } from '@/components/icons';
import { LEAD_DESK_OPTIONS, LEAD_QUALITY_OPTIONS, LEAD_STATUS_OPTIONS } from './types';
import { Select } from '@/components/ui';

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
              placeholder="Search name, phone, service, city..."
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
          <div className="w-[125px] shrink-0">
            <Select
              value={selectedStatus}
              aria-label="Filter by status"
              onChange={(value) => onStatusChange(value)}
              options={[{ value: 'All', label: 'All Statuses' }, ...LEAD_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
            />
          </div>

          {/* Quality Filter */}
          <div className="w-[125px] shrink-0">
            <Select
              value={selectedQuality}
              aria-label="Filter by quality"
              onChange={(value) => onQualityChange(value)}
              options={[{ value: 'All', label: 'All Quality' }, ...LEAD_QUALITY_OPTIONS.map((q) => ({ value: q, label: q === 'hot' ? 'Hot' : q === 'warm' ? 'Warm' : 'Cold' }))]}
            />
          </div>

          {/* Desk / Assignee Filter */}
          <div className="w-[140px] shrink-0">
            <Select
              value={selectedDesk}
              aria-label="Filter by desk"
              onChange={(value) => onDeskChange(value)}
              options={[{ value: 'All', label: 'All Desks' }, ...LEAD_DESK_OPTIONS.map((d) => ({ value: d, label: d }))]}
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

        {/* Right side: Count + CSV Export + New Lead */}
        <div className="flex items-center justify-between gap-2.5 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-70 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-lg border px-3 py-2 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer whitespace-nowrap border-line"
          >
            <Icon name="download" size={14} className="mr-1 inline align-middle" /> Export CSV
          </button>

          <button
            type="button"
            onClick={onNewLead}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>New Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
