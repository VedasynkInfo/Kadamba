import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isAuthError, isRetryable, toAppError, type AppError } from './apiError';

/**
 * One place that decides how the app fetches and fails.
 *
 * Two deliberate choices:
 *
 * 1. **No retry on 4xx.** A rejected request is a wrong request; retrying it
 *    only delays the error the user needs to see (and can double-apply a write).
 *    Transport failures and 5xx are retried with exponential backoff.
 * 2. **Queries surface their errors globally; mutations do not.** A failed read
 *    has no natural owner, so it is reported once from here. A failed write
 *    belongs to the form that triggered it, which already renders field errors —
 *    so mutations opt in via `meta.surfaceErrors` instead of every call site
 *    racing to show the same toast.
 */

export interface GlobalQueryErrorContext {
  error: AppError;
  queryKey: readonly unknown[];
}

type QueryErrorHandler = (context: GlobalQueryErrorContext) => void;

let queryErrorHandler: QueryErrorHandler | null = null;

/**
 * The UI layer registers the real handler once it mounts (it needs the toast
 * context, which lives inside the React tree). Until then failures are silent,
 * which is correct for the bootstrap window.
 */
export function setQueryErrorHandler(handler: QueryErrorHandler | null) {
  queryErrorHandler = handler;
}

export function reportQueryError(context: GlobalQueryErrorContext) {
  queryErrorHandler?.(context);
}

export const DEFAULT_STALE_TIME = 30_000;
export const DEFAULT_GC_TIME = 10 * 60_000;

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Session loss is handled by the API client (it redirects to sign-in).
        // Toasting it too would just double-report the same event.
        const appError = toAppError(error);
        if (isAuthError(appError)) return;
        reportQueryError({ error: appError, queryKey: query.queryKey });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const appError = toAppError(error);
        if (isAuthError(appError)) return;
        if (mutation.meta?.surfaceErrors !== true) return;
        reportQueryError({ error: appError, queryKey: ['mutation', mutation.mutationId] });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(toAppError(error)),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        // The public site is read-mostly and re-fetching on every tab focus
        // would undo the caching wins; explicit invalidation drives freshness.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        networkMode: 'online',
      },
      mutations: {
        retry: 0,
        networkMode: 'online',
      },
    },
  });
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** When true, a failed mutation is also reported through the global handler. */
      surfaceErrors?: boolean;
    };
  }
}

/** The app-wide cache. Created once so every provider shares a single client. */
export const queryClient = createQueryClient();
