import { createBrowserRouter } from 'react-router-dom';
import { RouteErrorPage } from '@/components/feedback/RouteErrorPage';
import { RouterShell } from '@/components/layout/RouterShell';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  prefetchPublicBlogs,
  prefetchPublicGallery,
  prefetchPublicPortfolio,
  prefetchPublicServices,
  prefetchPublicSettings,
} from '@/hooks/useCmsContent';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { PortalLayout } from '@/pages/portal/PortalLayout';
import {
  AboutPage,
  AdminDashboardPage,
  AdminLeadDetailPage,
  AdminLeadsDashboardPage,
  AdminLeadsListPage,
  AdminLoginPage,
  AuditAdminPage,
  BlogDetailPage,
  BlogsAdminPage,
  BlogsPage,
  ContactPage,
  CustomerDetailAdminPage,
  CustomersAdminPage,
  DesignSystemPage,
  FinanceAdminPage,
  ForgotPasswordPage,
  GalleryAdminPage,
  GalleryPage,
  HomePage,
  InvoiceDetailAdminPage,
  InvoicesAdminPage,
  MediaLibraryPage,
  MeasurementsPage,
  NotFoundPage,
  OrderDetailAdminPage,
  OrdersAdminPage,
  PaymentsAdminPage,
  PortfolioAdminPage,
  PortfolioDetailPage,
  PortfolioPage,
  PortalActivatePage,
  PortalChatPage,
  PortalDashboardPage,
  PortalInvoicePage,
  PortalLoginPage,
  PortalMeasurementsPage,
  PortalOrderDetailPage,
  PortalOrdersPage,
  PortalPaymentsPage,
  PortalRequestsPage,
  ProductsAdminPage,
  ProfileAdminPage,
  ReportDetailPage,
  ReportsAdminPage,
  RequestServicePage,
  ResetPasswordPage,
  ServiceDetailPage,
  ServicesAdminPage,
  ServicesPage,
  SettingsAdminPage,
  StaffAdminPage,
  UsersAdminPage,
} from './pages';

/* --------------------------------- loaders --------------------------------- */

/**
 * Start a route's data before its component renders.
 *
 * Public content needs no session, so it can be warmed during the navigation
 * itself. The admin console deliberately does not do this: its access token
 * lives in memory, and a loader runs before the refresh cookie has been
 * exchanged, so the request would be anonymous and 401.
 *
 * `useCmsContent` swallows a failing prefetch, so these always resolve — see the
 * note there for why a loader must never be able to break a page.
 */
const homeLoader = () =>
  Promise.all([prefetchPublicSettings(), prefetchPublicServices(), prefetchPublicBlogs()]);
const servicesLoader = () => Promise.all([prefetchPublicSettings(), prefetchPublicServices()]);
const galleryLoader = () => Promise.all([prefetchPublicSettings(), prefetchPublicGallery()]);
const portfolioLoader = () => Promise.all([prefetchPublicSettings(), prefetchPublicPortfolio()]);
const blogsLoader = () => Promise.all([prefetchPublicSettings(), prefetchPublicBlogs()]);
const settingsLoader = () => prefetchPublicSettings();

/* ---------------------------------- routes --------------------------------- */

/**
 * The route tree.
 *
 * A data router rather than `<Routes>` for three reasons `<BrowserRouter>` cannot
 * provide: an `errorElement` (a route or a loader that throws renders a designed
 * page instead of React Router's developer overlay), `ScrollRestoration` (see
 * `RouterShell`), and loaders that overlap data fetching with the route's chunk
 * download.
 *
 * **Actions are deliberately not used.** They exist to post a form to a route and
 * have the router revalidate; here every write goes through a TanStack Query
 * mutation so it can be optimistic, invalidate both cache families and report
 * through the shared error bridge. Sending the same writes through actions would
 * put two owners on one piece of server state.
 *
 * `errorElement` is repeated on each layout on purpose: an error in a page then
 * renders *inside* its layout, keeping the navbar (or the console chrome) and a
 * way out. The root copy is the fallback of last resort.
 */
export const router = createBrowserRouter([
  {
    element: <RouterShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: 'admin/login', element: <AdminLoginPage /> },
      { path: 'admin/forgot-password', element: <ForgotPasswordPage /> },
      { path: 'admin/reset-password', element: <ResetPasswordPage /> },

      {
        path: 'admin',
        element: <AdminLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'gallery', element: <GalleryAdminPage /> },
          { path: 'services', element: <ServicesAdminPage /> },
          { path: 'portfolio', element: <PortfolioAdminPage /> },
          { path: 'blogs', element: <BlogsAdminPage /> },
          { path: 'leads', element: <AdminLeadsDashboardPage /> },
          { path: 'leads/list', element: <AdminLeadsListPage /> },
          { path: 'leads/:id', element: <AdminLeadDetailPage /> },
          { path: 'customers', element: <CustomersAdminPage /> },
          { path: 'customers/:id', element: <CustomerDetailAdminPage /> },
          { path: 'products', element: <ProductsAdminPage /> },
          { path: 'orders', element: <OrdersAdminPage /> },
          { path: 'orders/:id', element: <OrderDetailAdminPage /> },
          { path: 'staff', element: <StaffAdminPage /> },
          { path: 'finance', element: <FinanceAdminPage /> },
          { path: 'invoices', element: <InvoicesAdminPage /> },
          { path: 'invoices/:id', element: <InvoiceDetailAdminPage /> },
          { path: 'payments', element: <PaymentsAdminPage /> },
          { path: 'reports', element: <ReportsAdminPage /> },
          { path: 'reports/:type', element: <ReportDetailPage /> },
          { path: 'settings', element: <SettingsAdminPage /> },
          { path: 'measurements', element: <MeasurementsPage /> },
          { path: 'users', element: <UsersAdminPage /> },
          { path: 'audit', element: <AuditAdminPage /> },
          { path: 'media', element: <MediaLibraryPage /> },
          { path: 'profile', element: <ProfileAdminPage /> },
          // An unknown console URL is a not-found *inside* the console, rather
          // than the layout with an empty outlet it used to render.
          { path: '*', element: <NotFoundPage /> },
        ],
      },

      { path: 'portal/login', element: <PortalLoginPage /> },
      { path: 'portal/activate', element: <PortalActivatePage /> },
      {
        path: 'portal',
        element: <PortalLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <PortalDashboardPage /> },
          { path: 'dashboard', element: <PortalDashboardPage /> },
          { path: 'orders', element: <PortalOrdersPage /> },
          { path: 'orders/:id', element: <PortalOrderDetailPage /> },
          { path: 'measurements', element: <PortalMeasurementsPage /> },
          { path: 'chat', element: <PortalChatPage /> },
          { path: 'payments', element: <PortalPaymentsPage /> },
          { path: 'invoices/:id', element: <PortalInvoicePage /> },
          { path: 'requests', element: <PortalRequestsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },

      {
        element: <MainLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage />, loader: homeLoader },
          { path: 'about', element: <AboutPage />, loader: settingsLoader },
          { path: 'services', element: <ServicesPage />, loader: servicesLoader },
          { path: 'services/:slug', element: <ServiceDetailPage />, loader: servicesLoader },
          { path: 'gallery', element: <GalleryPage />, loader: galleryLoader },
          { path: 'portfolio', element: <PortfolioPage />, loader: portfolioLoader },
          { path: 'portfolio/:slug', element: <PortfolioDetailPage />, loader: portfolioLoader },
          { path: 'blogs', element: <BlogsPage />, loader: blogsLoader },
          { path: 'blogs/:slug', element: <BlogDetailPage />, loader: blogsLoader },
          { path: 'contact', element: <ContactPage />, loader: settingsLoader },
          { path: 'request-service', element: <RequestServicePage />, loader: servicesLoader },
          { path: 'design-system', element: <DesignSystemPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
