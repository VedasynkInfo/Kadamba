import type { GalleryItem } from '@/pages/gallery/data';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

interface GalleryPreviewModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onEdit: (item: GalleryItem) => void;
  onTogglePublished: (item: GalleryItem) => void;
  onCopyUrl: (url: string) => void;
}

export function GalleryPreviewModal({
  item,
  onClose,
  onEdit,
  onTogglePublished,
  onCopyUrl,
}: GalleryPreviewModalProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand/15 text-brand"
            >
              {item.category}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold',
                item.published ? 'text-emerald-500 bg-emerald-500/10' : 'opacity-60 bg-current/[0.06]',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.published ? 'Live' : 'Draft'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Media Stage & Details */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Media Visual Stage */}
          <div
            className="rounded-xl border overflow-hidden flex items-center justify-center bg-black/40 relative min-h-[260px] max-h-[400px] border-line"
          >
            {item.mediaType === 'video' ? (
              <video
                src={item.src}
                poster={item.poster}
                controls
                preload="metadata"
                className="max-h-[380px] w-full object-contain"
              />
            ) : (
              <OptimizedImage
                src={item.src}
                alt={item.alt || item.title}
                sizes="(max-width: 768px) 90vw, 720px"
                className="max-h-[380px] w-full object-contain"
              />
            )}
          </div>

          {/* Information Cards */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-inherit font-heading">{item.title}</h3>
              <p className="font-mono text-xs opacity-60 mt-0.5">/gallery/{item.slug}</p>
            </div>

            {item.alt ? (
              <div
                className="rounded-lg p-3 border text-xs bg-surface-sunken border-line"
              >
                <span className="font-semibold block mb-0.5 opacity-70">Alt Description:</span>
                <span className="opacity-90">{item.alt}</span>
              </div>
            ) : null}

            {/* Google SERP Snippet Preview */}
            <div
              className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">
                Search Snippet Preview
              </p>
              <p className="text-xs text-blue-500 hover:underline cursor-pointer truncate font-medium">
                {item.metaTitle || `${item.title} | Kadamba Designer Studio`}
              </p>
              <p className="text-[11px] text-emerald-600 truncate mt-0.5">
                https://kadamba.studio/gallery/{item.slug}
              </p>
              <p className="text-xs opacity-70 line-clamp-2 mt-1">
                {item.metaDescription ||
                  `Explore ${item.title} in Kadamba's bespoke bridal and luxury couture atelier gallery.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 border-line bg-surface-raised"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCopyUrl(item.src)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              📋 Copy URL
            </button>
            <a
              href={item.src}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition inline-flex items-center gap-1 cursor-pointer border-line"
            >
              <span>Open Media</span>
              <span>↗</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePublished(item)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              {item.published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="rounded-lg px-4 py-1.5 text-xs font-bold shadow-xs transition hover:opacity-95 cursor-pointer bg-brand text-ink-on-brand"
            >
              Edit Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
