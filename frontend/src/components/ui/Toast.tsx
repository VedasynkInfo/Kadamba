import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/utils/cn';

export type ToastTone = 'default' | 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  default: 'border-gold/40 bg-black text-cream',
  success: 'border-emerald-500/50 bg-black text-cream',
  error: 'border-red-500/50 bg-black text-cream',
  info: 'border-gold bg-black text-cream',
};

/**
 * Toast provider + viewport. Wrap the app once.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = crypto.randomUUID();
      const duration = item.duration ?? 4000;
      setItems((prev) => [...prev, { ...item, id }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-[24rem] flex-col gap-2 p-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto animate-toast-in rounded-md border px-4 py-3 shadow-[var(--shadow-soft)]',
              toneClasses[item.tone ?? 'default'],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-sm text-gold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs text-cream/70">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-cream/60 hover:text-gold"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
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
