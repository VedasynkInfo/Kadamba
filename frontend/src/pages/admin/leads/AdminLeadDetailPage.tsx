import { Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { LeadDetailPanel } from '@/pages/leads/sections';
import { useLeads } from '@/pages/leads/LeadsContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';

/**
 * Single lead detail inside Phase 12 console.
 */
export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getById, updateStatus, updateAssignee, addNote } = useLeads();
  const lead = id ? getById(id) : undefined;

  if (!lead) {
    return <Navigate to="/admin/leads/list" replace />;
  }

  return (
    <>
      <AdminHorizonBanner
        title={`${adminBanners.leadDetail.title} · ${lead.name}`}
        copy={adminBanners.leadDetail.copy}
        actionLabel={adminBanners.leadDetail.actionLabel}
        actionTo={adminBanners.leadDetail.actionTo}
      />
      <LeadDetailPanel
        lead={lead}
        onStatus={(status) => updateStatus(lead.id, status)}
        onAssignee={(assignee) => updateAssignee(lead.id, assignee)}
        onAddNote={(body) => addNote(lead.id, body)}
      />
    </>
  );
}
