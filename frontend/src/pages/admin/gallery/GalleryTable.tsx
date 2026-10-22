import { Icon } from '@/components/icons';
import { RowActionsMenu } from '@/components/ui';
import type { GalleryItem } from '@/pages/gallery/data';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

const SKELETON_ROWS = 6;

interface GalleryTableProps {
  items: GalleryItem[];
  loading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onAddMedia: () => void;
  onPreview: (item: GalleryItem) => void;
  onEdit: (item: GalleryItem) => void;
  onTogglePublished: (item: GalleryItem) => void;
  onCopyUrl: (url: string) => void;
  onDelete: (item: GalleryItem) => void;
}

export function GalleryTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onAddMedia,
  onPreview,
  onEdit,
  onTogglePublished,
  onCopyUrl,
  onDelete,
}: GalleryTableProps) {
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
            title="No gallery items found"
            description={
              hasActiveFilters
                ? 'No media matches your search query or filters. Try adjusting your search criteria.'
                : 'Publish bridal, traditional, and atelier lookbook frames to showcase your atelier craftsmanship.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Add First Media'}
            onAction={hasActiveFilters ? onResetFilters : onAddMedia}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[800px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[72px]">Media</th>
                <th className="py-3 px-4 min-w-[200px]">Title & Slug</th>
                <th className="py-3 px-4 w-[130px]">Category</th>
                <th className="py-3 px-4 w-[90px]">Type</th>
                <th className="py-3 px-4 w-[80px] text-center">Order</th>
                <th className="py-3 px-4 w-[110px]">Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((item) => {
                const isVideo = item.mediaType === 'video';
                const displaySrc = isVideo ? item.poster || item.src : item.src;

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
                        title="Click to preview media"
                      >
                        <OptimizedImage
                          src={displaySrc}
                          alt={item.alt || item.title}
                          sizes="48px"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                        />
                        {isVideo ? (
                          <span className="on-dark absolute inset-0 flex items-center justify-center bg-espresso/45 text-white text-xs">
                            <Icon name="play" size={16} />
                          </span>
                        ) : null}
                      </button>
                    </td>

                    {/* Title & Slug */}
                    <td className="py-2.5 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(item)}
                          className="font-semibold text-inherit text-left hover:underline text-xs sm:text-sm truncate max-w-[260px] block cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] opacity-70 truncate max-w-[220px]">
                            /{item.slug}
                          </span>
                          {item.alt ? (
                            <span className="text-[10px] opacity-40 truncate max-w-[120px]" title={item.alt}>
                              · {item.alt}
                            </span>
                          ) : null}
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

                    {/* Type */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] opacity-75 font-medium">
                        {isVideo ? 'Video' : 'Image'}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-xs opacity-70 font-semibold">
                        #{item.sortOrder}
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
                        label={`Actions for ${item.title}`}
                        row={item}
                        actions={[
                          {
                            id: 'preview',
                            label: 'Quick Preview',
                            icon: 'view',
                            onSelect: (row) => onPreview(row),
                          },
                          {
                            id: 'edit',
                            label: 'Edit Details',
                            icon: 'edit',
                            onSelect: (row) => onEdit(row),
                          },
                          {
                            id: 'publish',
                            label: item.published ? 'Unpublish to Draft' : 'Publish Live',
                            iconFor: (row) => (row.published ? 'archived' : 'publish'),
                            onSelect: (row) => onTogglePublished(row),
                          },
                          {
                            id: 'copy',
                            label: 'Copy Image URL',
                            icon: 'copy',
                            onSelect: (row) => onCopyUrl(row.src),
                          },
                          {
                            id: 'delete',
                            label: 'Delete Item',
                            icon: 'delete',
                            tone: 'danger',
                            divider: true,
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
    </div>
  );
}
