import { Icon } from '@/components/icons';
import { SPECIALIZATIONS, EMPLOYMENT_TYPES } from './types';

interface StaffToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  employmentFilter: string;
  onEmploymentChange: (type: string) => void;
  specializationFilter: string;
  onSpecializationChange: (spec: string) => void;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  onAddStaff: () => void;
}

export function StaffToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  employmentFilter,
  onEmploymentChange,
  specializationFilter,
  onSpecializationChange,
  filteredCount,
  totalCount,
  onReset,
  onAddStaff,
}: StaffToolbarProps) {
  const isFiltered =
    Boolean(searchQuery) ||
    statusFilter !== 'active' ||
    Boolean(employmentFilter) ||
    Boolean(specializationFilter);

  return (
    <div
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search artisan name, phone, locality..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition border-line"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-50 hover:opacity-100 cursor-pointer"
                title="Clear search"
              >
                <Icon name="close" size={12} />
              </button>
            ) : null}
          </div>

          {/* Status filter */}
          <div className="w-[125px] shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Employment filter */}
          <div className="w-[130px] shrink-0">
            <select
              value={employmentFilter}
              onChange={(e) => onEmploymentChange(e.target.value)}
              aria-label="Filter by employment type"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="">All Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization filter */}
          <div className="w-[155px] shrink-0">
            <select
              value={specializationFilter}
              onChange={(e) => onSpecializationChange(e.target.value)}
              aria-label="Filter by craft specialization"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="">All Crafts & Skills</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {isFiltered ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-medium opacity-70 hover:opacity-100 transition cursor-pointer border-line"
              title="Reset all filters"
            >
              <span>↺</span>
              <span>Reset</span>
            </button>
          ) : null}
        </div>

        {/* Right side: Counter & Add Button */}
        <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onAddStaff}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Add Staff</span>
          </button>
        </div>
      </div>
    </div>
  );
}
