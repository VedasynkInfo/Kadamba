import { Link } from 'react-router-dom';
import { useAdminContent } from './AdminContentContext';
import { AdminHorizonBanner } from './components/AdminHorizonBanner';
import { AdminStatWidgets } from './components/AdminStatWidgets';
import { adminBanners } from './data';
import { useLeads } from '@/pages/leads/LeadsContext';
import { formatLeadDate } from '@/pages/leads/data';

/**
 * Phase 12 dashboard — horizon desk banner, widgets, recent activity.
 */
export default function AdminDashboardPage() {
  const { gallery, blogs, services, portfolio } = useAdminContent();
  const { leads, stats } = useLeads();

  const recentLeads = [...leads]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  const publishedGallery = gallery.filter((g) => g.published).length;

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.dashboard.title}
        copy={adminBanners.dashboard.copy}
        actionLabel={adminBanners.dashboard.actionLabel}
        actionTo={adminBanners.dashboard.actionTo}
      />
      <AdminStatWidgets
        items={[
          {
            label: 'Total leads',
            value: stats.total,
            href: '/admin/leads',
            hint: `${stats.open} open`,
          },
          {
            label: 'Gallery images',
            value: publishedGallery,
            href: '/admin/gallery',
            hint: `${gallery.length} total`,
          },
          {
            label: 'Blogs',
            value: blogs.length,
            href: '/admin/blogs',
          },
          {
            label: 'Open requests',
            value: stats.newCount,
            href: '/admin/leads/list',
            hint: 'New enquiries',
          },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-heading text-[0.65rem] uppercase tracking-[0.3em] text-black/45">
              Recent activity
            </p>
            <h2 className="mt-2 font-heading text-2xl text-black sm:text-3xl">
              Latest lead updates
            </h2>
          </div>
          <p className="text-sm text-black/50">
            {services.length} services · {portfolio.length} portfolio projects
          </p>
        </div>

        <ul className="mt-8 divide-y divide-black/10 border-y border-black/10">
          {recentLeads.map((lead) => (
            <li key={lead.id}>
              <Link
                to={`/admin/leads/${lead.id}`}
                className="flex flex-col gap-1 py-4 transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div>
                  <p className="font-heading text-lg text-black">{lead.name}</p>
                  <p className="mt-1 text-sm text-black/55">
                    {lead.service} · {lead.status} · {lead.city}
                  </p>
                </div>
                <p className="shrink-0 text-xs uppercase tracking-[0.16em] text-black/40">
                  {formatLeadDate(lead.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
          {recentLeads.length === 0 ? (
            <li className="py-8 text-sm text-black/50">No leads yet.</li>
          ) : null}
        </ul>
      </section>
    </>
  );
}
