import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GalleryItem } from '@/pages/gallery/data';
import type { ServiceDetail } from '@/pages/services/data';
import type { PortfolioProject } from '@/pages/portfolio/data';
import type { BlogPost } from '@/pages/blogs/data';
import type { WebsiteSettings } from './data';
import { qk } from '@/lib/queryKeys';
import type { AppError } from '@/lib/apiError';
import {
  useAdminBlogs,
  useAdminGallery,
  useAdminPortfolio,
  useAdminServices,
  useAdminSettings,
} from '@/hooks/useCmsContent';
import {
  useBlogWrites,
  useGalleryWrites,
  usePortfolioWrites,
  useServiceWrites,
  useSettingsWrites,
} from '@/hooks/useCmsMutations';
import { mergeWebsiteSettings } from '@/utils/websiteSettings';

export interface AdminContentStore {
  /** True only on first load; background refreshes do not set this. */
  loading: boolean;
  /** The first collection failure, so a desk can explain why it is empty. */
  error: AppError | null;
  gallery: GalleryItem[];
  upsertGallery: (item: GalleryItem) => Promise<void>;
  removeGallery: (id: string) => Promise<void>;
  services: ServiceDetail[];
  upsertService: (item: ServiceDetail) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  portfolio: PortfolioProject[];
  upsertProject: (item: PortfolioProject) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  blogs: BlogPost[];
  upsertBlog: (item: BlogPost) => Promise<void>;
  removeBlog: (id: string) => Promise<void>;
  settings: WebsiteSettings;
  saveSettings: (next: WebsiteSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  refresh: () => void;
}

const AdminContentContext = createContext<AdminContentStore | null>(null);

/**
 * CMS collections for the admin console.
 *
 * Previously this substituted bundled demo arrays whenever the API was empty or
 * failed (in development only), which meant an editor could never tell the
 * difference between "nothing published" and "the request did not work". Reads
 * now always reflect the server, failures surface as `error`, and writes
 * invalidate the cache instead of patching local state by hand.
 */
export function AdminContentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const galleryQuery = useAdminGallery();
  const servicesQuery = useAdminServices();
  const portfolioQuery = useAdminPortfolio();
  const blogsQuery = useAdminBlogs();
  const siteQuery = useAdminSettings();

  const galleryWrites = useGalleryWrites();
  const serviceWrites = useServiceWrites();
  const portfolioWrites = usePortfolioWrites();
  const blogWrites = useBlogWrites();
  const settingsWrites = useSettingsWrites();

  const loading =
    galleryQuery.isLoading ||
    servicesQuery.isLoading ||
    portfolioQuery.isLoading ||
    blogsQuery.isLoading ||
    siteQuery.isLoading;

  const error =
    galleryQuery.error ?? servicesQuery.error ?? portfolioQuery.error ?? blogsQuery.error ?? null;

  const settings = useMemo(() => mergeWebsiteSettings(siteQuery.settings), [siteQuery.settings]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk.cms.all });
  }, [queryClient]);

  // The store keeps its promise-returning shape so desk components did not have
  // to change; rejections propagate to their existing try/catch + toast.
  const upsertGallery = useCallback(
    async (item: GalleryItem) => {
      await galleryWrites.upsert(item);
    },
    [galleryWrites],
  );
  const removeGallery = useCallback(
    async (id: string) => {
      await galleryWrites.remove(id);
    },
    [galleryWrites],
  );
  const upsertService = useCallback(
    async (item: ServiceDetail) => {
      await serviceWrites.upsert(item);
    },
    [serviceWrites],
  );
  const removeService = useCallback(
    async (id: string) => {
      await serviceWrites.remove(id);
    },
    [serviceWrites],
  );
  const upsertProject = useCallback(
    async (item: PortfolioProject) => {
      await portfolioWrites.upsert(item);
    },
    [portfolioWrites],
  );
  const removeProject = useCallback(
    async (id: string) => {
      await portfolioWrites.remove(id);
    },
    [portfolioWrites],
  );
  const upsertBlog = useCallback(
    async (item: BlogPost) => {
      await blogWrites.upsert(item);
    },
    [blogWrites],
  );
  const removeBlog = useCallback(
    async (id: string) => {
      await blogWrites.remove(id);
    },
    [blogWrites],
  );
  const saveSettings = useCallback(
    async (next: WebsiteSettings) => {
      await settingsWrites.save(next);
    },
    [settingsWrites],
  );
  const resetSettings = useCallback(async () => {
    await settingsWrites.save(mergeWebsiteSettings());
  }, [settingsWrites]);

  const value = useMemo<AdminContentStore>(
    () => ({
      loading,
      error,
      gallery: galleryQuery.items,
      upsertGallery,
      removeGallery,
      services: servicesQuery.items,
      upsertService,
      removeService,
      portfolio: portfolioQuery.items,
      upsertProject,
      removeProject,
      blogs: blogsQuery.items,
      upsertBlog,
      removeBlog,
      settings,
      saveSettings,
      resetSettings,
      refresh,
    }),
    [
      loading,
      error,
      galleryQuery.items,
      upsertGallery,
      removeGallery,
      servicesQuery.items,
      upsertService,
      removeService,
      portfolioQuery.items,
      upsertProject,
      removeProject,
      blogsQuery.items,
      upsertBlog,
      removeBlog,
      settings,
      saveSettings,
      resetSettings,
      refresh,
    ],
  );

  return <AdminContentContext.Provider value={value}>{children}</AdminContentContext.Provider>;
}

export function useAdminContent(): AdminContentStore {
  const ctx = useContext(AdminContentContext);
  if (!ctx) {
    throw new Error('useAdminContent must be used within AdminContentProvider');
  }
  return ctx;
}
