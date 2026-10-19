import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
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
 * Write side of the CMS.
 *
 * Every successful write invalidates **both** CMS domains. That looks coarse,
 * and deliberately so: the admin console and the public site are different
 * route trees, so only the queries the current tab has mounted actually
 * refetch. Invalidating the other domain just marks it stale, which is exactly
 * what we want when the user navigates back to the public pages.
 *
 * Invalidation is the cache strategy here rather than optimistic writes,
 * because the server assigns identity (an `id` and a generated `slug`) and
 * normalises fields. Guessing that response client-side would risk showing a
 * record that does not match what was stored.
 */

export interface CmsWriteResult<T> {
  upsert: (item: T) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

interface CmsResource<T> {
  upsert: (item: T) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

function useCmsWrites<T>(resource: CmsResource<T>): CmsWriteResult<T> {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.cms.all });
    void queryClient.invalidateQueries({ queryKey: qk.publicContent.all });
  };

  const upsertMutation = useMutation({
    mutationFn: (item: T) => resource.upsert(item),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => resource.remove(id),
    onSuccess: invalidate,
  });

  const { mutateAsync: upsertAsync } = upsertMutation;
  const { mutateAsync: removeAsync } = removeMutation;

  // Stable identity: callers hold these in dependency arrays.
  return useMemo(
    () => ({
      upsert: (item: T) => upsertAsync(item),
      remove: (id: string) => removeAsync(id),
    }),
    [upsertAsync, removeAsync],
  );
}

export function useGalleryWrites() {
  return useCmsWrites<GalleryItem>(galleryApi);
}

export function useServiceWrites() {
  return useCmsWrites<ServiceDetail>(servicesApi);
}

export function usePortfolioWrites() {
  return useCmsWrites<PortfolioProject>(portfolioApi);
}

export function useBlogWrites() {
  return useCmsWrites<BlogPost>(blogsApi);
}

export interface SettingsWrites {
  save: (next: WebsiteSettings) => Promise<WebsiteSettings>;
}

export function useSettingsWrites(): SettingsWrites {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (next: WebsiteSettings) => settingsApi.update(next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cms.all });
      void queryClient.invalidateQueries({ queryKey: qk.publicContent.all });
    },
  });

  const { mutateAsync: saveAsync } = saveMutation;

  // Stable identity: callers hold this in dependency arrays.
  return useMemo(() => ({ save: (next: WebsiteSettings) => saveAsync(next) }), [saveAsync]);
}
