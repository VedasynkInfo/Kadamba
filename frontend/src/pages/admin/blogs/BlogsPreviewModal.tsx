import type { BlogPost } from '@/pages/blogs/data';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

interface BlogsPreviewModalProps {
  item: BlogPost | null;
  onClose: () => void;
  onEdit: (item: BlogPost) => void;
  onTogglePublished: (item: BlogPost) => void;
  onCopyUrl: (slug: string) => void;
}

export function BlogsPreviewModal({
  item,
  onClose,
  onEdit,
  onTogglePublished,
  onCopyUrl,
}: BlogsPreviewModalProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(181, 148, 16, 0.15)',
                color: 'var(--admin-primary, #b59410)',
              }}
            >
              {item.category}
            </span>
            {item.featured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                ⭐ Featured
              </span>
            ) : null}
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
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {item.coverImage ? (
            <div
              className="rounded-xl border overflow-hidden flex items-center justify-center bg-black/40 relative min-h-[200px] max-h-[300px]"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            >
              <OptimizedImage
                src={item.coverImage}
                alt={item.coverAlt || item.title}
                sizes="(max-width: 768px) 90vw, 640px"
                className="max-h-[280px] w-full object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs opacity-60 mb-1">
                <span>{item.date || 'Recent'}</span>
                <span>•</span>
                <span>{item.readMinutes || 4} min read</span>
                <span>•</span>
                <span>By {item.author || "Kadamba's Designer Studio"}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-inherit font-heading">{item.title}</h3>
              <p className="font-mono text-xs opacity-60 mt-0.5">/blogs/{item.slug}</p>
            </div>

            {item.excerpt ? (
              <p className="text-xs font-medium opacity-90 leading-relaxed border-l-2 pl-3" style={{ borderColor: 'var(--admin-primary,#b59410)' }}>
                {item.excerpt}
              </p>
            ) : null}

            {item.content?.length ? (
              <div
                className="rounded-lg p-3.5 border text-xs space-y-2.5 opacity-80 leading-relaxed max-h-[200px] overflow-y-auto"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))',
                }}
              >
                {item.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            ) : null}

            {item.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full border text-[11px] opacity-75"
                    style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Google SERP Snippet Preview */}
            <div
              className="rounded-xl border p-4 shadow-xs"
              style={{
                backgroundColor: 'var(--admin-card, #111827)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">
                Search Snippet Preview
              </p>
              <p className="text-xs text-blue-500 hover:underline cursor-pointer truncate font-medium">
                {item.metaTitle || `${item.title} | Kadamba Designer Studio`}
              </p>
              <p className="text-[11px] text-emerald-600 truncate mt-0.5">
                https://kadamba.studio/blogs/{item.slug}
              </p>
              <p className="text-xs opacity-70 line-clamp-2 mt-1">
                {item.metaDescription || item.excerpt || `Read ${item.title} on Kadamba's bridal fashion journal.`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
          style={{
            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
            backgroundColor: 'var(--admin-card, #141b26)',
          }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCopyUrl(item.slug)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            >
              📋 Copy Link
            </button>
            <a
              href={`/blogs/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition inline-flex items-center gap-1 cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            >
              <span>View Public Article</span>
              <span>↗</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePublished(item)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            >
              {item.published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="rounded-lg px-4 py-1.5 text-xs font-bold shadow-xs transition hover:opacity-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-primary, #b59410)',
                color: 'var(--admin-primary-text, #ffffff)',
              }}
            >
              Edit Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
