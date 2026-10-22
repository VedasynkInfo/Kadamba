import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
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
  const [menuAnchor, setMenuAnchor] = useState<{
    item: GalleryItem;
    top: number;
    right: number;
    showAbove: boolean;
  } | null>(null);

  // Close active dropdown on escape, scroll, or resize
  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAnchor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuAnchor]);

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, item: GalleryItem) {
    e.stopPropagation();
    if (menuAnchor?.item.id === item.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      item,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

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
                const isMenuOpen = menuAnchor?.item.id === item.id;

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
                          <span className="absolute inset-0 flex items-center justify-center bg-espresso/45 text-white text-xs">
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
                          <span className="font-mono text-[10px] opacity-60 truncate max-w-[220px]">
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
                      <span className="font-mono text-xs opacity-60 font-semibold">
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
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
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
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, item)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-brand/15 text-brand-strong font-bold'
                            : 'hover:bg-current/[0.08]', isMenuOpen ? 'border-brand' : 'border-line'
                        )}
                        aria-label="Actions menu"
                        aria-expanded={isMenuOpen}
                      >
                        <span className="text-base leading-none font-bold">⋮</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Viewport-Anchored Dropdown Menu (Prevents Table Overflow/Clipping & Alignment Disruption) */}
      {menuAnchor ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuAnchor(null)}
          />

          <div
            className="fixed z-50 w-48 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs bg-surface-raised border-line text-ink-raised"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const itm = menuAnchor.item;
                setMenuAnchor(null);
                onPreview(itm);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>Quick Preview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const itm = menuAnchor.item;
                setMenuAnchor(null);
                onEdit(itm);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="edit" size={14} />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const itm = menuAnchor.item;
                setMenuAnchor(null);
                onTogglePublished(itm);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name={menuAnchor.item.published ? 'archived' : 'publish'} size={14} />
              <span>{menuAnchor.item.published ? 'Unpublish to Draft' : 'Publish Live'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const src = menuAnchor.item.src;
                setMenuAnchor(null);
                onCopyUrl(src);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="copy" size={14} />
              <span>Copy Image URL</span>
            </button>

            <div
              className="my-1 border-t border-line"
            />

            <button
              type="button"
              onClick={() => {
                const itm = menuAnchor.item;
                setMenuAnchor(null);
                onDelete(itm);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-semibold text-rose-500 transition hover:bg-rose-500/10 cursor-pointer"
            >
              <Icon name="delete" size={14} />
              <span>Delete Item</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
