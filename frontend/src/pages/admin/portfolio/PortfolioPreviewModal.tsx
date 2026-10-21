import type { PortfolioProject } from '@/pages/portfolio/data';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

interface PortfolioPreviewModalProps {
  item: PortfolioProject | null;
  onClose: () => void;
  onEdit: (item: PortfolioProject) => void;
  onTogglePublished: (item: PortfolioProject) => void;
  onCopyUrl: (slug: string) => void;
}

export function PortfolioPreviewModal({
  item,
  onClose,
  onEdit,
  onTogglePublished,
  onCopyUrl,
}: PortfolioPreviewModalProps) {
  if (!item) return null;

  const displayImage = item.coverImage || item.bannerImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-spring-in bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand/15 text-brand-strong"
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
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {displayImage ? (
            <div
              className="rounded-xl border overflow-hidden flex items-center justify-center bg-black/40 relative min-h-[220px] max-h-[340px] border-line"
            >
              <OptimizedImage
                src={displayImage}
                alt={item.coverAlt || item.title}
                sizes="(max-width: 768px) 90vw, 640px"
                className="max-h-[320px] w-full object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs opacity-60 mb-1">
                <span>{item.year || '2025'}</span>
                <span>•</span>
                <span>{item.location || 'Kurnool Atelier'}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-inherit font-heading">{item.title}</h3>
              <p className="font-mono text-xs opacity-60 mt-0.5">/portfolio/{item.slug}</p>
            </div>

            {item.summary ? (
              <p className="text-xs opacity-80 leading-relaxed">{item.summary}</p>
            ) : null}

            {item.story?.length ? (
              <div
                className="rounded-lg p-3.5 border text-xs space-y-2 opacity-85 leading-relaxed bg-surface-sunken border-line"
              >
                <span className="font-semibold block text-[10px] uppercase tracking-wider opacity-60">
                  Couture Story & Craftsmanship:
                </span>
                {item.story.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {item.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full border text-[11px] opacity-75 border-line"
                  >
                    #{t}
                  </span>
                ))}
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
                https://kadamba.studio/portfolio/{item.slug}
              </p>
              <p className="text-xs opacity-70 line-clamp-2 mt-1">
                {item.metaDescription || item.summary || `Discover ${item.title} couture portfolio.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 border-line bg-surface-raised"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCopyUrl(item.slug)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              <Icon name="copy" size={14} className="mr-1 inline align-middle" /> Copy Link
            </button>
            <a
              href={`/portfolio/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition inline-flex items-center gap-1 cursor-pointer border-line"
            >
              <span>View Public Page</span>
              <span><Icon name="arrowUpRight" size={14} className="mr-1 inline align-middle" /> </span>
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
              Edit Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
