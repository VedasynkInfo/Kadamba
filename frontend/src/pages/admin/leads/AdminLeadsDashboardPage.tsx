import { useMemo, useState } from 'react';
import { useLeads } from '@/pages/leads/LeadsContext';
import { useToast } from '@/components/ui';
import type { Lead, LeadStatus } from '@/pages/leads/data';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { LeadsMetrics } from './LeadsMetrics';
import { LeadsTable } from './LeadsTable';
import { LeadPreviewModal } from './LeadPreviewModal';
import { LeadCreateModal } from './LeadCreateModal';
import { createEmptyLeadForm, type LeadFormData } from './types';

export default function AdminLeadsDashboardPage() {
  const { leads, updateLeadStatus, addLead } = useLeads();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [createForm, setCreateForm] = useState<LeadFormData>(createEmptyLeadForm());
  const [saving, setSaving] = useState(false);

  const recent = useMemo(
    () =>
      [...leads]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 8),
    [leads],
  );

  const metrics = useMemo(() => {
    const total = leads.length;
    const open = leads.filter((l) => l.status !== 'Completed' && l.status !== 'Rejected').length;
    const appointments = leads.filter((l) => l.status === 'Appointment').length;
    const hotLeads = leads.filter((l) => l.quality === 'hot').length;
    return { total, open, appointments, hotLeads };
  }, [leads]);

  async function handleSaveLead() {
    if (!createForm.name.trim() || !createForm.phone.trim()) {
      toast({ tone: 'error', title: 'Missing required fields', description: 'Name and phone are required.' });
      return;
    }
    setSaving(true);
    try {
      await addLead({
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim(),
        city: createForm.city.trim(),
        service: createForm.service.trim(),
        source: createForm.source,
        assignee: createForm.assignee,
        status: createForm.status,
        quality: createForm.quality,
        notes: createForm.notes,
        eventDate: '',
      });
      toast({ tone: 'success', title: 'New lead added to CRM' });
      setCreateForm(createEmptyLeadForm());
      setCreateOpen(false);
    } catch {
      toast({ tone: 'error', title: 'Failed to create lead' });
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(leadId: string, nextStatus: LeadStatus) {
    updateLeadStatus(leadId, nextStatus);
    toast({ tone: 'success', title: `Lead moved to ${nextStatus}` });
    if (previewLead?.id === leadId) {
      setPreviewLead({ ...previewLead, status: nextStatus });
    }
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Leads CRM & Client Inquiries"
        copy="Overview of active bridal consultations, quality distribution, and recently active client journeys."
        actionLabel="+ New Lead"
        onAction={() => setCreateOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <LeadsMetrics metrics={metrics} />

        {/* Recent Pipeline Activity Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold tracking-tight text-inherit">Recently Active Enquiries</h3>
            <a href="/admin/leads/list" className="text-xs font-semibold text-[var(--admin-primary,#b59410)] hover:underline">
              View All Pipeline ({leads.length}) →
            </a>
          </div>

          <LeadsTable
            items={recent}
            hasActiveFilters={false}
            onResetFilters={() => {}}
            onNewLead={() => setCreateOpen(true)}
            onPreview={setPreviewLead}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Quick Dossier Preview Modal */}
      <LeadPreviewModal
        lead={previewLead}
        onClose={() => setPreviewLead(null)}
        onStatusChange={handleStatusChange}
      />

      {/* New Lead Intake Modal */}
      <LeadCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        form={createForm}
        setForm={setCreateForm}
        onSave={handleSaveLead}
        saving={saving}
      />
    </div>
  );
}
