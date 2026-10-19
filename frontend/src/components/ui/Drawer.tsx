import * as Dialog from '@radix-ui/react-dialog';
import { useRef, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { PortalShell } from './PortalShell';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

/**
 * Side drawer for mobile nav and secondary content.
 *
 * A sliding panel is still a modal dialog, so this is built on the same Radix
 * Dialog primitive as `Modal` — the focus trap, Escape, scroll lock and
 * `aria-hidden` of the background all come from there instead of being
 * hand-rolled. As with `Modal`, focus restore is ours because the controlled
 * `open` prop has no `Dialog.Trigger` to return to.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  className,
}: DrawerProps) {
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
          <Dialog.Content
            aria-modal="true"
            // Radix fires this just before it moves focus into the drawer, so
            // the active element here is still the opener we must return to.
            onOpenAutoFocus={() => {
              previouslyFocused.current = document.activeElement as HTMLElement | null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              previouslyFocused.current?.focus();
            }}
            className={cn(
              'fixed top-0 z-50 flex h-full w-full max-w-[24rem] flex-col border-l border-line bg-surface-raised text-ink-raised shadow-soft outline-none',
              'transition-transform duration-300 ease-luxury animate-fade-in-up',
              side === 'right' ? 'right-0' : 'left-0',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Dialog.Title className="font-heading text-xl text-brand">{title}</Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Close drawer"
                  className="text-inherit opacity-70 hover:bg-current/[0.08] hover:opacity-100"
                >
                  <Icon name="close" size={16} />
                </Button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </Dialog.Content>
        </PortalShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
