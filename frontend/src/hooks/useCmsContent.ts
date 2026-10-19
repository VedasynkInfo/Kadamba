import { useQuery } from '@tanstack/react-query';
import type { PaginatedData } from '@/types';
import { qk } from '@/lib/queryKeys';
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
 */
const CONTENT_STALE_TIME = 5 * 60_000;

export interface CollectionQuery<T> {
  items: T[];
  /** True only while there is no data yet — not during a background refetch. */
  isLoading: boolean;
  error: AppError | null;
}

interface CollectionArgs<T> {
  queryKey: readonly unknown[];
  fetcher: () => Promise<PaginatedData<T>>;
}

function useCollection<T>({ queryKey, fetcher }: CollectionArgs<T>): CollectionQuery<T> {
  const query = useQuery({
    queryKey,
    queryFn: fetcher,
    // Defensive: a malformed success envelope must degrade to "no items" rather
    // than throwing inside a render. Strict response validation lands in 5.2.
    select: (page) => (Array.isArray(page?.items) ? page.items : []),
    staleTime: CONTENT_STALE_TIME,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
  };
}

/* ------------------------------- public site ------------------------------ */

const PUBLIC_LIST_PARAMS = { published: true, limit: 100 } as const;

export function usePublicGallery() {
  return useCollection<GalleryItem>({
    queryKey: qk.publicContent.gallery({ published: true, limit: 100 }),
    fetcher: () => galleryApi.list(PUBLIC_LIST_PARAMS),
  });
}

export function usePublicServices() {
  return useCollection<ServiceDetail>({
    queryKey: qk.publicContent.services({ published: true, limit: 100 }),
    fetcher: () => servicesApi.list(PUBLIC_LIST_PARAMS),
  });
}

export function usePublicPortfolio() {
  return useCollection<PortfolioProject>({
    queryKey: qk.publicContent.portfolio({ published: true, limit: 100 }),
    fetcher: () => portfolioApi.list(PUBLIC_LIST_PARAMS),
  });
}

export function usePublicBlogs() {
  return useCollection<BlogPost>({
    queryKey: qk.publicContent.blogs({ published: true, limit: 100 }),
    fetcher: () => blogsApi.list(PUBLIC_LIST_PARAMS),
  });
}

export function usePublicSettings() {
  return useSettings(qk.publicContent.settings(), () => settingsApi.get());
}

/* -------------------------------- admin CMS ------------------------------- */

export function useAdminGallery() {
  return useCollection<GalleryItem>({
    queryKey: qk.cms.gallery(),
    fetcher: () => galleryApi.list(),
  });
}

export function useAdminServices() {
  return useCollection<ServiceDetail>({
    queryKey: qk.cms.services(),
    fetcher: () => servicesApi.list(),
  });
}

export function useAdminPortfolio() {
  return useCollection<PortfolioProject>({
    queryKey: qk.cms.portfolio(),
    fetcher: () => portfolioApi.list(),
  });
}

export function useAdminBlogs() {
  return useCollection<BlogPost>({
    queryKey: qk.cms.blogs(),
    fetcher: () => blogsApi.list(),
  });
}

export function useAdminSettings() {
  return useSettings(qk.cms.settings(), () => settingsApi.getAdmin());
}

/* --------------------------------- settings -------------------------------- */

export interface SettingsQuery {
  settings: WebsiteSettings | undefined;
  isLoading: boolean;
  error: AppError | null;
}

function useSettings(
  queryKey: readonly unknown[],
  fetcher: () => Promise<WebsiteSettings>,
): SettingsQuery {
  const query = useQuery({
    queryKey,
    queryFn: fetcher,
    staleTime: CONTENT_STALE_TIME,
  });

  return {
    settings: query.data,
    isLoading: query.isPending,
    error: query.error ? toAppError(query.error) : null,
  };
}
