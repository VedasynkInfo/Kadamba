import { Navigate, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { LeadDetailPanel } from '@/pages/leads/sections';
import { useLeads } from '@/pages/leads/LeadsContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { ordersApi } from '@/services/orders/orderService';
import { useState } from 'react';

/**
 * Single lead detail inside Phase 12 console.
 */
export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getById, updateStatus, updateAssignee, addNote } = useLeads();
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);
  const lead = id ? getById(id) : undefined;

  if (!lead) {
    return <Navigate to="/admin/leads/list" replace />;
  }

  const handleConvertToOrder = async () => {
    if (converting) return;
    setConverting(true);
    try {
      const order = await ordersApi.convertFromLead(lead.id);
      navigate(`/admin/orders/${order.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert lead to order');
    } finally {
      setConverting(false);
    }
  };

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
        onConvertToOrder={handleConvertToOrder}
      />
    </>
  );
}
