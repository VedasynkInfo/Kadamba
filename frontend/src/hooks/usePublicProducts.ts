import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import { toAppError, type AppError } from '@/lib/apiError';
import {
  publicProductApi,
  type PublicCatalog,
  type PublicProduct,
} from '@/services/products/publicProductService';

const PRODUCT_STALE_TIME = 5 * 60_000;

export interface PublicCatalogQuery {
  catalog: PublicCatalog | undefined;
  isLoading: boolean;
  error: AppError | null;
  refresh: () => void;
}

export interface PublicProductQuery {
  product: PublicProduct | undefined;
  isLoading: boolean;
  error: AppError | null;
  refresh: () => void;
}

const catalogQuery = () => ({
  queryKey: qk.publicContent.products(),
  queryFn: () => publicProductApi.list(),
  staleTime: PRODUCT_STALE_TIME,
});

const productQuery = (slug: string) => ({
  queryKey: qk.publicContent.product(slug),
  queryFn: () => publicProductApi.get(slug),
  staleTime: PRODUCT_STALE_TIME,
});

export function usePublicCatalog(): PublicCatalogQuery {
  const query = useQuery(catalogQuery());
  return {
    catalog: query.data,
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
    refresh: () => void query.refetch(),
  };
}

export function usePublicProduct(slug: string | undefined): PublicProductQuery {
  const query = useQuery({
    ...productQuery(slug ?? ''),
    enabled: Boolean(slug),
  });
  return {
    product: query.data,
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
    refresh: () => void query.refetch(),
  };
}

async function prime(prefetch: () => Promise<unknown>): Promise<null> {
  try {
    await prefetch();
  } catch {
    // The page's query state explains the failure.
  }
  return null;
}

export const prefetchPublicProducts = () =>
  prime(() => queryClient.ensureQueryData({ ...catalogQuery(), retry: false }));

export const prefetchPublicProduct = (slug: string) =>
  prime(() => queryClient.ensureQueryData({ ...productQuery(slug), retry: false }));
