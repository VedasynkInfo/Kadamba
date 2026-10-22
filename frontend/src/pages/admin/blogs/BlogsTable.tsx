import { RowActionsMenu } from '@/components/ui';
import { Icon } from '@/components/icons';
import type { BlogPost } from '@/pages/blogs/data';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

const SKELETON_ROWS = 6;

interface BlogsTableProps {
  items: BlogPost[];
  loading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onAddBlog: () => void;
  onPreview: (item: BlogPost) => void;
  onEdit: (item: BlogPost) => void;
  onTogglePublished: (item: BlogPost) => void;
  onCopyUrl: (slug: string) => void;
  onDelete: (item: BlogPost) => void;
}

export function BlogsTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onAddBlog,
  onPreview,
  onEdit,
  onTogglePublished,
  onCopyUrl,
  onDelete,
}: BlogsTableProps) {

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
            title="No blog articles found"
            description={
              hasActiveFilters
                ? 'No journal articles match your filter criteria. Try adjusting your search query.'
                : 'Publish editorial bridal stories, styling tutorials, and atelier insights.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Add First Article'}
            onAction={hasActiveFilters ? onResetFilters : onAddBlog}
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
                <th className="py-3 px-4 min-w-[200px]">Article & Slug</th>
                <th className="py-3 px-4 w-[130px]">Category</th>
                <th className="py-3 px-4 w-[110px]">Read Time</th>
                <th className="py-3 px-4 w-[100px]">Featured</th>
                <th className="py-3 px-4 w-[110px]">Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((item) => {

                return (
                  <tr
                    key={item.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Cover Thumbnail */}
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="relative block h-12 w-12 rounded-lg border overflow-hidden shadow-2xs group/thumb transition-transform active:scale-95 cursor-pointer border-line"
                        title="Click to preview article"
                      >
                        {item.coverImage ? (
                          <OptimizedImage
                            src={item.coverImage}
                            alt={item.title}
                            sizes="48px"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-current/5 text-lg">
                            <Icon name="newspaper" size={16} />
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

                    {/* Read Time */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="text-xs opacity-75">
                        <Icon name="timer" size={14} className="mr-1 inline align-middle" /> {item.readMinutes || 3} mins
                      </span>
                    </td>

                    {/* Featured Flag */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {item.featured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <Icon name="featured" size={14} className="mr-1 inline align-middle" /> Featured
                        </span>
                      ) : (
                        <span className="text-xs opacity-40">—</span>
                      )}
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
            id: 'onPreview',
            label: 'Quick Preview',
            icon: 'view',
            onSelect: (row) => onPreview(row),
          },
          {
            id: 'onEdit',
            label: 'Edit Article',
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
            label: 'Copy Article Link',
            icon: 'copy',
            onSelect: (row) => onCopyUrl(row.slug),
          },
          {
            id: 'onDelete',
            label: 'Delete Article',
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
