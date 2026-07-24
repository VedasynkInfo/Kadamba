import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { Spinner } from '@/components/ui';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/hooks/useAuth';
import { PortalAuthProvider } from '@/hooks/usePortalAuth';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { PortalLayout } from '@/pages/portal/PortalLayout';

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
const OrdersAdminPage = lazy(() => import('@/pages/admin/orders/OrdersAdminPage'));
const OrderDetailAdminPage = lazy(() => import('@/pages/admin/orders/OrderDetailAdminPage'));
const CustomersAdminPage = lazy(() => import('@/pages/admin/customers/CustomersAdminPage'));
const CustomerDetailAdminPage = lazy(() => import('@/pages/admin/customers/CustomerDetailAdminPage'));
const ProductsAdminPage = lazy(() => import('@/pages/admin/products/ProductsAdminPage'));
const MeasurementsPage = lazy(() => import('@/pages/admin/measurements/MeasurementsPage'));
const StaffAdminPage = lazy(() => import('@/pages/admin/staff/StaffAdminPage'));
const FinanceAdminPage = lazy(() => import('@/pages/admin/finance/FinanceAdminPage'));
const InvoicesAdminPage = lazy(() => import('@/pages/admin/finance/InvoicesAdminPage'));
const InvoiceDetailAdminPage = lazy(() => import('@/pages/admin/finance/InvoiceDetailAdminPage'));
const PaymentsAdminPage = lazy(() => import('@/pages/admin/finance/PaymentsAdminPage'));
const ReportsAdminPage = lazy(() => import('@/pages/admin/reports/ReportsAdminPage'));
const ReportDetailPage = lazy(() => import('@/pages/admin/reports/ReportDetailPage'));
const PortalLoginPage = lazy(() => import('@/pages/portal/PortalLoginPage'));
const PortalActivatePage = lazy(() => import('@/pages/portal/PortalActivatePage'));
const PortalDashboardPage = lazy(() => import('@/pages/portal/PortalDashboardPage'));
const PortalOrdersPage = lazy(() => import('@/pages/portal/PortalOrdersPage'));
const PortalOrderDetailPage = lazy(() =>
  import('@/pages/portal/PortalOrdersPage').then((m) => ({ default: m.PortalOrderDetailPage })),
);
const PortalMeasurementsPage = lazy(() => import('@/pages/portal/PortalMeasurementsPage'));
const PortalChatPage = lazy(() => import('@/pages/portal/PortalChatPage'));
const PortalPaymentsPage = lazy(() => import('@/pages/portal/PortalPaymentsPage'));
const PortalInvoicePage = lazy(() => import('@/pages/portal/PortalInvoicePage'));
const PortalRequestsPage = lazy(() => import('@/pages/portal/PortalRequestsPage'));
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
        <PortalAuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
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
                    <Route path="customers" element={<CustomersAdminPage />} />
                    <Route path="customers/:id" element={<CustomerDetailAdminPage />} />
                    <Route path="products" element={<ProductsAdminPage />} />
                    <Route path="orders" element={<OrdersAdminPage />} />
                    <Route path="orders/:id" element={<OrderDetailAdminPage />} />
                    <Route path="staff" element={<StaffAdminPage />} />
                    <Route path="finance" element={<FinanceAdminPage />} />
                    <Route path="invoices" element={<InvoicesAdminPage />} />
                    <Route path="invoices/:id" element={<InvoiceDetailAdminPage />} />
                    <Route path="payments" element={<PaymentsAdminPage />} />
                    <Route path="reports" element={<ReportsAdminPage />} />
                    <Route path="reports/:type" element={<ReportDetailPage />} />
                    <Route path="settings" element={<SettingsAdminPage />} />
                    <Route path="measurements" element={<MeasurementsPage />} />
                    <Route path="profile" element={<ProfileAdminPage />} />
                  </Route>

                  <Route path="portal/login" element={<PortalLoginPage />} />
                  <Route path="portal/activate" element={<PortalActivatePage />} />
                  <Route path="portal" element={<PortalLayout />}>
                    <Route index element={<PortalDashboardPage />} />
                    <Route path="dashboard" element={<PortalDashboardPage />} />
                    <Route path="orders" element={<PortalOrdersPage />} />
                    <Route path="orders/:id" element={<PortalOrderDetailPage />} />
                    <Route path="measurements" element={<PortalMeasurementsPage />} />
                    <Route path="chat" element={<PortalChatPage />} />
                    <Route path="payments" element={<PortalPaymentsPage />} />
                    <Route path="invoices/:id" element={<PortalInvoicePage />} />
                    <Route path="requests" element={<PortalRequestsPage />} />
                  </Route>

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
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </PortalAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
