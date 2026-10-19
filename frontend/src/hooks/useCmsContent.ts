import { useQuery } from '@tanstack/react-query';
import type { PaginatedData } from '@/types';
import { qk } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import { toAppError, type AppError } from '@/lib/apiError';
import { galleryApi } from '@/services/gallery/galleryService';
import { servicesApi } from '@/services/services/servicesService';
import { portfolioApi } from '@/services/portfolio/portfolioService';
import { blogsApi } from '@/services/blogs/blogsService';
import { settingsApi } from '@/services/settings/settingsService';
import type { GalleryItem } from '@/pages/gallery/data';
import type { ServiceDetail } from '@/pages/services/data';
import type { PortfolioProject } from '@/pages/portfolio/data';
import type { BlogPost } from '@/pages/blogs/data';
import type { WebsiteSettings } from '@/pages/admin/data';

/**
 * Server state for the CMS collections, shared by the public site and the admin
 * console.
 *
 * Both audiences read the same four collections, but with different visibility
 * (`published` only vs. everything) so they get separate cache entries. The two
 * keys sit under `qk.publicContent` and `qk.cms`, and every CMS write
 * invalidates both — which is what makes "edit in admin, see it on the site"
 * correct without either side knowing about the other.
 *
 * `staleTime` is minutes, not seconds: this is editorial content that changes
 * when a person clicks Save, and writes invalidate explicitly. Polling it (or
 * refetching on every tab focus) would spend the studio's bandwidth to discover
 * nothing.
 *
 * The descriptors below are what makes the route loaders possible: a loader and
 * the component that consumes it both go through the same object, so a prefetch
 * can never warm a different cache entry than the one `useQuery` reads.
 */
const CONTENT_STALE_TIME = 5 * 60_000;

export interface CollectionQuery<T> {
  items: T[];
  /** True only while there is no data yet — not during a background refetch. */
  isLoading: boolean;
  error: AppError | null;
}

interface CollectionQueryOptions<T> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<PaginatedData<T>>;
  staleTime: number;
}

function useCollection<T>({
  queryKey,
  queryFn,
  staleTime,
}: CollectionQueryOptions<T>): CollectionQuery<T> {
  const query = useQuery({
    queryKey,
    queryFn,
    // The service has already validated the envelope against the shared
    // contract (`lib/parse.ts`), so this is a real `{ items, pagination }`.
    select: (page: PaginatedData<T>) => page.items,
    staleTime,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
  };
}

/* ------------------------------- descriptors ------------------------------- */

const PUBLIC_LIST_PARAMS = { published: true, limit: 100 } as const;

function publicCollection<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<PaginatedData<T>>,
): CollectionQueryOptions<T> {
  return { queryKey, queryFn, staleTime: CONTENT_STALE_TIME };
}

const publicGalleryQuery = () =>
  publicCollection<GalleryItem>(qk.publicContent.gallery({ published: true, limit: 100 }), () =>
    galleryApi.list(PUBLIC_LIST_PARAMS),
  );

const publicServicesQuery = () =>
  publicCollection<ServiceDetail>(qk.publicContent.services({ published: true, limit: 100 }), () =>
    servicesApi.list(PUBLIC_LIST_PARAMS),
  );

const publicPortfolioQuery = () =>
  publicCollection<PortfolioProject>(
    qk.publicContent.portfolio({ published: true, limit: 100 }),
    () => portfolioApi.list(PUBLIC_LIST_PARAMS),
  );

const publicBlogsQuery = () =>
  publicCollection<BlogPost>(qk.publicContent.blogs({ published: true, limit: 100 }), () =>
    blogsApi.list(PUBLIC_LIST_PARAMS),
  );

const publicSettingsQuery = (): SettingsQueryOptions => ({
  queryKey: qk.publicContent.settings(),
  queryFn: () => settingsApi.get(),
  staleTime: CONTENT_STALE_TIME,
});

/* ------------------------------- public site ------------------------------- */

export function usePublicGallery() {
  return useCollection(publicGalleryQuery());
}

export function usePublicServices() {
  return useCollection(publicServicesQuery());
}

export function usePublicPortfolio() {
  return useCollection(publicPortfolioQuery());
}

export function usePublicBlogs() {
  return useCollection(publicBlogsQuery());
}

export function usePublicSettings() {
  return useSettings(publicSettingsQuery());
}

/* -------------------------------- admin CMS -------------------------------- */

export function useAdminGallery() {
  return useCollection<GalleryItem>({
    queryKey: qk.cms.gallery(),
    queryFn: () => galleryApi.list(),
    staleTime: CONTENT_STALE_TIME,
  });
}

export function useAdminServices() {
  return useCollection<ServiceDetail>({
    queryKey: qk.cms.services(),
    queryFn: () => servicesApi.list(),
    staleTime: CONTENT_STALE_TIME,
  });
}

export function useAdminPortfolio() {
  return useCollection<PortfolioProject>({
    queryKey: qk.cms.portfolio(),
    queryFn: () => portfolioApi.list(),
    staleTime: CONTENT_STALE_TIME,
  });
}

export function useAdminBlogs() {
  return useCollection<BlogPost>({
    queryKey: qk.cms.blogs(),
    queryFn: () => blogsApi.list(),
    staleTime: CONTENT_STALE_TIME,
  });
}

export function useAdminSettings() {
  return useSettings({
    queryKey: qk.cms.settings(),
    queryFn: () => settingsApi.getAdmin(),
    staleTime: CONTENT_STALE_TIME,
  });
}

/* --------------------------------- settings -------------------------------- */

export interface SettingsQuery {
  settings: WebsiteSettings | undefined;
  isLoading: boolean;
  error: AppError | null;
}

interface SettingsQueryOptions {
  queryKey: readonly unknown[];
  queryFn: () => Promise<WebsiteSettings>;
  staleTime: number;
}

function useSettings({ queryKey, queryFn, staleTime }: SettingsQueryOptions): SettingsQuery {
  const query = useQuery({ queryKey, queryFn, staleTime });

  return {
    settings: query.data,
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
  };
}

/* ------------------------------ route prefetch ------------------------------ */

/**
 * Warm the cache a route is about to read.
 *
 * React Router runs a route's loader in parallel with that route's lazy chunk,
 * so the request overlaps the download instead of starting after mount. For a
 * visitor that is the difference between "spinner, then content" and content
 * that is already there.
 *
 * Failure is swallowed on purpose, and `retry` is off for the prefetch only. A
 * loader blocks navigation, so letting the query layer's retry policy run here
 * would hold the visitor on the *previous* page for seconds while a slow API
 * times out. Instead the loader gives up immediately, the page renders its own
 * loading state, and the component's `useQuery` — which retries normally — takes
 * over from the cache entry this left behind.
 *
 * A failed prefetch must never be able to break a page that would otherwise
 * work, which is also why the error is not rethrown: the query's own error state
 * renders `ContentError` *inside* the page, a far better place for a failed
 * collection than a route-level error screen that discards the navbar.
 *
 * Only public routes prefetch. The admin access token lives in memory, so a
 * loader — which runs before `AuthProvider` has exchanged the refresh cookie —
 * would fire an anonymous request that 401s.
 */
async function prime(prefetch: () => Promise<unknown>): Promise<null> {
  try {
    await prefetch();
  } catch {
    // Surfaced by the consuming component's query state.
  }
  return null;
}

export const prefetchPublicGallery = () =>
  prime(() => queryClient.ensureQueryData({ ...publicGalleryQuery(), retry: false }));

export const prefetchPublicServices = () =>
  prime(() => queryClient.ensureQueryData({ ...publicServicesQuery(), retry: false }));

export const prefetchPublicPortfolio = () =>
  prime(() => queryClient.ensureQueryData({ ...publicPortfolioQuery(), retry: false }));

export const prefetchPublicBlogs = () =>
  prime(() => queryClient.ensureQueryData({ ...publicBlogsQuery(), retry: false }));

export const prefetchPublicSettings = () =>
  prime(() => queryClient.ensureQueryData({ ...publicSettingsQuery(), retry: false }));
