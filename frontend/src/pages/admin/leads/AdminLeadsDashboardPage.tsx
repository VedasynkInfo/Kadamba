import { useLeads } from '@/pages/leads/LeadsContext';
import { LeadsStatsSection, LeadsTableSection } from '@/pages/leads/sections';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';

/**
 * Leads CRM dashboard inside Phase 12 console — horizon banner (not diagonal desk).
 */
export default function AdminLeadsDashboardPage() {
  const { leads, stats } = useLeads();
  const recent = [...leads]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.leads.title}
        copy={adminBanners.leads.copy}
        actionLabel={adminBanners.leads.actionLabel}
        actionTo={adminBanners.leads.actionTo}
      />
      <LeadsStatsSection
        leads={leads}
        total={stats.total}
        open={stats.open}
        appointments={stats.appointments}
        newCount={stats.newCount}
      />
      <LeadsTableSection
        leads={recent}
        title="Recently updated"
        description="Jump into the latest bridal and traditional enquiries."
      />
    </>
  );
}
