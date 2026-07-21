import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { Spinner } from '@/components/ui';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/hooks/useAuth';
import { AdminLayout } from '@/pages/admin/AdminLayout';

const HomePage = lazy(() => import('@/pages/home/HomePage'));
const AboutPage = lazy(() => import('@/pages/about/AboutPage'));
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/services/ServiceDetailPage'));
const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage'));
const PortfolioPage = lazy(() => import('@/pages/portfolio/PortfolioPage'));
const PortfolioDetailPage = lazy(() => import('@/pages/portfolio/PortfolioDetailPage'));
const BlogsPage = lazy(() => import('@/pages/blogs/BlogsPage'));
const BlogDetailPage = lazy(() => import('@/pages/blogs/BlogDetailPage'));
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'));
const RequestServicePage = lazy(() => import('@/pages/request-service/RequestServicePage'));
const DesignSystemPage = lazy(() => import('@/pages/design-system/DesignSystemPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const GalleryAdminPage = lazy(() => import('@/pages/admin/gallery/GalleryAdminPage'));
const ServicesAdminPage = lazy(() => import('@/pages/admin/services/ServicesAdminPage'));
const PortfolioAdminPage = lazy(() => import('@/pages/admin/portfolio/PortfolioAdminPage'));
const BlogsAdminPage = lazy(() => import('@/pages/admin/blogs/BlogsAdminPage'));
const SettingsAdminPage = lazy(() => import('@/pages/admin/settings/SettingsAdminPage'));
const ProfileAdminPage = lazy(() => import('@/pages/admin/profile/ProfileAdminPage'));
const AdminLeadsDashboardPage = lazy(() => import('@/pages/admin/leads/AdminLeadsDashboardPage'));
const AdminLeadsListPage = lazy(() => import('@/pages/admin/leads/AdminLeadsListPage'));
const AdminLeadDetailPage = lazy(() => import('@/pages/admin/leads/AdminLeadDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-cream">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="services/:slug" element={<ServiceDetailPage />} />
                  <Route path="gallery" element={<GalleryPage />} />
                  <Route path="portfolio" element={<PortfolioPage />} />
                  <Route path="portfolio/:slug" element={<PortfolioDetailPage />} />
                  <Route path="blogs" element={<BlogsPage />} />
                  <Route path="blogs/:slug" element={<BlogDetailPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="request-service" element={<RequestServicePage />} />
                  <Route path="design-system" element={<DesignSystemPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="admin/login" element={<AdminLoginPage />} />

                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="gallery" element={<GalleryAdminPage />} />
                  <Route path="services" element={<ServicesAdminPage />} />
                  <Route path="portfolio" element={<PortfolioAdminPage />} />
                  <Route path="blogs" element={<BlogsAdminPage />} />
                  <Route path="leads" element={<AdminLeadsDashboardPage />} />
                  <Route path="leads/list" element={<AdminLeadsListPage />} />
                  <Route path="leads/:id" element={<AdminLeadDetailPage />} />
                  <Route path="settings" element={<SettingsAdminPage />} />
                  <Route path="profile" element={<ProfileAdminPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
