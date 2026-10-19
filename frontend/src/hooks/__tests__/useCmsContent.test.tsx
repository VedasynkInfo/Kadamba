import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePublicGallery, prefetchPublicGallery } from '@/hooks/useCmsContent';
import { queryClient } from '@/lib/queryClient';
import { galleryApi } from '@/services/gallery/galleryService';
import type { PaginatedData } from '@/types';
import type { GalleryItem } from '@/pages/gallery/data';

vi.mock('@/services/gallery/galleryService', () => ({
  galleryApi: { list: vi.fn(), upsert: vi.fn(), remove: vi.fn() },
}));

const listMock = galleryApi.list as unknown as ReturnType<typeof vi.fn>;

const page = (items: GalleryItem[]): PaginatedData<GalleryItem> => ({
  items,
  pagination: { page: 1, limit: 100, total: items.length, pages: 1 },
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePublicGallery', () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it('starts loading and then exposes the server items', async () => {
    listMock.mockResolvedValue(page([{ id: 'g1', title: 'Zari' } as GalleryItem]));

    const { result } = renderHook(() => usePublicGallery(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('reports an empty collection as empty, not as content', async () => {
    listMock.mockResolvedValue(page([]));

    const { result } = renderHook(() => usePublicGallery(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a failed request as an AppError instead of silently rendering nothing', async () => {
    listMock.mockRejectedValue(
      Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        config: {},
        response: {
          status: 500,
          data: { success: false, code: 'INTERNAL', message: 'Uploads bucket unavailable' },
          statusText: '',
          headers: {},
          config: {},
        },
      }),
    );

    const { result } = renderHook(() => usePublicGallery(), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.code).toBe('INTERNAL');
    expect(result.current.error?.message).toBe('Uploads bucket unavailable');
    expect(result.current.items).toEqual([]);
  });

  it('degrades a malformed success envelope to an empty list rather than crashing the render', async () => {
    listMock.mockResolvedValue({ items: undefined } as unknown as PaginatedData<GalleryItem>);

    const { result } = renderHook(() => usePublicGallery(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});

/**
 * The route loaders prefetch through the application's single query client, so
 * these tests use that client rather than the isolated one above.
 */
function singletonWrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('route prefetch', () => {
  beforeEach(() => {
    listMock.mockReset();
    queryClient.clear();
  });

  it('leaves the gallery hook nothing to fetch, so loader and page share one entry', async () => {
    listMock.mockResolvedValue(page([{ id: 'g1', title: 'Zari' } as GalleryItem]));

    await prefetchPublicGallery();

    const { result } = renderHook(() => usePublicGallery(), { wrapper: singletonWrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // One request: the hook read what the loader warmed instead of starting its
    // own. This is what fails if the loader and the hook ever drift onto
    // different query keys or list params.
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('resolves when the API is down, so a failed prefetch cannot strand a route', async () => {
    listMock.mockRejectedValue(new Error('offline'));

    await expect(prefetchPublicGallery()).resolves.toBeNull();
  });
});
