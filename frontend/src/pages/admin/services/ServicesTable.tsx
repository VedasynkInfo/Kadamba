import { useState, useEffect } from 'react';
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
  const [menuAnchor, setMenuAnchor] = useState<{
    item: ServiceDetail;
    top: number;
    right: number;
    showAbove: boolean;
  } | null>(null);

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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, item: ServiceDetail) {
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
              className="divide-y border-line"
            >
              {items.map((item) => {
                const displaySrc = item.cardImage || item.bannerImage;
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
                            ✨
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
                          <span className="font-mono text-[10px] opacity-60 truncate max-w-[200px]">
                            /{item.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-brand/12 text-brand border-brand/25"
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
                            : 'opacity-60 border-current/15',
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
                            ? 'bg-brand/15 text-brand font-bold'
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

      {/* Floating Action Dropdown Menu */}
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
              <span className="text-sm">👁️</span>
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
              <span className="text-sm">✏️</span>
              <span>Edit Service</span>
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
              <span className="text-sm">{menuAnchor.item.published ? '📦' : '🚀'}</span>
              <span>{menuAnchor.item.published ? 'Unpublish to Draft' : 'Publish Live'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const slug = menuAnchor.item.slug;
                setMenuAnchor(null);
                onCopyUrl(slug);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <span className="text-sm">📋</span>
              <span>Copy Public Link</span>
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
              <span className="text-sm">🗑️</span>
              <span>Delete Service</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
