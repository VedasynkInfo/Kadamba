import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { galleryItems, type GalleryItem } from '@/pages/gallery/data';
import { serviceDetails, type ServiceDetail } from '@/pages/services/data';
import { portfolioProjects, type PortfolioProject } from '@/pages/portfolio/data';
import { blogPosts, type BlogPost } from '@/pages/blogs/data';
import { galleryApi } from '@/services/gallery/galleryService';
import { servicesApi } from '@/services/services/servicesService';
import { portfolioApi } from '@/services/portfolio/portfolioService';
import { blogsApi } from '@/services/blogs/blogsService';
import { settingsApi } from '@/services/settings/settingsService';
import { defaultWebsiteSettings, type WebsiteSettings } from './data';

/** Deep-merge API settings onto defaults so nested sections always exist. */
export function mergeWebsiteSettings(partial?: Partial<WebsiteSettings> | null): WebsiteSettings {
  const base = structuredClone(defaultWebsiteSettings);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    addressLines: partial.addressLines?.length ? partial.addressLines : base.addressLines,
    hours: partial.hours?.length ? partial.hours : base.hours,
    social: partial.social?.length ? partial.social : base.social,
    socialNamed: { ...base.socialNamed, ...(partial.socialNamed || {}) },
    seo: { ...base.seo, ...(partial.seo || {}) },
    media: {
      ...base.media,
      ...(partial.media || {}),
      bannerPresets: partial.media?.bannerPresets?.length
        ? partial.media.bannerPresets
        : base.media.bannerPresets,
    },
    emailConfig: {
      ...base.emailConfig!,
      ...(partial.emailConfig || {}),
      templates: partial.emailConfig?.templates?.length
        ? partial.emailConfig.templates
        : base.emailConfig!.templates,
    },
    theme: { ...base.theme, ...(partial.theme || {}) },
  };
}

interface AdminContentStore {
  loading: boolean;
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
  refresh: () => Promise<void>;
}

const AdminContentContext = createContext<AdminContentStore | null>(null);

function isDemoToken(): boolean {
  return localStorage.getItem('kadamba_token') === 'demo-admin-token';
}

export function AdminContentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>(() => mergeWebsiteSettings());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoToken() && import.meta.env.DEV) {
        setGallery(structuredClone(galleryItems));
        setServices(structuredClone(serviceDetails));
        setPortfolio(structuredClone(portfolioProjects));
        setBlogs(structuredClone(blogPosts));
        setSettings(mergeWebsiteSettings());
        return;
      }

      const [g, s, p, b, site] = await Promise.all([
        galleryApi.list(),
        servicesApi.list(),
        portfolioApi.list(),
        blogsApi.list(),
        settingsApi.getAdmin().catch(() => settingsApi.get()),
      ]);

      setGallery(g.items.length ? g.items : import.meta.env.DEV ? structuredClone(galleryItems) : []);
      setServices(
        s.items.length ? s.items : import.meta.env.DEV ? structuredClone(serviceDetails) : [],
      );
      setPortfolio(
        p.items.length
          ? p.items
          : import.meta.env.DEV
            ? structuredClone(portfolioProjects)
            : [],
      );
      setBlogs(b.items.length ? b.items : import.meta.env.DEV ? structuredClone(blogPosts) : []);
      setSettings(mergeWebsiteSettings(site));
    } catch (err) {
      console.warn('Admin content API unavailable — using seed data', err);
      if (import.meta.env.DEV) {
        setGallery(structuredClone(galleryItems));
        setServices(structuredClone(serviceDetails));
        setPortfolio(structuredClone(portfolioProjects));
        setBlogs(structuredClone(blogPosts));
        setSettings(structuredClone(defaultWebsiteSettings));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upsertGallery = useCallback(async (item: GalleryItem) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setGallery((prev) => {
        const idx = prev.findIndex((g) => g.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });
      return;
    }
    const saved = await galleryApi.upsert(item);
    setGallery((prev) => {
      const idx = prev.findIndex((g) => g.id === saved.id || g.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const removeGallery = useCallback(async (id: string) => {
    if (!(isDemoToken() && import.meta.env.DEV)) {
      await galleryApi.remove(id);
    }
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const upsertService = useCallback(async (item: ServiceDetail) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setServices((prev) => {
        const idx = prev.findIndex((s) => s.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });
      return;
    }
    const saved = await servicesApi.upsert(item);
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id || s.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const removeService = useCallback(async (id: string) => {
    if (!(isDemoToken() && import.meta.env.DEV)) {
      await servicesApi.remove(id);
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const upsertProject = useCallback(async (item: PortfolioProject) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setPortfolio((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });
      return;
    }
    const saved = await portfolioApi.upsert(item);
    setPortfolio((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id || p.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const removeProject = useCallback(async (id: string) => {
    if (!(isDemoToken() && import.meta.env.DEV)) {
      await portfolioApi.remove(id);
    }
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const upsertBlog = useCallback(async (item: BlogPost) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setBlogs((prev) => {
        const idx = prev.findIndex((b) => b.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });
      return;
    }
    const saved = await blogsApi.upsert(item);
    setBlogs((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id || b.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const removeBlog = useCallback(async (id: string) => {
    if (!(isDemoToken() && import.meta.env.DEV)) {
      await blogsApi.remove(id);
    }
    setBlogs((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const saveSettings = useCallback(async (next: WebsiteSettings) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setSettings(mergeWebsiteSettings(next));
      return;
    }
    const saved = await settingsApi.update(next);
    setSettings(mergeWebsiteSettings(saved));
  }, []);

  const resetSettings = useCallback(async () => {
    const next = mergeWebsiteSettings();
    await saveSettings(next);
  }, [saveSettings]);

  const value = useMemo<AdminContentStore>(
    () => ({
      loading,
      gallery,
      upsertGallery,
      removeGallery,
      services,
      upsertService,
      removeService,
      portfolio,
      upsertProject,
      removeProject,
      blogs,
      upsertBlog,
      removeBlog,
      settings,
      saveSettings,
      resetSettings,
      refresh,
    }),
    [
      loading,
      gallery,
      upsertGallery,
      removeGallery,
      services,
      upsertService,
      removeService,
      portfolio,
      upsertProject,
      removeProject,
      blogs,
      upsertBlog,
      removeBlog,
      settings,
      saveSettings,
      resetSettings,
      refresh,
    ],
  );

  return (
    <AdminContentContext.Provider value={value}>{children}</AdminContentContext.Provider>
  );
}

export function useAdminContent(): AdminContentStore {
  const ctx = useContext(AdminContentContext);
  if (!ctx) {
    throw new Error('useAdminContent must be used within AdminContentProvider');
  }
  return ctx;
}
