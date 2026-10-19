import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { REPORT_CATALOG, REPORT_CATEGORIES } from './reportCatalog';

export default function ReportsAdminPage() {
  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.reports.title}
        copy={adminBanners.reports.copy}
        actionLabel={adminBanners.reports.actionLabel}
        actionTo={adminBanners.reports.actionTo}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        <div className="border-b border-line pb-6 mb-10">
          <h2 className="font-heading text-xl text-ink">Boutique reports</h2>
          <p className="mt-1 text-sm text-ink/55 max-w-2xl">
            Revenue means payments received. Outstanding is quoted total minus paid on open orders.
            Choose a report to filter by date and export CSV.
          </p>
        </div>

        <div className="space-y-12">
          {REPORT_CATEGORIES.map((category) => {
            const items = REPORT_CATALOG.filter((r) => r.category === category);
            return (
              <section key={category}>
                <h3 className="text-xs font-medium uppercase tracking-wider text-ink/45 mb-4">
                  {category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Link
                      key={item.type}
                      to={`/admin/reports/${item.type}`}
                      className="group block border-t border-line pt-4 pb-2 transition hover:border-gold"
                    >
                      <p className="font-heading text-lg text-ink group-hover:text-ink/80">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-sm text-ink/55 leading-relaxed">
                        {item.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold tracking-wide">
                        Open report
                        <Icon name="arrowRight" size={14} />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
