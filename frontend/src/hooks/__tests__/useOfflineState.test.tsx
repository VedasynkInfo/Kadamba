import { act, renderHook } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { useOfflineState } from '@/hooks/useOfflineState';

/**
 * The banner reads from `onlineManager` and the mutation cache, so this test is
 * about that wiring: the state the UI shows must be the state TanStack Query
 * acts on, not a parallel copy of it.
 */
describe('useOfflineState', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('reports online with nothing queued to begin with', () => {
    const { result } = renderHook(() => useOfflineState());

    expect(result.current.online).toBe(true);
    expect(result.current.queued).toBe(0);
  });

  it('follows the connection dropping and returning', () => {
    const { result } = renderHook(() => useOfflineState());

    act(() => onlineManager.setOnline(false));
    expect(result.current.online).toBe(false);

    act(() => onlineManager.setOnline(true));
    expect(result.current.online).toBe(true);
  });
});
