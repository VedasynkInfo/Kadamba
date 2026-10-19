import { SERVICE_CATEGORIES } from './types';

interface ServicesToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedFulfillable: string;
  onFulfillableChange: (fulfillable: string) => void;
  sortBy: 'titleAsc' | 'titleDesc' | 'category';
  onSortByChange: (sort: 'titleAsc' | 'titleDesc' | 'category') => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onAddService: () => void;
}

export function ServicesToolbar({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedFulfillable,
  onFulfillableChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onResetFilters,
  filteredCount,
  totalCount,
  onAddService,
}: ServicesToolbarProps) {
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
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search service title, slug, summary..."
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

          {/* Category Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by category"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Categories</option>
              {SERVICE_CATEGORIES.map((c) => (
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
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Catalog Fulfillment Filter */}
          <div className="w-[140px] shrink-0">
            <select
              value={selectedFulfillable}
              onChange={(e) => onFulfillableChange(e.target.value)}
              aria-label="Filter by fulfillment"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Fulfillment</option>
              <option value="Linked">Catalog Linked</option>
              <option value="Bespoke">Bespoke / Custom</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="w-[130px] shrink-0">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'titleAsc' | 'titleDesc' | 'category')}
              aria-label="Sort services"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="titleAsc">Title (A–Z)</option>
              <option value="titleDesc">Title (Z–A)</option>
              <option value="category">Category</option>
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

        {/* Right side: Summary Count + Add Service Action */}
        <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onAddService}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            <span className="text-sm font-black">+</span>
            <span>Add Service</span>
          </button>
        </div>
      </div>
    </div>
  );
}
