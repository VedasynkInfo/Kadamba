import { useNavigate } from 'react-router-dom';
import { useLeads } from './LeadsContext';
import { LeadsBannerSection, LeadsStatsSection, LeadsTableSection } from './sections';

/**
 * Phase 11 CRM dashboard — desk banner, pipeline pulse, recent leads.
 */
export default function LeadsDashboardPage() {
  const navigate = useNavigate();
  const { leads, stats } = useLeads();
  const recent = [...leads]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <>
      <LeadsBannerSection
        density="full"
        primaryLabel="Open lead list"
        onPrimary={() => navigate('/admin/leads/list')}
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
