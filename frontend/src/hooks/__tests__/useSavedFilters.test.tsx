import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSavedFilters } from '@/hooks/useSavedFilters';

const KEY = 'kadamba.test.filters';

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('useSavedFilters', () => {
  it('starts from the defaults when nothing is stored', () => {
    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));

    expect(result.current.filters).toEqual({ q: '', status: 'All' });
  });

  it('restores a stored filter set', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ q: 'lehenga', status: 'trial' }));

    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));

    expect(result.current.filters).toEqual({ q: 'lehenga', status: 'trial' });
  });

  it('writes each change back to storage', () => {
    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));

    act(() => result.current.setFilter('status', 'finishing'));

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}')).toEqual({
      q: '',
      status: 'finishing',
    });
  });

  it('resets to the defaults and persists the reset', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ q: 'silk', status: 'cutting' }));

    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));
    act(() => result.current.reset());

    expect(result.current.filters).toEqual({ q: '', status: 'All' });
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}')).toEqual({ q: '', status: 'All' });
  });

  it('ignores corrupt storage rather than breaking the desk', () => {
    window.localStorage.setItem(KEY, '{not json');

    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));

    expect(result.current.filters).toEqual({ q: '', status: 'All' });
  });

  it('drops values from another shape and non-string entries', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ q: 'bridal', status: 42, removedFilter: 'x' }),
    );

    const { result } = renderHook(() => useSavedFilters(KEY, { q: '', status: 'All' }));

    expect(result.current.filters).toEqual({ q: 'bridal', status: 'All' });
  });
});
