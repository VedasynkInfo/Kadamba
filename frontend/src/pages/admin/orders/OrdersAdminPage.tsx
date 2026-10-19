import { useState, useEffect, useRef, useMemo } from 'react';
import { ordersApi, customersApi, type Order, type CustomerProfile } from '@/services/orders/orderService';
import { useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { OrdersMetrics } from './OrdersMetrics';
import { OrdersToolbar } from './OrdersToolbar';
import { OrdersTable } from './OrdersTable';
import { OrderPreviewModal } from './OrderPreviewModal';
import { OrderCreateModal } from './OrderCreateModal';
import { createBlankOrderForm, orderStatusLabel, type OrderFormData, type OrdersMetricsData } from './types';
import type { OrderStatus } from '@/shared/enums';
import { toAppError } from '@/lib/apiError';

export default function OrdersAdminPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderFormData>(createBlankOrderForm());
  const [submitting, setSubmitting] = useState(false);

  // Customer search for intake
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerProfile[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        priority: priorityFilter || undefined,
      });
      setOrders(data.items);
      setPagination(data.pagination);
    } catch {
      toast({ title: 'Failed to load orders', tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [pagination.page, statusFilter, priorityFilter, searchQuery]);

  // Debounced customer search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const data = await customersApi.list({ q: customerSearch.trim(), limit: 8 });
        setCustomerResults(data.items);
      } catch {
        // silent
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [customerSearch]);

  const metrics: OrdersMetricsData = useMemo(() => {
    const total = pagination.total || orders.length;
    const inProduction = orders.filter((o) =>
      ['cutting', 'stitching', 'embroidery_maggam', 'finishing'].includes(o.status),
    ).length;
    const rushOrders = orders.filter((o) => o.priority === 'rush' || o.priority === 'high').length;
    const readyForTrial = orders.filter((o) => o.status === 'trial').length;
    return { total, inProduction, rushOrders, readyForTrial };
  }, [orders, pagination.total]);

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'All' || priorityFilter);

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('');
  }

  async function handleCreateOrder() {
    if (!form.title.trim()) {
      toast({ title: 'Order title is required', tone: 'error' });
      return;
    }

    let customerId = form.selectedCustomer?.id;

    if (form.customerMode === 'create') {
      if (!form.newCustName.trim() || !form.newCustPhone.trim()) {
        toast({ title: 'Customer name & phone are required', tone: 'error' });
        return;
      }
      setSubmitting(true);
      try {
        const newCust = await customersApi.create({
          name: form.newCustName.trim(),
          phone: form.newCustPhone.trim(),
          email: form.newCustEmail.trim() || undefined,
          city: form.newCustCity.trim() || 'Kurnool',
          notes: form.newCustNotes.trim() || undefined,
        });
        customerId = newCust.id;
      } catch (err: any) {
        toast({ title: err.response?.data?.message || 'Failed to create customer', tone: 'error' });
        setSubmitting(false);
        return;
      }
    }

    if (!customerId) {
      toast({ title: 'Please select or create a customer', tone: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const validItems = form.lineItems.filter((i) => i.name.trim().length > 0);
      const tags = form.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await ordersApi.create({
        customerId,
        title: form.title.trim(),
        priority: form.priority,
        status: form.status,
        lineItems: validItems.length > 0 ? validItems : [{ name: form.title.trim(), qty: 1 }],
        expectedTrialAt: form.expectedTrialAt ? new Date(form.expectedTrialAt).toISOString() : undefined,
        expectedDeliveryAt: form.expectedDeliveryAt ? new Date(form.expectedDeliveryAt).toISOString() : undefined,
        paymentSummary: {
          totalQuoted: Number(form.totalQuoted) || 0,
          advance: Number(form.advance) || 0,
        },
        tags,
        notes: form.initialNotes.trim() || undefined,
      });

      toast({ title: 'Atelier order created successfully', tone: 'success' });
      setCreateOpen(false);
      setForm(createBlankOrderForm());
      setCustomerSearch('');
      void fetchOrders();
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to create order', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    try {
      await ordersApi.transitionStatus(orderId, nextStatus);
      toast({
        title: `Order moved to ${orderStatusLabel(nextStatus)}`,
        tone: 'success',
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)),
      );
      if (previewOrder?.id === orderId) {
        setPreviewOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err) {
      // The order may have moved since this desk loaded it; the machine's
      // refusal names the stages that are actually available.
      const error = toAppError(err);
      const detail = error.fieldErrors[0];
      toast({
        title: error.message,
        description: detail && detail !== error.message ? detail : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Atelier Production Orders"
        copy="Manage bespoke bridal commissions, assign artisan milestones, and track payment schedules."
        actionLabel="+ New Order"
        onAction={() => setCreateOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <OrdersMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <OrdersToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          filteredCount={orders.length}
          totalCount={pagination.total || orders.length}
          onNewOrder={() => setCreateOpen(true)}
        />

        {/* Modern Compact Table Card */}
        <OrdersTable
          items={orders}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onNewOrder={() => setCreateOpen(true)}
          onPreview={setPreviewOrder}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Quick Dossier Preview Modal */}
      <OrderPreviewModal
        order={previewOrder}
        onClose={() => setPreviewOrder(null)}
        onStatusChange={handleStatusChange}
      />

      {/* New Order Intake Modal */}
      <OrderCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        form={form}
        setForm={setForm}
        onSave={handleCreateOrder}
        submitting={submitting}
        customerSearch={customerSearch}
        onCustomerSearchChange={setCustomerSearch}
        customerResults={customerResults}
        searchingCustomers={searchingCustomers}
      />
    </div>
  );
}
