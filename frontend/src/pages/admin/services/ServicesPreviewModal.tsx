import type { ServiceDetail } from '@/pages/services/data';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

interface ServicesPreviewModalProps {
  item: ServiceDetail | null;
  onClose: () => void;
  onEdit: (item: ServiceDetail) => void;
  onTogglePublished: (item: ServiceDetail) => void;
  onCopyUrl: (slug: string) => void;
}

export function ServicesPreviewModal({
  item,
  onClose,
  onEdit,
  onTogglePublished,
  onCopyUrl,
}: ServicesPreviewModalProps) {
  if (!item) return null;

  const displayImage = item.bannerImage || item.cardImage;

  return (
    <div
      className="on-dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in"
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
                item.published ? 'text-emerald-700 bg-emerald-500/10' : 'opacity-70 bg-current/[0.06]',
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
              className="on-dark rounded-xl border overflow-hidden flex items-center justify-center bg-espresso/40 relative min-h-[220px] max-h-[340px] border-line"
            >
              <OptimizedImage
                src={displayImage}
                alt={item.bannerAlt || item.title}
                sizes="(max-width: 768px) 90vw, 640px"
                className="max-h-[320px] w-full object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-inherit font-heading">{item.title}</h3>
              <p className="font-mono text-xs opacity-70 mt-0.5">/services/{item.slug}</p>
            </div>

            {item.summary ? (
              <p className="text-xs opacity-80 leading-relaxed">{item.summary}</p>
            ) : null}

            {/* Pricing & Offerings */}
            <div
              className="grid grid-cols-2 gap-3 rounded-lg p-3 border text-xs bg-surface-sunken border-line"
            >
              <div>
                <span className="font-semibold opacity-70 block text-[10px] uppercase tracking-wider">
                  Pricing Starting From
                </span>
                <span className="font-bold text-sm text-brand-strong">
                  {item.pricing?.startingFrom || (item.basePriceFrom ? `₹${item.basePriceFrom.toLocaleString('en-IN')}` : 'Consultation')}
                </span>
              </div>
              <div>
                <span className="font-semibold opacity-70 block text-[10px] uppercase tracking-wider">
                  Catalog Status
                </span>
                <span className="font-semibold text-xs">
                  {item.isFulfillable ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" size={12} />
                      Order fulfillment linked
                    </span>
                  ) : (
                    'Bespoke Atelier Service'
                  )}
                </span>
              </div>
            </div>

            {item.features?.length ? (
              <div>
                <span className="font-semibold text-xs opacity-75 block mb-1.5">Signature Features:</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md border text-[11px] opacity-80 border-line"
                    >
                      • {typeof f === 'string' ? f : f.title}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Google SERP Snippet Preview */}
            <div
              className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">
                Search Snippet Preview
              </p>
              <p className="text-xs text-blue-500 hover:underline cursor-pointer truncate font-medium">
                {item.metaTitle || `${item.title} | Kadamba Designer Studio`}
              </p>
              <p className="text-[11px] text-emerald-600 truncate mt-0.5">
                https://kadamba.studio/services/{item.slug}
              </p>
              <p className="text-xs opacity-70 line-clamp-2 mt-1">
                {item.metaDescription || item.summary || `Explore bespoke ${item.title} at Kadamba's Atelier.`}
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
              href={`/services/${item.slug}`}
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
              Edit Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
