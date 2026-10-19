import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MutationObserver, onlineManager } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { queryClient } from '@/lib/queryClient';

/**
 * `cleanup` is explicit because this suite runs without testing globals, so
 * Testing Library cannot register its own auto-cleanup — without this, each
 * `render` adds another banner to the same document.
 */
afterEach(async () => {
  cleanup();
  onlineManager.setOnline(true);
  await queryClient.resumePausedMutations();
  queryClient.clear();
});

describe('OfflineBanner', () => {
  beforeEach(() => {
    queryClient.clear();
    onlineManager.setOnline(true);
  });

  it('stays out of the way while the connection is fine', () => {
    render(<OfflineBanner />);

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says the content on screen is the last that loaded', () => {
    onlineManager.setOnline(false);

    render(<OfflineBanner />);

    expect(screen.getByRole('status').textContent).toContain("You're offline");
    expect(screen.getByRole('status').textContent).toContain('last content that loaded');
  });

  it('queues a write made offline and counts it, instead of failing it', async () => {
    onlineManager.setOnline(false);

    // A mutation created while offline is paused by `networkMode: 'online'` —
    // not rejected — and resumes by itself once the connection returns.
    const observer = new MutationObserver(queryClient, {
      mutationFn: async () => 'saved',
    });
    observer.mutate();

    render(<OfflineBanner />);

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('1 change will be sent'),
    );
  });
});
