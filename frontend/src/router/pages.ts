import { lazy } from 'react';

/**
 * The page inventory, lazily imported.
 *
 * Kept apart from the route table on purpose. A route table is configuration: it
 * exports a router, and the pages it refers to are just values it wires up. Held
 * in one file with the lazy components, the whole thing reads as a component
 * module — which is both untrue and (as the fast-refresh rule correctly points
 * out) a reason for every route edit to reload the app in development.
 *
 * Splitting also puts the code-splitting boundaries in one place: each export
 * here is one chunk, and `index.tsx` decides where it mounts.
 */
export const HomePage = lazy(() => import('@/pages/home/HomePage'));
export const AboutPage = lazy(() => import('@/pages/about/AboutPage'));
export const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'));
export const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
export const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage'));
export const ServiceDetailPage = lazy(() => import('@/pages/services/ServiceDetailPage'));
export const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage'));
export const PortfolioPage = lazy(() => import('@/pages/portfolio/PortfolioPage'));
export const PortfolioDetailPage = lazy(() => import('@/pages/portfolio/PortfolioDetailPage'));
export const BlogsPage = lazy(() => import('@/pages/blogs/BlogsPage'));
export const BlogDetailPage = lazy(() => import('@/pages/blogs/BlogDetailPage'));
export const ContactPage = lazy(() => import('@/pages/contact/ContactPage'));
export const RequestServicePage = lazy(() => import('@/pages/request-service/RequestServicePage'));
export const DesignSystemPage = lazy(() => import('@/pages/design-system/DesignSystemPage'));
export const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
export const ForgotPasswordPage = lazy(() => import('@/pages/admin/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('@/pages/admin/ResetPasswordPage'));
export const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
export const GalleryAdminPage = lazy(() => import('@/pages/admin/gallery/GalleryAdminPage'));
export const ServicesAdminPage = lazy(() => import('@/pages/admin/services/ServicesAdminPage'));
export const PortfolioAdminPage = lazy(() => import('@/pages/admin/portfolio/PortfolioAdminPage'));
export const BlogsAdminPage = lazy(() => import('@/pages/admin/blogs/BlogsAdminPage'));
export const SettingsAdminPage = lazy(() => import('@/pages/admin/settings/SettingsAdminPage'));
export const ProfileAdminPage = lazy(() => import('@/pages/admin/profile/ProfileAdminPage'));
export const AdminLeadsDashboardPage = lazy(
  () => import('@/pages/admin/leads/AdminLeadsDashboardPage'),
);
export const AdminLeadsListPage = lazy(() => import('@/pages/admin/leads/AdminLeadsListPage'));
export const AdminLeadDetailPage = lazy(() => import('@/pages/admin/leads/AdminLeadDetailPage'));
export const OrdersAdminPage = lazy(() => import('@/pages/admin/orders/OrdersAdminPage'));
export const OrderBoardPage = lazy(() => import('@/pages/admin/orders/OrderBoardPage'));
export const OrderDetailAdminPage = lazy(() => import('@/pages/admin/orders/OrderDetailAdminPage'));
export const CustomersAdminPage = lazy(() => import('@/pages/admin/customers/CustomersAdminPage'));
export const CustomerDetailAdminPage = lazy(
  () => import('@/pages/admin/customers/CustomerDetailAdminPage'),
);
export const ProductsAdminPage = lazy(() => import('@/pages/admin/products/ProductsAdminPage'));
export const MeasurementsPage = lazy(() => import('@/pages/admin/measurements/MeasurementsPage'));
export const StaffAdminPage = lazy(() => import('@/pages/admin/staff/StaffAdminPage'));
export const FinanceAdminPage = lazy(() => import('@/pages/admin/finance/FinanceAdminPage'));
export const InvoicesAdminPage = lazy(() => import('@/pages/admin/finance/InvoicesAdminPage'));
export const InvoiceDetailAdminPage = lazy(
  () => import('@/pages/admin/finance/InvoiceDetailAdminPage'),
);
export const PaymentsAdminPage = lazy(() => import('@/pages/admin/finance/PaymentsAdminPage'));
export const ReportsAdminPage = lazy(() => import('@/pages/admin/reports/ReportsAdminPage'));
export const ReportDetailPage = lazy(() => import('@/pages/admin/reports/ReportDetailPage'));
export const UsersAdminPage = lazy(() => import('@/pages/admin/users/UsersAdminPage'));
export const AuditAdminPage = lazy(() => import('@/pages/admin/users/AuditAdminPage'));
export const MediaLibraryPage = lazy(() => import('@/pages/admin/media/MediaLibraryPage'));
export const PortalLoginPage = lazy(() => import('@/pages/portal/PortalLoginPage'));
export const PortalActivatePage = lazy(() => import('@/pages/portal/PortalActivatePage'));
export const PortalDashboardPage = lazy(() => import('@/pages/portal/PortalDashboardPage'));
export const PortalOrdersPage = lazy(() => import('@/pages/portal/PortalOrdersPage'));
export const PortalOrderDetailPage = lazy(() =>
  import('@/pages/portal/PortalOrdersPage').then((m) => ({ default: m.PortalOrderDetailPage })),
);
export const PortalMeasurementsPage = lazy(() => import('@/pages/portal/PortalMeasurementsPage'));
export const PortalChatPage = lazy(() => import('@/pages/portal/PortalChatPage'));
export const PortalPaymentsPage = lazy(() => import('@/pages/portal/PortalPaymentsPage'));
export const PortalInvoicePage = lazy(() => import('@/pages/portal/PortalInvoicePage'));
export const PortalRequestsPage = lazy(() => import('@/pages/portal/PortalRequestsPage'));
export const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));
