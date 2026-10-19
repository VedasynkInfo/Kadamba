import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { toAppError } from '@/lib/apiError';
import {
  measurementApi,
  type MeasurementProfile,
  type MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import type { DeskTab } from './types';
import { MeasurementsMetrics } from './MeasurementsMetrics';
import { MeasurementsToolbar } from './MeasurementsToolbar';
import { MeasurementsTable } from './MeasurementsTable';
import { MeasurementPreviewModal } from './MeasurementPreviewModal';
import { MeasurementModalForm } from './MeasurementModalForm';

export default function MeasurementsPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filters & Desk Mode
  const [deskTab, setDeskTab] = useState<DeskTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [silhouetteFilter, setSilhouetteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [previewProfile, setPreviewProfile] = useState<MeasurementProfile | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MeasurementProfile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Templates are fetched alongside the fit cards but their failure is kept
      // separate: the desk is still usable without silhouette templates, so it
      // degrades with an explicit warning instead of pretending they loaded.
      const [profData, tplResult] = await Promise.all([
        measurementApi.list({ limit: 100 }),
        measurementApi.listTemplates({ active: true }).then(
          (data) => ({ data, error: null as string | null }),
          (err: unknown) => ({
            data: {
              items: [] as MeasurementTemplate[],
              pagination: { page: 1, limit: 50, total: 0, pages: 1 },
            },
            error: toAppError(err).message,
          }),
        ),
      ]);
      setProfiles(profData.items || []);
      setTemplates(tplResult.data.items || []);
      setTemplateError(tplResult.error);
    } catch (err) {
      toast({
        title: 'Failed to load measurement fit cards',
        description: toAppError(err).message,
        tone: 'error',
      });
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = [...profiles];

    // Primary Desk Tab filter
    if (deskTab === 'pending') {
      result = result.filter((p) => p.status === 'pending_approval');
    }

    if (silhouetteFilter) {
      result = result.filter((p) => p.productTypeCode === silhouetteFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          p.profileName.toLowerCase().includes(q) ||
          p.productTypeCode.toLowerCase().includes(q) ||
          (p.customerId && p.customerId.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [profiles, deskTab, silhouetteFilter, statusFilter, searchQuery]);

  // Metrics
  const activeCount = useMemo(
    () => profiles.filter((p) => p.status === 'active').length,
    [profiles],
  );
  const pendingCount = useMemo(
    () => profiles.filter((p) => p.status === 'pending_approval').length,
    [profiles],
  );
  const archivedCount = useMemo(
    () => profiles.filter((p) => p.status === 'archived').length,
    [profiles],
  );

  // Actions
  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (p: MeasurementProfile) => {
    setEditingProfile(p);
    setFormOpen(true);
  };

  const handleApprove = async (p: MeasurementProfile) => {
    setApprovingId(p.id);
    try {
      const result = await measurementApi.approve(p.id);
      toast({
        tone: 'success',
        title: 'Measurement approved',
        description: result.profileName
          ? `Saved as “${result.profileName}”`
          : 'Profile is now active and ready for pattern cutting',
      });
      if (previewProfile?.id === p.id) {
        setPreviewProfile((prev) => (prev ? { ...prev, status: 'active' } : null));
      }
      void loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve profile';
      toast({ title: 'Approve failed', description: message, tone: 'error' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleDuplicate = async (p: MeasurementProfile) => {
    try {
      await measurementApi.duplicate(p.id);
      toast({ title: 'Measurement fit card duplicated', tone: 'success' });
      void loadData();
    } catch {
      toast({ title: 'Failed to duplicate profile', tone: 'error' });
    }
  };

  const handleArchive = async (p: MeasurementProfile) => {
    const nextArchive = p.status !== 'archived';
    try {
      await measurementApi.archive(p.id, nextArchive);
      toast({
        title: nextArchive ? 'Fit card archived' : 'Fit card restored',
        tone: 'success',
      });
      void loadData();
    } catch {
      toast({ title: 'Failed to change archive status', tone: 'error' });
    }
  };

  const handleResetFilters = () => {
    setDeskTab('all');
    setSearchQuery('');
    setSilhouetteFilter('');
    setStatusFilter('all');
  };

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/measurements" title="Measurements Desk" />

      <div className="space-y-6">
        {/* Header with Title & Sync Action */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: 'var(--admin-text, #f3f4f6)' }}
            >
              Couture Fit & Measurements Desk
            </h1>
            <p className="text-xs opacity-60">
              Anatomical specifications, posture directives, and silhouette templates for master tailors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-current/[0.05] active:scale-98 cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Sync Fit Cards</span>
            </button>
          </div>
        </div>

        {/* Pulse Metric Cards */}
        <MeasurementsMetrics
          totalCount={profiles.length}
          activeCount={activeCount}
          pendingCount={pendingCount}
          archivedCount={archivedCount}
        />

        {templateError ? (
          <Alert tone="warning" title="Silhouette templates unavailable">
            {templateError} Silhouette options fall back to the built-in list until templates load.
          </Alert>
        ) : null}

        {/* Desk Tabs & Single Row Aligned Toolbar */}
        <MeasurementsToolbar
          deskTab={deskTab}
          onDeskTabChange={setDeskTab}
          pendingCount={pendingCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          silhouetteFilter={silhouetteFilter}
          onSilhouetteChange={setSilhouetteFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          templates={templates}
          filteredCount={filtered.length}
          totalCount={profiles.length}
          onReset={handleResetFilters}
          onNewMeasurement={handleOpenCreate}
        />

        {/* Locked Grid Table */}
        <MeasurementsTable
          items={filtered}
          templates={templates}
          loading={loading}
          approvingId={approvingId}
          onPreview={(p) => setPreviewProfile(p)}
          onEdit={handleOpenEdit}
          onApprove={handleApprove}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onNewMeasurement={handleOpenCreate}
        />
      </div>

      {/* Specification Sheet Preview Modal */}
      <MeasurementPreviewModal
        profile={previewProfile}
        templates={templates}
        approvingId={approvingId}
        onClose={() => setPreviewProfile(null)}
        onEdit={(p) => {
          setPreviewProfile(null);
          handleOpenEdit(p);
        }}
        onApprove={handleApprove}
      />

      {/* 3-Tab Creation & Editing Dialog */}
      <MeasurementModalForm
        open={formOpen}
        profile={editingProfile}
        templates={templates}
        onClose={() => {
          setFormOpen(false);
          setEditingProfile(null);
        }}
        onSuccess={() => void loadData()}
      />
    </>
  );
}
