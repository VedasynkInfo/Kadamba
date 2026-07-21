import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { cn } from '@/utils/cn';

export interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  image: string;
  alt: string;
}

/**
 * Dark-stage lightbox for collection imagery. Escape to close, focus trap,
 * and focus restore to match the shared Modal / GalleryLightbox behavior.
 */
export function ImageLightbox({ open, onClose, title, image, alt }: ImageLightboxProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className="relative z-10 w-full max-w-4xl animate-fade-in-up outline-none"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-heading text-xl text-cream sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm text-cream/80 transition-colors',
              'hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            )}
            aria-label="Close lightbox"
          >
            Close
          </button>
        </div>
        <OptimizedImage
          src={image}
          alt={alt}
          className="max-h-[80vh] w-full object-contain"
          width={1600}
          height={1200}
        />
      </div>
    </div>
  );
}
