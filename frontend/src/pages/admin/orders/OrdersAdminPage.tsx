import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ordersApi, customersApi, type Order, type CustomerProfile } from '@/services/orders/orderService';
import { Pagination, useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { EmptyState } from '../components/EmptyState';
import { OrdersMetrics } from './OrdersMetrics';
import { OrdersToolbar } from './OrdersToolbar';
import { OrdersTable } from './OrdersTable';
import { OrderPreviewModal } from './OrderPreviewModal';
import { OrderCreateModal } from './OrderCreateModal';
import { createBlankOrderForm, orderStatusLabel, type OrderFormData, type OrdersMetricsData } from './types';
import { useCreateIntent } from '../hooks/useCreateIntent';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { downloadOrdersCsv } from './exportOrders';
import type { OrderStatus } from '@/shared/enums';
import { toAppError } from '@/lib/apiError';

/** Stable defaults: the saved-filter hook keeps this object as its reset shape. */
const ORDER_FILTER_DEFAULTS = { q: '', status: 'All', priority: '' };

/** Stable defaults: the wizard resets to this object whenever it opens. */
const BLANK_ORDER_FORM = createBlankOrderForm();

export default function OrdersAdminPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const { filters, setFilter, reset: resetSavedFilters } = useSavedFilters(
    'kadamba.orders.filters.v1',
    ORDER_FILTER_DEFAULTS,
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The palette can ask this desk to open its intake form.
  useCreateIntent(setCreateOpen);

  // Customer search for intake
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerProfile[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: filters.q || undefined,
        status: filters.status === 'All' ? undefined : filters.status,
        priority: filters.priority || undefined,
      });
      setOrders(data.items);
      setPagination(data.pagination);
    } catch {
      toast({ title: 'Failed to load orders', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.q, filters.status, filters.priority, toast]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

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

  const hasActiveFilters = Boolean(filters.q || filters.status !== 'All' || filters.priority);

  function updateFilter(key: keyof typeof ORDER_FILTER_DEFAULTS, value: string) {
    setFilter(key, value);
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
    setSelectedKeys([]);
  }

  function resetFilters() {
    resetSavedFilters();
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
    setSelectedKeys([]);
  }

  function handleBulkExport(keys: string[]) {
    const selected = orders.filter((order) => keys.includes(order.id));
    if (selected.length === 0) return;
    downloadOrdersCsv(selected, `orders-page-${pagination.page}.csv`);
    toast({
      title: `Exported ${selected.length} order${selected.length === 1 ? '' : 's'}`,
      description: 'The CSV is in your downloads.',
      tone: 'success',
    });
    setSelectedKeys([]);
  }

  async function handleCreateOrder(form: OrderFormData) {
    setSubmitting(true);
    try {
      let customerId = form.selectedCustomer?.id;

      if (form.customerMode === 'create') {
        const newCust = await customersApi.create({
          name: form.newCustName.trim(),
          phone: form.newCustPhone.trim(),
          email: form.newCustEmail.trim() || undefined,
          city: form.newCustCity.trim() || 'Kurnool',
          notes: form.newCustNotes.trim() || undefined,
        });
        customerId = newCust.id;
      }

      if (!customerId) {
        toast({ title: 'Please select or create a customer', tone: 'error' });
        return;
      }

      const tags = form.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await ordersApi.create({
        customerId,
        title: form.title.trim(),
        priority: form.priority,
        status: form.status,
        lineItems: form.lineItems.map((item) => ({
          name: item.name.trim(),
          notes: item.notes.trim() || undefined,
          qty: item.qty,
          productTypeCode: item.productTypeCode || undefined,
        })),
        expectedTrialAt: form.expectedTrialAt
          ? new Date(form.expectedTrialAt).toISOString()
          : undefined,
        expectedDeliveryAt: form.expectedDeliveryAt
          ? new Date(form.expectedDeliveryAt).toISOString()
          : undefined,
        paymentSummary: {
          totalQuoted: Number(form.totalQuoted) || 0,
          advance: Number(form.advance) || 0,
        },
        tags,
        notes: form.initialNotes.trim() || undefined,
      });

      toast({ title: 'Atelier order created successfully', tone: 'success' });
      setCreateOpen(false);
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
          query={filters.q}
          onQueryChange={(value) => updateFilter('q', value)}
          selectedStatus={filters.status}
          onStatusChange={(value) => updateFilter('status', value)}
          selectedPriority={filters.priority}
          onPriorityChange={(value) => updateFilter('priority', value)}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          filteredCount={orders.length}
          totalCount={pagination.total || orders.length}
          onNewOrder={() => setCreateOpen(true)}
        />

        {/* Orders table: virtualised rows, saved filters, selection + bulk export */}
        <OrdersTable
          items={orders}
          loading={loading}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          onBulkExport={handleBulkExport}
          onPreview={setPreviewOrder}
          emptyState={
            <div className="p-4">
              <EmptyState
                title="No orders found"
                description={
                  hasActiveFilters
                    ? 'No studio commissions match the active search or filters.'
                    : 'Create bridal couture orders, record measurements, and track production workflows.'
                }
                actionLabel={hasActiveFilters ? 'Clear Filters' : '+ New Order'}
                onAction={hasActiveFilters ? resetFilters : () => setCreateOpen(true)}
              />
            </div>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/65">
            Page {pagination.page} of {pagination.pages} · {pagination.total} orders
          </p>
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => {
              setPagination((current) => ({ ...current, page }));
              setSelectedKeys([]);
            }}
          />
        </div>
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
        defaultValues={BLANK_ORDER_FORM}
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
