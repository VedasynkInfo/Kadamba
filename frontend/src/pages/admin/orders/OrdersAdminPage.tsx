import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi, customersApi, type Order, type CustomerProfile } from '@/services/orders/orderService';
import { measurementApi, type MeasurementTemplate } from '@/services/measurements/measurementsService';
import { Button, Drawer, Input, Spinner } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'rush'>('normal');
  const [status, setStatus] = useState<string>('enquiry');
  const [expectedTrialAt, setExpectedTrialAt] = useState('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [totalQuoted, setTotalQuoted] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [initialNotes, setInitialNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Line items form state
  const [lineItems, setLineItems] = useState<Array<{ name: string; productTypeCode: string; notes: string; qty: number }>>([
    { name: '', productTypeCode: '', notes: '', qty: 1 }
  ]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);

  // Customer selection states
  const [customerMode, setCustomerMode] = useState<'search' | 'create'>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerProfile[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  
  // New customer inline states
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const searchTimeoutRef = useRef<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
      });
      setOrders(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to list orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [pagination.page, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await measurementApi.listTemplates({ active: true });
        setTemplates(data.items);
      } catch (err) {
        console.error('Failed to load templates', err);
      }
    };
    void loadTemplates();
  }, []);

  // Search customers autocomplete
  const handleCustomerSearchChange = (val: string) => {
    setCustomerSearch(val);
    setSelectedCustomer(null);
    if (!val.trim()) {
      setCustomerResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    setSearchingCustomers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await customersApi.list({ q: val, limit: 5 });
        setCustomerResults(data.items);
      } catch (err) {
        console.error('Failed to search customers', err);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
  };

  const handleSelectCustomer = (cust: CustomerProfile) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setCustomerResults([]);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: '', productTypeCode: '', notes: '', qty: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, key: string, val: any) => {
    const next = [...lineItems];
    next[index] = { ...next[index], [key]: val };
    
    // Auto fill name if selecting a template code and name is empty
    if (key === 'productTypeCode' && val) {
      const template = templates.find((t) => t.code === val);
      if (template && !next[index].name) {
        next[index].name = template.name;
      }
    }
    
    setLineItems(next);
  };

  const resetForm = () => {
    setTitle('');
    setPriority('normal');
    setStatus('enquiry');
    setExpectedTrialAt('');
    setExpectedDeliveryAt('');
    setTotalQuoted('0');
    setAdvance('0');
    setInitialNotes('');
    setTagsInput('');
    setLineItems([{ name: '', productTypeCode: '', notes: '', qty: 1 }]);
    setCustomerMode('search');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerResults([]);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustCity('');
    setNewCustNotes('');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;

      // 1. Create customer if inline create mode
      if (customerMode === 'create') {
        if (!newCustName.trim()) {
          alert('Customer name is required');
          setSubmitting(false);
          return;
        }
        const newCust = await customersApi.create({
          name: newCustName,
          phone: newCustPhone || undefined,
          email: newCustEmail || undefined,
          city: newCustCity || undefined,
          notes: newCustNotes || undefined,
        });
        customerId = newCust.id;
      }

      if (!customerId) {
        alert('Please select or create a customer');
        setSubmitting(false);
        return;
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // 2. Submit the order
      await ordersApi.create({
        customerId,
        title,
        status,
        priority,
        lineItems,
        expectedTrialAt: expectedTrialAt || undefined,
        expectedDeliveryAt: expectedDeliveryAt || undefined,
        tags,
        paymentSummary: {
          totalQuoted: parseFloat(totalQuoted) || 0,
          advance: parseFloat(advance) || 0,
        },
        notes: initialNotes || undefined,
      });

      setDrawerOpen(false);
      resetForm();
      void fetchOrders();
    } catch (err: any) {
      console.error('Failed to create order', err);
      alert(err.response?.data?.message || 'Failed to submit order. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.orders.title}
        copy={adminBanners.orders.copy}
        actionLabel={adminBanners.orders.actionLabel}
        onAction={() => setDrawerOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 mb-6">
          <div className="flex flex-1 min-w-[280px] max-w-md">
            <Input
              type="text"
              placeholder="Search by Reference ID, customer, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cream/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[150px] rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="All">All Statuses</option>
              <option value="enquiry">Enquiry</option>
              <option value="confirmed">Confirmed</option>
              <option value="measurements">Measurements</option>
              <option value="cutting">Cutting</option>
              <option value="stitching">Stitching</option>
              <option value="embroidery_maggam">Maggam Work</option>
              <option value="trial">Trial/Fitting</option>
              <option value="finishing">Finishing</option>
              <option value="delivery">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="on_hold">On Hold</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-[130px] rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="rush">Rush</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Spinner size="lg" label="Loading orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-black/10 border-dashed rounded-lg bg-cream/20 p-8 text-center">
            <span className="text-3xl mb-3">🪡</span>
            <h3 className="font-heading text-lg text-black">No orders found</h3>
            <p className="text-xs text-black/55 mt-1 max-w-[280px]">
              Try resetting your search query or filters, or create a brand new custom order.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => setDrawerOpen(true)}>
              New order
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-black/10 rounded-md overflow-hidden bg-cream">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/5 text-[0.65rem] uppercase tracking-wider text-black/60">
                      <th className="px-4 py-3.5 font-semibold">Reference / ID</th>
                      <th className="px-4 py-3.5 font-semibold">Client Details</th>
                      <th className="px-4 py-3.5 font-semibold">Order Title</th>
                      <th className="px-4 py-3.5 font-semibold">Status</th>
                      <th className="px-4 py-3.5 font-semibold">Priority</th>
                      <th className="px-4 py-3.5 font-semibold">Delivery Date</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Balance</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-black/[0.01] transition-colors">
                        <td className="px-4 py-3.5">
                          {order.referenceId ? (
                            <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-black hover:underline">
                              {order.referenceId}
                            </Link>
                          ) : (
                            <Link to={`/admin/orders/${order.id}`} className="text-xs font-medium text-black/55 hover:underline">
                              Enquiry (#{order.orderNumber})
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-black block text-sm">{order.customerId.name}</span>
                          <span className="text-[10px] text-black/45 block mt-0.5">{order.customerId.phone}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-black/75 max-w-[200px] truncate">
                          {order.title}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border uppercase tracking-wider',
                              order.status === 'enquiry' && 'bg-zinc-50 text-zinc-700 border-zinc-200',
                              order.status === 'confirmed' && 'bg-blue-50 text-blue-800 border-blue-200',
                              order.status === 'measurements' && 'bg-purple-50 text-purple-800 border-purple-200',
                              order.status === 'cutting' && 'bg-orange-50 text-orange-800 border-orange-200',
                              order.status === 'stitching' && 'bg-indigo-50 text-indigo-800 border-indigo-200',
                              order.status === 'embroidery_maggam' && 'bg-pink-50 text-pink-800 border-pink-200',
                              order.status === 'trial' && 'bg-amber-50 text-amber-800 border-amber-200',
                              order.status === 'finishing' && 'bg-teal-50 text-teal-800 border-teal-200',
                              order.status === 'delivery' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                              order.status === 'cancelled' && 'bg-rose-50 text-rose-800 border-rose-200',
                              order.status === 'on_hold' && 'bg-yellow-50 text-yellow-800 border-yellow-200',
                            )}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={cn(
                              'font-semibold text-[10px] uppercase tracking-wider',
                              order.priority === 'rush' && 'text-rose-600',
                              order.priority === 'high' && 'text-amber-600',
                              order.priority === 'normal' && 'text-black/55',
                            )}
                          >
                            {order.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-black/60">
                          {order.expectedDeliveryAt ? (
                            new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-black/35">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-xs">
                          {order.paymentSummary.balance > 0 ? (
                            <span className="text-rose-700">₹{order.paymentSummary.balance}</span>
                          ) : (
                            <span className="text-emerald-700">Paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center text-xs font-semibold hover:underline text-black"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-black/10 pt-4">
                <span className="text-xs text-black/50">
                  Showing page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Order Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
        title="Create custom order"
      >
        <form onSubmit={handleSubmitOrder} className="space-y-6 pb-20">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Customer record
            </label>
            <div className="flex border-b border-black/10 pb-4 mb-4">
              <button
                type="button"
                className={cn(
                  'flex-1 text-center py-2 text-xs font-medium border border-black/15 transition',
                  customerMode === 'search' ? 'bg-black text-cream border-black' : 'text-black/60 bg-cream/40 hover:bg-cream/70',
                )}
                onClick={() => setCustomerMode('search')}
              >
                Search Client
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 text-center py-2 text-xs font-medium border-t border-b border-r border-black/15 transition',
                  customerMode === 'create' ? 'bg-black text-cream border-black' : 'text-black/60 bg-cream/40 hover:bg-cream/70',
                )}
                onClick={() => setCustomerMode('create')}
              >
                New Client inline
              </button>
            </div>

            {customerMode === 'search' ? (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type customer name, phone, email..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                />
                {searchingCustomers && (
                  <div className="absolute right-3 top-3">
                    <Spinner size="sm" />
                  </div>
                )}
                {customerResults.length > 0 && (
                  <ul className="absolute z-15 left-0 right-0 mt-1 bg-white border border-black/10 rounded shadow-md max-h-[200px] overflow-y-auto divide-y divide-black/5">
                    {customerResults.map((cust) => (
                      <li key={cust.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-black/5 flex justify-between items-center"
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <div>
                            <span className="font-semibold text-black block">{cust.name}</span>
                            <span className="text-[10px] text-black/50 block mt-0.5">{cust.phone}</span>
                          </div>
                          {cust.city && (
                            <span className="text-[10px] text-black/50 bg-black/5 px-2 py-0.5 rounded">
                              {cust.city}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-black/5 rounded border border-black/10 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold block">{selectedCustomer.name}</span>
                      <span className="text-black/60 block mt-0.5">{selectedCustomer.phone} · {selectedCustomer.email || 'No email'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-black/40 hover:text-black font-semibold uppercase tracking-wider text-[10px]"
                    >
                      Deselect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Full name *"
                  required={customerMode === 'create'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                  />
                </div>
                <Input
                  type="text"
                  placeholder="City"
                  value={newCustCity}
                  onChange={(e) => setNewCustCity(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Client description notes (e.g. bride, preferred styles)"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Order title
            </label>
            <Input
              type="text"
              placeholder="e.g. Bridal Lehenga + Blouse Set - Ananya"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Order status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="enquiry">Enquiry (Unconfirmed)</option>
                <option value="confirmed">Confirmed (Reference ID Issued)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Order Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="rush">Rush / Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55">
                Garments / Product Line Items *
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-[10px] font-semibold text-black uppercase tracking-wider hover:underline"
              >
                + Add garment
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="p-4 bg-cream border border-black/10 rounded-sm space-y-3 relative">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="absolute right-3 top-3 text-black/40 hover:text-rose-600 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase text-black/50 mb-1">
                        Garment type
                      </label>
                      <select
                        value={item.productTypeCode}
                        onChange={(e) => handleLineItemChange(index, 'productTypeCode', e.target.value)}
                        className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="">Select template type...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.code}>
                            {t.name} ({t.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-black/50 mb-1">
                        Qty
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleLineItemChange(index, 'qty', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-black/50 mb-1">
                      Custom item name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Designer Embroidered Blouse"
                      required
                      value={item.name}
                      onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-black/50 mb-1">
                      Fabric & design instructions
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. heavy red raw silk, client provides fabric"
                      value={item.notes}
                      onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Expected trial date
              </label>
              <Input
                type="date"
                value={expectedTrialAt}
                onChange={(e) => setExpectedTrialAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Expected delivery date
              </label>
              <Input
                type="date"
                value={expectedDeliveryAt}
                onChange={(e) => setExpectedDeliveryAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Total quoted amount (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={totalQuoted}
                onChange={(e) => setTotalQuoted(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Advance paid (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Tags (comma separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. bridal, heavy work, referral"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Initial internal notes
            </label>
            <Input
              type="text"
              placeholder="e.g. client requested heavy work on sleeves only"
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-black/10">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={submitting}
              onClick={() => {
                setDrawerOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
