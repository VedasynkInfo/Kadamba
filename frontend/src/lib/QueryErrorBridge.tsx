import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui';
import { queryClient, setQueryErrorHandler } from './queryClient';

/**
 * Connects the query layer's global error channel to the toast viewport.
 *
 * This must render inside `ToastProvider` (it needs the toast context), which is
 * why the global handler is registered imperatively rather than passed in when
 * the `QueryClient` is constructed — the client is created before React exists.
 *
 * Queries and mutations both reach here: a failed read has no natural owner, and
 * a failed write belongs to the app even when the form that triggered it also
 * says something.
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

      // A conflict is not a failure, it is a race: someone else changed the
      // record while this desk was working on it. It gets its own message and
      // its own way out, because "something went wrong" would send the user
      // looking for a fault that is not theirs.
      if (error.code === 'CONFLICT' || error.code === 'INVALID_TRANSITION') {
        toast({
          title: 'Someone else changed this',
          description:
            'This record was updated while you were working on it. Refresh to see the current version.',
          tone: 'error',
          duration: 10_000,
          action: {
            label: 'Refresh',
            onClick: () => {
              void queryClient.invalidateQueries();
            },
          },
        });
        return;
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
