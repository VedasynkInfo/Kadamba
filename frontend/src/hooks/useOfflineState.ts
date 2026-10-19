import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export interface OfflineState {
  /** The browser believes the network is reachable. */
  online: boolean;
  /** Writes accepted while offline, waiting for the connection to come back. */
  queued: number;
}

function subscribeOnline(onChange: () => void) {
  return onlineManager.subscribe(onChange);
}

function isOnlineSnapshot() {
  return onlineManager.isOnline();
}

function subscribeMutations(onChange: () => void) {
  return queryClient.getMutationCache().subscribe(onChange);
}

/**
 * A mutation with `networkMode: 'online'` is not failed while offline — it is
 * *paused*, and resumes by itself when the connection returns. Counting them is
 * how the UI can say "2 changes waiting" instead of leaving the user to guess
 * whether their Save did anything.
 */
function queuedMutationCount() {
  return queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.isPaused).length;
}

/**
 * Offline state for the whole app, read from the layers that actually know.
 *
 * `onlineManager` is the same source TanStack Query itself consults, and the
 * mutation cache is the queue — so this hook cannot disagree with the behaviour
 * it describes. Both are external stores, so both go through
 * `useSyncExternalStore` rather than being mirrored into React state (which is
 * how you end up with a banner that says "online" over a queue that is stuck).
 */
export function useOfflineState(): OfflineState {
  const online = useSyncExternalStore(subscribeOnline, isOnlineSnapshot, () => true);
  const queued = useSyncExternalStore(subscribeMutations, queuedMutationCount, () => 0);

  return { online, queued };
}
