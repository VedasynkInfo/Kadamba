import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { cn } from '@/utils/cn';

export type ToastTone = 'default' | 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  /** A button in the toast — "Refresh", "Undo", "Open". */
  action?: ToastAction;
}

export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

export interface ToastContextValue {
  /** Show a toast. Returns its id, so it can be dismissed early. */
  toast: (item: ToastItem) => string | number;
  dismiss: (id: string | number) => void;
  /**
   * The three states of a long write, in one call.
   *
   * A save that takes a moment should say "saving" while it happens, say
   * "saved" when it does, and say what went wrong if it does not — three
   * separate toasts, written once.
   */
  promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toasts, on Sonner.
 *
 * The *renderer* changed; the API did not. Every call site in the app already
 * says `toast({ title, description, tone })`, and a change of toast library
 * is not a reason to edit eighty files. What Sonner buys over the hand-rolled
 * list: stacking, swipe-to-dismiss, a promise API, action buttons, and a
 * focus-managed close control.
 *
 * The colours are the same ones the old viewport used (`bg-black` with a gold
 * title), which is deliberate: a toast sits on top of whatever shell is
 * behind it, and `ink-inverse` on black reads in all three.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ToastContextValue>(
    () => ({
      toast: (item) => {
        const options = {
          description: item.description,
          duration: item.duration ?? 4000,
          action: item.action
            ? { label: item.action.label, onClick: item.action.onClick }
            : undefined,
        };
        switch (item.tone) {
          case 'success':
            return sonnerToast.success(item.title, options);
          case 'error':
            return sonnerToast.error(item.title, options);
          case 'info':
            return sonnerToast.info(item.title, options);
          default:
            return sonnerToast(item.title, options);
        }
      },
      dismiss: (id) => sonnerToast.dismiss(id),
      promise: (promise, messages) => {
        sonnerToast.promise(promise, {
          loading: messages.loading,
          success: (value) =>
            typeof messages.success === 'function' ? messages.success(value) : messages.success,
          error: (error) =>
            typeof messages.error === 'function' ? messages.error(error) : messages.error,
        });
        // The toast shows the three states; the caller still gets the promise,
        // so `await toast.promise(save(), …)` reads the way it should.
        return promise;
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SonnerToaster
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: cn(
              'font-admin rounded-lg border border-gold/30 bg-black text-ink-inverse shadow-soft',
            ),
            title: 'font-heading text-sm text-gold',
            description: 'text-xs text-ink-inverse/70',
            actionButton: 'bg-brand text-ink-on-brand rounded-md text-xs font-semibold',
            closeButton: 'border-ink-inverse/20 bg-transparent text-ink-inverse/70',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

/** Hook to push toast notifications. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
