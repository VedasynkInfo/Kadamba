import { useState, useEffect, useCallback, useMemo } from 'react';
import { staffApi, type Staff } from '@/services/staff/staffService';
import { useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { StaffMetrics } from './StaffMetrics';
import { StaffToolbar } from './StaffToolbar';
import { StaffTable } from './StaffTable';
import { StaffPreviewModal } from './StaffPreviewModal';
import { StaffModalForm } from './StaffModalForm';

export default function StaffAdminPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  // Modals
  const [previewStaff, setPreviewStaff] = useState<Staff | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffApi.list({
        limit: 100,
        q: searchQuery || undefined,
        status: statusFilter || undefined,
        specialization: specializationFilter || undefined,
        employmentType: employmentFilter || undefined,
      });
      setStaff(data.items);
    } catch {
      toast({ title: 'Failed to load staff roster', tone: 'error' });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, specializationFilter, employmentFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStaff();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStaff]);

  // Actions
  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (s: Staff) => {
    setEditingStaff(s);
    setFormOpen(true);
  };

  const handleDeactivate = async (s: Staff) => {
    try {
      await staffApi.update(s.id, { status: 'inactive' } as any);
      toast({ title: `${s.fullName} marked as inactive`, tone: 'success' });
      void fetchStaff();
    } catch {
      toast({ title: 'Failed to update status', tone: 'error' });
    }
  };

  const handleReactivate = async (s: Staff) => {
    try {
      await staffApi.update(s.id, { status: 'active' } as any);
      toast({ title: `${s.fullName} reactivated on floor`, tone: 'success' });
      void fetchStaff();
    } catch {
      toast({ title: 'Failed to reactivate staff member', tone: 'error' });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('active');
    setEmploymentFilter('');
    setSpecializationFilter('');
  };

  // Metrics Calculations
  const activeCount = useMemo(() => staff.filter((s) => s.status === 'active').length, [staff]);
  const permanentCount = useMemo(
    () => staff.filter((s) => s.employmentType === 'permanent').length,
    [staff],
  );
  const monthlyPayroll = useMemo(
    () =>
      staff
        .filter((s) => s.status === 'active' && s.salaryType === 'monthly')
        .reduce((sum, s) => sum + (s.salaryAmount || 0), 0),
    [staff],
  );

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/staff" title="Staff Roster" />

      <div className="space-y-6">
        {/* Compact Modern Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: 'var(--admin-text, #f3f4f6)' }}
            >
              Artisan & Staff Roster
            </h1>
            <p className="text-xs opacity-60">
              Master craftsmen, tailors, maggam artisans, and atelier workforce management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchStaff()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-current/[0.05] active:scale-98 cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Sync Roster</span>
            </button>
          </div>
        </div>

        {/* Pulse Metric Cards */}
        <StaffMetrics
          totalStaff={staff.length}
          activeStaff={activeCount}
          permanentCount={permanentCount}
          monthlyPayroll={monthlyPayroll}
        />

        {/* Single Row Toolbar */}
        <StaffToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          employmentFilter={employmentFilter}
          onEmploymentChange={setEmploymentFilter}
          specializationFilter={specializationFilter}
          onSpecializationChange={setSpecializationFilter}
          filteredCount={staff.length}
          totalCount={staff.length}
          onReset={handleResetFilters}
          onAddStaff={handleOpenCreate}
        />

        {/* Locked Fixed Grid Table */}
        <StaffTable
          items={staff}
          loading={loading}
          onPreview={(s) => setPreviewStaff(s)}
          onEdit={handleOpenEdit}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onNewStaff={handleOpenCreate}
        />
      </div>

      {/* Dossier Snapshot Modal */}
      <StaffPreviewModal
        staff={previewStaff}
        onClose={() => setPreviewStaff(null)}
        onEdit={(s) => {
          setPreviewStaff(null);
          handleOpenEdit(s);
        }}
      />

      {/* 3-Tab Creation & Edit Modal */}
      <StaffModalForm
        open={formOpen}
        staff={editingStaff}
        onClose={() => {
          setFormOpen(false);
          setEditingStaff(null);
        }}
        onSuccess={() => void fetchStaff()}
      />
    </>
  );
}
