import * as Dialog from '@radix-ui/react-dialog';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { PortalShell } from './PortalShell';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Larger dialog for richer content. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-[28rem]',
  md: 'max-w-[32rem]',
  lg: 'max-w-2xl',
};

/**
 * Modal dialog.
 *
 * Radix owns the parts that are easy to get subtly wrong — the focus trap,
 * Escape, the page scroll lock, `aria-hidden` on the rest of the page and the
 * role/labelling wiring — so none of that is hand-rolled here.
 *
 * The one thing Radix cannot do for this API is focus restore: it returns focus
 * to a `Dialog.Trigger`, and this controlled `open` prop has none. We therefore
 * remember the previously focused element and restore it on close ourselves.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <PortalShell>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          {/* The panel is centred by a flex parent rather than by translate, so
              that the entrance animation's transform cannot fight the centring. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Content
              aria-modal="true"
              // Radix fires this just before it moves focus into the dialog, so
              // the active element here is still the opener we must return to.
              onOpenAutoFocus={() => {
                previouslyFocused.current = document.activeElement as HTMLElement | null;
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                previouslyFocused.current?.focus();
              }}
              className={cn(
                'pointer-events-auto relative w-full rounded-xl border border-line bg-surface-raised p-6 text-ink-raised shadow-soft',
                'animate-fade-in-up outline-none',
                sizeClasses[size],
                className,
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <Dialog.Title className="font-heading text-xl font-bold text-inherit">
                  {title}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Close dialog"
                    className="px-2 text-inherit opacity-70 hover:bg-current/[0.06] hover:opacity-100"
                  >
                    ✕
                  </Button>
                </Dialog.Close>
              </div>
              <div className="text-sm text-inherit">{children}</div>
              {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
            </Dialog.Content>
          </div>
        </PortalShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
