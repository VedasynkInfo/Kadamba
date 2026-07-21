import { useLeads } from '@/pages/leads/LeadsContext';
import { LeadsTableSection } from '@/pages/leads/sections';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';

/**
 * Full lead list inside Phase 12 console.
 */
export default function AdminLeadsListPage() {
  const { leads } = useLeads();

  return (
    <>
      <AdminHorizonBanner
        title={adminBanners.leadsList.title}
        copy={adminBanners.leadsList.copy}
        actionLabel={adminBanners.leadsList.actionLabel}
        actionTo={adminBanners.leadsList.actionTo}
      />
      <LeadsTableSection leads={leads} />
    </>
  );
}
