import { useNavigate } from 'react-router-dom';
import { LeadsBannerSection, LeadsTableSection } from './sections';
import { useLeads } from './LeadsContext';

/**
 * Full lead list with search, filters, and CSV export.
 */
export default function LeadsListPage() {
  const navigate = useNavigate();
  const { leads } = useLeads();

  return (
    <>
      <LeadsBannerSection
        density="desk"
        primaryLabel="Back to desk"
        onPrimary={() => navigate('/admin/leads')}
      />
      <LeadsTableSection leads={leads} />
    </>
  );
}
