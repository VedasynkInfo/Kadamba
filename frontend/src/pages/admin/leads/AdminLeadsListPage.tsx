import { useMemo, useState } from 'react';
import { useLeads } from '@/pages/leads/LeadsContext';
import { downloadCsv, filterLeads, leadsToCsv, type Lead, type LeadStatus } from '@/pages/leads/data';
import { useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { LeadsMetrics } from './LeadsMetrics';
import { LeadsToolbar } from './LeadsToolbar';
import { LeadsTable } from './LeadsTable';
import { LeadPreviewModal } from './LeadPreviewModal';
import { LeadCreateModal } from './LeadCreateModal';
import { createEmptyLeadForm, type LeadFormData } from './types';

export default function AdminLeadsListPage() {
  const { leads, updateLeadStatus, addLead } = useLeads();
  const { toast } = useToast();

  // Filters state
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('All');
  const [quality, setQuality] = useState<string>('All');
  const [desk, setDesk] = useState<string>('All');

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [createForm, setCreateForm] = useState<LeadFormData>(createEmptyLeadForm());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let result = filterLeads(
      leads,
      query,
      status as LeadStatus | 'All',
      desk === 'All' ? 'All' : desk,
    );
    if (quality !== 'All') {
      result = result.filter((l) => l.quality === quality);
    }
    return result;
  }, [leads, query, status, quality, desk]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const open = leads.filter((l) => l.status !== 'Completed' && l.status !== 'Rejected').length;
    const appointments = leads.filter((l) => l.status === 'Appointment').length;
    const hotLeads = leads.filter((l) => l.quality === 'hot').length;
    return { total, open, appointments, hotLeads };
  }, [leads]);

  const hasActiveFilters = query || status !== 'All' || quality !== 'All' || desk !== 'All';

  function resetFilters() {
    setQuery('');
    setStatus('All');
    setQuality('All');
    setDesk('All');
  }

  function handleExportCsv() {
    downloadCsv(
      `kadamba-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      leadsToCsv(filtered),
    );
    toast({ tone: 'info', title: `Exported ${filtered.length} leads to CSV` });
  }

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
        title="Client Enquiries & Bridal Leads CRM"
        copy="Manage bridal consultations, assign stylist desks, and convert enquiries into atelier commissions."
        actionLabel="+ New Lead"
        onAction={() => setCreateOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <LeadsMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <LeadsToolbar
          query={query}
          onQueryChange={setQuery}
          selectedStatus={status}
          onStatusChange={setStatus}
          selectedQuality={quality}
          onQualityChange={setQuality}
          selectedDesk={desk}
          onDeskChange={setDesk}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={leads.length}
          onExportCsv={handleExportCsv}
          onNewLead={() => setCreateOpen(true)}
        />

        {/* Modern Compact Table Card */}
        <LeadsTable
          items={filtered}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          onNewLead={() => setCreateOpen(true)}
          onPreview={setPreviewLead}
          onStatusChange={handleStatusChange}
        />
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
