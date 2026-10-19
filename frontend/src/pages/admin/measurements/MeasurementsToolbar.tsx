import { Icon } from '@/components/icons';
import type { MeasurementTemplate } from '@/services/measurements/measurementsService';
import { SILHOUETTE_FALLBACKS, type DeskTab } from './types';
import { cn } from '@/utils/cn';

interface MeasurementsToolbarProps {
  deskTab: DeskTab;
  onDeskTabChange: (tab: DeskTab) => void;
  pendingCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  silhouetteFilter: string;
  onSilhouetteChange: (code: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  templates: MeasurementTemplate[];
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  onNewMeasurement: () => void;
}

export function MeasurementsToolbar({
  deskTab,
  onDeskTabChange,
  pendingCount,
  searchQuery,
  onSearchChange,
  silhouetteFilter,
  onSilhouetteChange,
  statusFilter,
  onStatusChange,
  templates,
  filteredCount,
  totalCount,
  onReset,
  onNewMeasurement,
}: MeasurementsToolbarProps) {
  const isFiltered =
    Boolean(searchQuery) ||
    Boolean(silhouetteFilter) ||
    statusFilter !== 'all' ||
    deskTab !== 'all';

  const silhouetteOptions =
    templates.length > 0
      ? templates.map((t) => ({ code: t.code, name: t.name }))
      : SILHOUETTE_FALLBACKS.map((t) => ({ code: t.code, name: t.name }));

  return (
    <div className="space-y-3">
      {/* Desk Mode Tabs (All vs Pending Approval) */}
      <div className="flex items-center gap-2 border-b pb-1 border-line">
        <button
          type="button"
          onClick={() => onDeskTabChange('all')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer',
            deskTab === 'all'
              ? 'bg-brand text-ink-on-brand shadow-xs'
              : 'opacity-65 hover:opacity-100 hover:bg-current/[0.05]',
          )}
        >
          <span>All Fit Cards</span>
          <span className="text-[10px] opacity-75 font-mono">({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onDeskTabChange('pending')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer',
            deskTab === 'pending'
              ? 'bg-amber-500 text-ink shadow-xs'
              : 'opacity-65 hover:opacity-100 hover:bg-current/[0.05]',
          )}
        >
          <span>Pending Tailor Approval</span>
          {pendingCount > 0 ? (
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-black',
                deskTab === 'pending' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400',
              )}
            >
              {pendingCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Main Single Row Toolbar Card */}
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
                placeholder="Search client, phone, fit title..."
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition border-line"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-50 hover:opacity-100 cursor-pointer"
                  title="Clear search"
                >
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </div>

            {/* Silhouette Garment Filter */}
            <div className="w-[165px] shrink-0">
              <select
                value={silhouetteFilter}
                onChange={(e) => onSilhouetteChange(e.target.value)}
                aria-label="Filter by silhouette"
                className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition cursor-pointer bg-surface-raised border-line"
              >
                <option value="">All Silhouettes</option>
                {silhouetteOptions.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-[140px] shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                aria-label="Filter by approval status"
                className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition cursor-pointer bg-surface-raised border-line"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Fits</option>
                <option value="pending_approval">Pending Review</option>
                <option value="draft">Drafts</option>
                <option value="archived">Archived</option>
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

          {/* Right side: Count & Action */}
          <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
            <span className="text-xs opacity-60 whitespace-nowrap">
              Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
            </span>

            <button
              type="button"
              onClick={onNewMeasurement}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
            >
              <span className="text-sm font-black">+</span>
              <span>New Fit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
