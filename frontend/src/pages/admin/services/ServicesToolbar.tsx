import { Icon } from '@/components/icons';
import { SERVICE_CATEGORIES } from './types';
import { Select } from '@/components/ui';

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
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Search & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-70">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search service title, slug, summary..."
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

          {/* Category Filter */}
          <div className="w-[140px] shrink-0">
            <Select
              value={selectedCategory}
              aria-label="Filter by category"
              onChange={(value) => onCategoryChange(value)}
              options={[{ value: 'All', label: 'All Categories' }, ...SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
          </div>

          {/* Status Filter */}
          <div className="w-[125px] shrink-0">
            <Select
              value={selectedStatus}
              aria-label="Filter by status"
              onChange={(value) => onStatusChange(value)}
              options={[{ value: 'All', label: 'All Status' }, { value: 'Published', label: 'Published' }, { value: 'Draft', label: 'Draft' }]}
            />
          </div>

          {/* Catalog Fulfillment Filter */}
          <div className="w-[140px] shrink-0">
            <Select
              value={selectedFulfillable}
              aria-label="Filter by fulfillment"
              onChange={(value) => onFulfillableChange(value)}
              options={[{ value: 'All', label: 'All Fulfillment' }, { value: 'Linked', label: 'Catalog Linked' }, { value: 'Bespoke', label: 'Bespoke / Custom' }]}
            />
          </div>

          {/* Sort By Filter */}
          <div className="w-[130px] shrink-0">
            <Select
              value={sortBy}
              aria-label="Sort services"
              onChange={(value) => onSortByChange(value as 'titleAsc' | 'titleDesc' | 'category')}
              options={[{ value: 'titleAsc', label: 'Title (A–Z)' }, { value: 'titleDesc', label: 'Title (Z–A)' }, { value: 'category', label: 'Category' }]}
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

        {/* Right side: Summary Count + Add Service Action */}
        <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-70 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onAddService}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Add Service</span>
          </button>
        </div>
      </div>
    </div>
  );
}
