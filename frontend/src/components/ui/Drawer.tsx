import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

/**
 * Side drawer panel for mobile nav and secondary content.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  className,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      document.body.style.overflow = '';
      return;
    }

    // Focus the panel only when the drawer first opens — not on every parent re-render
    // (inline onClose identities used to re-run this effect and steal input focus).
    if (!wasOpenRef.current) {
      panelRef.current?.focus();
      wasOpenRef.current = true;
    }

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onCloseRef.current();
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close drawer"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={cn(
          'absolute top-0 flex h-full w-full max-w-[24rem] flex-col bg-black text-cream shadow-[var(--shadow-soft)] outline-none',
          'transition-transform duration-300 ease-[var(--ease-luxury)]',
          side === 'right' ? 'right-0 animate-fade-in-up' : 'left-0 animate-fade-in-up',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
          <h2 id={titleId} className="font-heading text-xl text-gold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCloseRef.current()}
            aria-label="Close drawer"
            className="!text-cream hover:!bg-white/10"
          >
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
