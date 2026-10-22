import { RowActionsMenu } from '@/components/ui';
import { Icon } from '@/components/icons';
import type { ServiceDetail } from '@/pages/services/data';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

const SKELETON_ROWS = 6;

interface ServicesTableProps {
  items: ServiceDetail[];
  loading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onAddService: () => void;
  onPreview: (item: ServiceDetail) => void;
  onEdit: (item: ServiceDetail) => void;
  onTogglePublished: (item: ServiceDetail) => void;
  onCopyUrl: (slug: string) => void;
  onDelete: (item: ServiceDetail) => void;
}

export function ServicesTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onAddService,
  onPreview,
  onEdit,
  onTogglePublished,
  onCopyUrl,
  onDelete,
}: ServicesTableProps) {

  return (
    <div
      className="rounded-xl border shadow-xs overflow-visible transition-colors bg-surface-raised border-line text-ink-raised"
    >
      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} variant="table" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No services found"
            description={
              hasActiveFilters
                ? 'No atelier services match your filter query. Try adjusting your search criteria.'
                : 'Create signature bridal couture, embroidery, and atelier services for your studio catalog.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Add First Service'}
            onAction={hasActiveFilters ? onResetFilters : onAddService}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[72px]">Cover</th>
                <th className="py-3 px-4 min-w-[200px]">Service & Slug</th>
                <th className="py-3 px-4 w-[120px]">Category</th>
                <th className="py-3 px-4 w-[130px]">Starting Price</th>
                <th className="py-3 px-4 w-[120px]">Fulfillment</th>
                <th className="py-3 px-4 w-[110px]">Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((item) => {
                const displaySrc = item.cardImage || item.bannerImage;

                return (
                  <tr
                    key={item.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Media Thumbnail */}
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="relative block h-12 w-12 rounded-lg border overflow-hidden shadow-2xs group/thumb transition-transform active:scale-95 cursor-pointer border-line"
                        title="Click to preview service"
                      >
                        {displaySrc ? (
                          <OptimizedImage
                            src={displaySrc}
                            alt={item.title}
                            sizes="48px"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-current/5 text-lg">
                            <Icon name="services" size={16} />
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Title & Slug */}
                    <td className="py-2.5 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(item)}
                          className="font-semibold text-inherit text-left hover:underline text-xs sm:text-sm truncate max-w-[240px] block cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] opacity-70 truncate max-w-[200px]">
                            /{item.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-brand/12 text-brand-strong border-brand/25"
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Starting Price */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-xs opacity-90">
                        {item.pricing?.startingFrom || (item.basePriceFrom ? `₹${item.basePriceFrom.toLocaleString('en-IN')}` : 'Consultation')}
                      </span>
                    </td>

                    {/* Fulfillment */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border',
                          item.isFulfillable
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'opacity-70 border-current/15',
                        )}
                      >
                        {item.isFulfillable ? 'Catalog Linked' : 'Bespoke'}
                      </span>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onTogglePublished(item)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition hover:opacity-85 cursor-pointer',
                          item.published
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
                            : 'bg-current/[0.06] opacity-70 border-current/15',
                        )}
                        title="Click to toggle publish status"
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            item.published ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-40',
                          )}
                        />
                        <span>{item.published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Row Actions (Three-Dot Menu) */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap w-[70px]">
                      <RowActionsMenu
                        label={`Actions for item.title`}
                        row={item}
                        actions={[
          {
            id: 'onPreview',
            label: 'Quick Preview',
            icon: 'view',
            onSelect: (row) => onPreview(row),
          },
          {
            id: 'onEdit',
            label: 'Edit Service',
            icon: 'edit',
            onSelect: (row) => onEdit(row),
          },
          {
            id: 'onTogglePublished',
            label: item.published ? 'Unpublish to Draft' : 'Publish Live',
iconFor: (row) => (row.published ? 'archived' : 'publish'),
            onSelect: (row) => onTogglePublished(row),
          },
          {
            id: 'onCopyUrl',
            label: 'Copy Public Link',
            icon: 'copy',
            onSelect: (row) => onCopyUrl(row.slug),
          },
          {
            id: 'onDelete',
            label: 'Delete Service',
            icon: 'delete',
            divider: true,
            tone: 'danger',
            onSelect: (row) => onDelete(row),
          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Dropdown Menu */}
      
    </div>
  );
}
