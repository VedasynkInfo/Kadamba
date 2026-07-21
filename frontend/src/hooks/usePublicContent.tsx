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

interface PublicContentStore {
  loading: boolean;
  gallery: GalleryItem[];
  services: ServiceDetail[];
  portfolio: PortfolioProject[];
  blogs: BlogPost[];
  refresh: () => Promise<void>;
}

const PublicContentContext = createContext<PublicContentStore | null>(null);

/**
 * Loads published CMS content for the public site.
 * Falls back to seed data only when the API returns empty or is offline.
 */
export function PublicContentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<GalleryItem[]>(galleryItems);
  const [services, setServices] = useState<ServiceDetail[]>(serviceDetails);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(portfolioProjects);
  const [blogs, setBlogs] = useState<BlogPost[]>(blogPosts);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s, p, b] = await Promise.all([
        galleryApi.list({ published: true, limit: 100 }),
        servicesApi.list({ published: true, limit: 100 }),
        portfolioApi.list({ published: true, limit: 100 }),
        blogsApi.list({ published: true, limit: 100 }),
      ]);

      setGallery(g.items.length ? g.items : galleryItems);
      setServices(s.items.length ? s.items : serviceDetails);
      setPortfolio(p.items.length ? p.items : portfolioProjects);
      setBlogs(b.items.length ? b.items : blogPosts);
    } catch (err) {
      console.warn('Public content API unavailable — using seed data', err);
      setGallery(galleryItems);
      setServices(serviceDetails);
      setPortfolio(portfolioProjects);
      setBlogs(blogPosts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refetch when returning to the tab after editing in admin
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const value = useMemo(
    () => ({ loading, gallery, services, portfolio, blogs, refresh }),
    [loading, gallery, services, portfolio, blogs, refresh],
  );

  return (
    <PublicContentContext.Provider value={value}>{children}</PublicContentContext.Provider>
  );
}

export function usePublicContent(): PublicContentStore {
  const ctx = useContext(PublicContentContext);
  if (!ctx) {
    throw new Error('usePublicContent must be used within PublicContentProvider');
  }
  return ctx;
}
