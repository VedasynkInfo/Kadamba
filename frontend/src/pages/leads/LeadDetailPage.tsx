import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { LeadsBannerSection, LeadDetailPanel } from './sections';
import { useLeads } from './LeadsContext';

/**
 * Single lead — status tracking, notes, timeline.
 */
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, updateStatus, updateAssignee, addNote } = useLeads();
  const lead = id ? getById(id) : undefined;

  if (!lead) {
    return <Navigate to="/admin/leads/list" replace />;
  }

  return (
    <>
      <LeadsBannerSection
        density="desk"
        primaryLabel="All leads"
        onPrimary={() => navigate('/admin/leads/list')}
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
