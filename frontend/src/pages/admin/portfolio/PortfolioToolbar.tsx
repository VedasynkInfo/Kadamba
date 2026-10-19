import { PORTFOLIO_CATEGORIES } from './types';

interface PortfolioToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  sortBy: 'titleAsc' | 'titleDesc' | 'yearDesc';
  onSortByChange: (sort: 'titleAsc' | 'titleDesc' | 'yearDesc') => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onAddProject: () => void;
}

export function PortfolioToolbar({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onResetFilters,
  filteredCount,
  totalCount,
  onAddProject,
}: PortfolioToolbarProps) {
  return (
    <div
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Filter controls */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search portfolio title, slug, summary..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition border-line"
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

          {/* Category Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by category"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="All">All Categories</option>
              {PORTFOLIO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-[125px] shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="w-[135px] shrink-0">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'titleAsc' | 'titleDesc' | 'yearDesc')}
              aria-label="Sort portfolio"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition cursor-pointer bg-surface-raised border-line"
            >
              <option value="yearDesc">Latest Year</option>
              <option value="titleAsc">Title (A–Z)</option>
              <option value="titleDesc">Title (Z–A)</option>
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

        {/* Right side: Summary Count + Add Action */}
        <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onAddProject}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Add Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}
