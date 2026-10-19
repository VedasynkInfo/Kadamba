import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui';
import { setQueryErrorHandler } from './queryClient';

/**
 * Connects the query layer's global error channel to the toast viewport.
 *
 * This must render inside `ToastProvider` (it needs the toast context), which is
 * why the global handler is registered imperatively rather than passed in when
 * the `QueryClient` is constructed — the client is created before React exists.
 *
 * Only queries and explicitly opted-in mutations reach here; writes are normally
 * reported by the form that owns them.
 */

/**
 * One outage is one event.
 *
 * When the API is unreachable, every mounted query fails at once with the same
 * code and message. Without de-duplication the visitor gets a stack of identical
 * toasts, which reads as a broken app rather than a single incident. Identical
 * failures inside this window collapse into the first one.
 */
const DEDUPE_WINDOW_MS = 8_000;

export function QueryErrorBridge() {
  const { toast } = useToast();
  const seen = useRef(new Map<string, number>());

  useEffect(() => {
    setQueryErrorHandler(({ error }) => {
      const key = `${error.code}:${error.message}`;
      const now = Date.now();
      const last = seen.current.get(key);

      if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return;
      seen.current.set(key, now);

      // Keep the map from growing without bound across a long session.
      if (seen.current.size > 20) {
        for (const [k, at] of seen.current) {
          if (now - at >= DEDUPE_WINDOW_MS) seen.current.delete(k);
        }
      }

      toast({
        title: 'Something went wrong',
        description: error.message,
        tone: 'error',
        duration: 6000,
      });
    });

    return () => setQueryErrorHandler(null);
  }, [toast]);

  return null;
}
