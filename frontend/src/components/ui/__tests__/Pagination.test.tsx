import { describe, expect, it } from 'vitest';
import { pageWindow } from '@/utils/pagination';

describe('pageWindow', () => {
  it('lists every page when the list is short', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps the ends and the current neighbourhood for a long list', () => {
    expect(pageWindow(6, 20)).toEqual([1, 'gap', 5, 6, 7, 'gap', 20]);
  });

  it('does not put a gap where the ends meet the neighbourhood', () => {
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 'gap', 20]);
    expect(pageWindow(19, 20)).toEqual([1, 'gap', 18, 19, 20]);
  });

  it('collapses to the real pages when totalPages is tiny', () => {
    expect(pageWindow(1, 0)).toEqual([]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});
