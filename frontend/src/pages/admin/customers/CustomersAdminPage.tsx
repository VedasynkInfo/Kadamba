import { useState, useEffect, useCallback, useMemo } from 'react';
import { customerApi, type Customer } from '@/services/customers/customerService';
import { Modal, Button, useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { CustomersMetrics } from './CustomersMetrics';
import { CustomersToolbar } from './CustomersToolbar';
import { CustomersTable } from './CustomersTable';
import { CustomerPreviewModal } from './CustomerPreviewModal';
import { CustomerModalForm } from './CustomerModalForm';
import { createEmptyCustomerForm, type CustomerFormData } from './types';
import { useCreateIntent } from '../hooks/useCreateIntent';

export default function CustomersAdminPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [portalFilter, setPortalFilter] = useState('');
  const [openOrdersFilter, setOpenOrdersFilter] = useState('');

  // Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CustomerFormData>(createEmptyCustomerForm());

  // The palette can ask this desk to open its create form.
  useCreateIntent(setModalOpen);

  // Duplicate detection modal
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupCustomer, setDupCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery,
        source: sourceFilter || undefined,
        portalStatus: portalFilter || undefined,
        hasOpenOrders: openOrdersFilter || undefined,
      });
      setCustomers(data.items);
      setPagination(data.pagination);
    } catch {
      toast({ title: 'Failed to load customer registry', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, sourceFilter, portalFilter, openOrdersFilter, toast]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const metrics = useMemo(() => {
    const total = pagination.total;
    const portalActive = customers.filter((c) => c.portalStatus === 'active').length;
    const hasOpenOrders = customers.filter((c) => (c.orderCount || 0) > 0).length;
    const repeatClients = customers.filter((c) => c.tags?.includes('VIP') || c.tags?.includes('repeat')).length;
    return { total, portalActive, hasOpenOrders, repeatClients };
  }, [customers, pagination.total]);

  const hasActiveFilters = Boolean(searchQuery || sourceFilter || portalFilter || openOrdersFilter);

  function resetFilters() {
    setSearchQuery('');
    setSourceFilter('');
    setPortalFilter('');
    setOpenOrdersFilter('');
  }

  const handleCreateCustomer = async (e?: React.FormEvent, forceBypass = false) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: 'Name and Phone number are required.', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const tags = form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

      await customerApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        address: {
          line1: form.line1.trim() || undefined,
          line2: form.line2.trim() || undefined,
          landmark: form.landmark.trim() || undefined,
          locality: form.locality.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
        },
        source: form.source,
        tags,
        notes: form.notes.trim() || undefined,
        force: forceBypass || undefined,
      });

      toast({ title: 'Customer profile registered', tone: 'success' });
      setModalOpen(false);
      setDupModalOpen(false);
      setDupCustomer(null);
      setForm(createEmptyCustomerForm());
      void fetchCustomers();
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { duplicateFound?: boolean; data?: { id: string; name: string; phone: string }; message?: string } } };
      if (apiErr.response?.status === 409 && apiErr.response?.data?.duplicateFound) {
        setDupCustomer(apiErr.response.data.data || null);
        setDupModalOpen(true);
      } else {
        toast({
          title: apiErr.response?.data?.message || 'Registration failed',
          tone: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Client Registry & Profiles"
        copy="Manage bespoke client directory, measurement profiles, portal credentials, and bridal order records."
        actionLabel="+ Register Client"
        onAction={() => setModalOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <CustomersMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <CustomersToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedSource={sourceFilter}
          onSourceChange={setSourceFilter}
          selectedPortal={portalFilter}
          onPortalChange={setPortalFilter}
          selectedOrders={openOrdersFilter}
          onOrdersChange={setOpenOrdersFilter}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          filteredCount={customers.length}
          totalCount={pagination.total}
          onNewCustomer={() => setModalOpen(true)}
        />

        {/* Modern Compact Table Card */}
        <CustomersTable
          items={customers}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onNewCustomer={() => setModalOpen(true)}
          onPreview={setPreviewCustomer}
        />
      </div>

      {/* Quick Customer Preview Modal */}
      <CustomerPreviewModal
        customer={previewCustomer}
        onClose={() => setPreviewCustomer(null)}
      />

      {/* Register Client Modal (Replaces Drawer) */}
      <CustomerModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        onSave={handleCreateCustomer}
        saving={submitting}
      />

      {/* Duplicate Customer Conflict Dialog */}
      <Modal
        open={dupModalOpen}
        onClose={() => setDupModalOpen(false)}
        title="Potential Duplicate Client Found"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDupModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCreateCustomer(undefined, true)}
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Yes, Register Duplicate Profile'}
            </Button>
          </div>
        }
      >
        <p className="text-sm opacity-80 leading-relaxed">
          A client with phone number <strong className="font-mono text-inherit">{form.phone}</strong> already exists in the atelier registry ({dupCustomer?.name}, Code: {dupCustomer?.id}).
        </p>
        <p className="text-sm opacity-70 mt-2">
          Do you want to create a separate client record anyway, or cancel and merge?
        </p>
      </Modal>
    </div>
  );
}
