import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GalleryItem } from '@/pages/gallery/data';
import type { ServiceDetail } from '@/pages/services/data';
import type { PortfolioProject } from '@/pages/portfolio/data';
import type { BlogPost } from '@/pages/blogs/data';
import type { WebsiteSettings } from '@/pages/admin/data';
import { qk } from '@/lib/queryKeys';
import type { AppError } from '@/lib/apiError';
import {
  usePublicBlogs,
  usePublicGallery,
  usePublicPortfolio,
  usePublicServices,
  usePublicSettings,
} from '@/hooks/useCmsContent';
import { mergeWebsiteSettings } from '@/utils/websiteSettings';
import { whatsappDeepLink } from '@/utils/whatsapp';

export interface PublicContentStore {
  /** True only on first load; background refreshes do not set this. */
  loading: boolean;
  /** The first collection failure, so a page can explain why it is empty. */
  error: AppError | null;
  gallery: GalleryItem[];
  services: ServiceDetail[];
  portfolio: PortfolioProject[];
  blogs: BlogPost[];
  /** Every collection loaded successfully and none has any content. */
  isEmpty: boolean;
  /** Settings win for contact/address/logo/social — brand prose stays in home/data.ts */
  settings: WebsiteSettings;
  whatsappHref: (prefill?: string) => string;
  refresh: () => void;
}

const PublicContentContext = createContext<PublicContentStore | null>(null);

/**
 * Published CMS content for the public site.
 *
 * This used to fall back to bundled demo content whenever the API returned
 * nothing *or* failed — so the site could not tell a visitor that content was
 * missing, and an editor could never see that their change had not saved. Now a
 * failure surfaces as `error` and an empty collection stays empty, so pages can
 * render honest loading / empty / error states.
 */
export function PublicContentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const gallery = usePublicGallery();
  const services = usePublicServices();
  const portfolio = usePublicPortfolio();
  const blogs = usePublicBlogs();
  const site = usePublicSettings();

  const loading =
    gallery.isLoading ||
    services.isLoading ||
    portfolio.isLoading ||
    blogs.isLoading ||
    site.isLoading;

  // One broken collection should not blank the whole site, so the first failure
  // is reported while whatever did load still renders.
  const error = gallery.error ?? services.error ?? portfolio.error ?? blogs.error ?? null;

  const isEmpty =
    !loading &&
    !error &&
    gallery.items.length === 0 &&
    services.items.length === 0 &&
    portfolio.items.length === 0 &&
    blogs.items.length === 0;

  const settings = useMemo(() => mergeWebsiteSettings(site.settings), [site.settings]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk.publicContent.all });
  }, [queryClient]);

  const whatsappHref = useCallback(
    (prefill?: string) =>
      whatsappDeepLink(
        settings.whatsappNumber || settings.phoneTel,
        prefill ?? settings.whatsappPrefill,
      ),
    [settings.whatsappNumber, settings.phoneTel, settings.whatsappPrefill],
  );

  const value = useMemo<PublicContentStore>(
    () => ({
      loading,
      error,
      gallery: gallery.items,
      services: services.items,
      portfolio: portfolio.items,
      blogs: blogs.items,
      isEmpty,
      settings,
      whatsappHref,
      refresh,
    }),
    [
      loading,
      error,
      gallery.items,
      services.items,
      portfolio.items,
      blogs.items,
      isEmpty,
      settings,
      whatsappHref,
      refresh,
    ],
  );

  return <PublicContentContext.Provider value={value}>{children}</PublicContentContext.Provider>;
}

export function usePublicContent(): PublicContentStore {
  const ctx = useContext(PublicContentContext);
  if (!ctx) {
    throw new Error('usePublicContent must be used within PublicContentProvider');
  }
  return ctx;
}

/** Safe for SEO/meta outside the public layout (admin/portal). */
export function usePublicContentOptional(): PublicContentStore | null {
  return useContext(PublicContentContext);
}
