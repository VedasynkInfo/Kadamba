import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { ordersApi, type Order, type OrderStaff } from '@/services/orders/orderService';
import { measurementApi, type MeasurementProfile } from '@/services/measurements/measurementsService';
import { financeApi } from '@/services/finance/financeService';
import { Button, Input, Spinner, useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { OrderFinancialModal } from './OrderFinancialModal';
import { OrderStaffModal } from './OrderStaffModal';
import { OrderStatusModal } from './OrderStatusModal';
import { OrderMeasurementsModal } from './OrderMeasurementsModal';
import { OrderTimelineSection } from './OrderTimelineSection';
import { isOrderStatusTerminal, type OrderStatus } from '@/shared/enums';
import { orderStatusChoices, orderStatusLabel, transitionNeedsNote } from './types';
import { toAppError } from '@/lib/apiError';

export default function OrderDetailAdminPage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Note addition state
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'internal' | 'customer'>('internal');
  const [addingNote, setAddingNote] = useState(false);

  // Status transition states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Staff assignment states
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<OrderStaff[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'cutter' | 'stitcher' | 'maggam' | 'finishing' | 'designer'>('cutter');
  const [savingStaff, setSavingStaff] = useState(false);

  // Payment states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [totalQuoted, setTotalQuoted] = useState('0');
  const [totalPaid, setTotalPaid] = useState('0');
  const [savingPayment, setSavingPayment] = useState(false);
  // Payment recording fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank' | 'card' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<'record' | 'adjust'>('record');

  // Measurement link states
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<MeasurementProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [linkingProfile, setLinkingProfile] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const data = await ordersApi.get(id);
      setOrder(data);
      setAssignedStaff(data.assignedStaff || []);
      setTotalQuoted(String(data.paymentSummary.totalQuoted));
      setTotalPaid(String(data.paymentSummary.totalPaid));
    } catch (err) {
      console.error('Failed to get order details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchOrder();
  }, [id]);

  // Load customer measurement profiles for linking
  const loadCustomerProfiles = async () => {
    if (!order?.customerId?.id) return;
    setLoadingProfiles(true);
    try {
      const data = await measurementApi.list({ customerId: order.customerId.id });
      setAvailableProfiles(data.items);
    } catch (err) {
      console.error('Failed to load customer profiles', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleStatusChangeRequest = (statusVal: OrderStatus) => {
    setNextStatus(statusVal);

    // Cancelling, pausing, or sending the order backwards asks for a reason
    // first (see `transitionNeedsNote`).
    if (transitionNeedsNote(order?.status ?? '', statusVal)) {
      setTransitionNote('');
      setStatusModalOpen(true);
    } else {
      void executeStatusTransition(statusVal, '');
    }
  };

  const executeStatusTransition = async (statusVal: OrderStatus, noteVal: string) => {
    if (!id) return;
    setTransitioning(true);
    try {
      const updated = await ordersApi.transitionStatus(id, statusVal, noteVal);
      setOrder(updated);
      setStatusModalOpen(false);
    } catch (err) {
      // The machine's refusal names the stages that *are* allowed; showing it
      // turns "failed" into "here is what you can do".
      const error = toAppError(err);
      const detail = error.fieldErrors[0];
      toast({
        title: error.message,
        description: detail && detail !== error.message ? detail : undefined,
        tone: 'error',
      });
    } finally {
      setTransitioning(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteBody.trim()) return;
    setAddingNote(true);
    try {
      const updated = await ordersApi.addNote(id, noteBody.trim(), noteVisibility);
      setOrder(updated);
      setNoteBody('');
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to add note', tone: 'error' });
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddStaffMember = () => {
    if (!newStaffName.trim()) return;
    setAssignedStaff([...assignedStaff, { name: newStaffName.trim(), role: newStaffRole }]);
    setNewStaffName('');
  };

  const handleRemoveStaffMember = (index: number) => {
    setAssignedStaff(assignedStaff.filter((_, i) => i !== index));
  };

  const handleSaveStaff = async () => {
    if (!id) return;
    setSavingStaff(true);
    try {
      const updated = await ordersApi.assignStaff(id, assignedStaff);
      setOrder(updated);
      setStaffModalOpen(false);
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to assign staff', tone: 'error' });
    } finally {
      setSavingStaff(false);
    }
  };

  const handleSavePayments = async () => {
    if (!id) return;
    setSavingPayment(true);
    try {
      if (paymentMode === 'record') {
        // Record a real payment transaction
        if (!paymentAmount || Number(paymentAmount) <= 0) {
          toast({ title: 'Enter a valid payment amount', tone: 'error' });
          setSavingPayment(false);
          return;
        }
        await financeApi.recordPayment({
          orderId: id,
          amount: Number(paymentAmount),
          method: paymentMethod,
          reference: paymentReference.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
          paidAt: new Date(paymentDate).toISOString(),
        });
        // Refresh order to get updated paymentSummary
        const updated = await ordersApi.get(id);
        setOrder(updated);
        setTotalQuoted(String(updated.paymentSummary.totalQuoted));
        setTotalPaid(String(updated.paymentSummary.totalPaid));
      } else {
        // Adjust quoted total only
        const updated = await ordersApi.update(id, {
          paymentSummary: {
            totalQuoted: parseFloat(totalQuoted) || 0,
            totalPaid: parseFloat(totalPaid) || 0,
          },
        });
        setOrder(updated);
      }
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to update financials', tone: 'error' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleLinkProfile = async (profileId: string) => {
    if (!id || !order) return;
    setLinkingProfile(true);
    try {
      const alreadyLinked = order.measurementProfileIds || [];
      const updatedList = alreadyLinked.includes(profileId)
        ? alreadyLinked.filter((p) => p !== profileId)
        : [...alreadyLinked, profileId];

      const updated = await ordersApi.linkMeasurements(id, updatedList);
      setOrder(updated);
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to link profile', tone: 'error' });
    } finally {
      setLinkingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <Spinner size="lg" label="Retrieving order workspace..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h3 className="font-heading text-xl text-ink">Order not found</h3>
        <p className="text-ink/55 text-xs mt-2">The requested order workspace could not be resolved.</p>
        <Link to="/admin/orders" className="text-xs font-semibold hover:underline block mt-4 text-ink">
          <Icon name="arrowLeft" size={14} className="mr-1 inline align-middle" /> Back to orders desk
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={order.referenceId || `Order Enquiry #${order.orderNumber}`}
        copy={adminBanners.orderDetail.copy}
        actionLabel={adminBanners.orderDetail.actionLabel}
        actionTo={adminBanners.orderDetail.actionTo}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main workspace (Takes 2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header / Info Panel */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-heading text-lg text-ink">{order.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'text-[10px] uppercase font-semibold border px-2 py-0.5 rounded',
                        order.priority === 'rush' ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm' : 'bg-surface-sunken text-ink/60 border-line',
                      )}
                    >
                      {order.priority} priority
                    </span>
                    {order.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-surface-sunken text-ink/55 border border-line px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-ink/70">Atelier lifecycle</span>
                  {isOrderStatusTerminal(order.status) ? (
                    <>
                      <span className="mt-1 text-xs font-semibold uppercase text-ink/70">
                        {orderStatusLabel(order.status)}
                      </span>
                      <span className="text-[10px] text-ink/70">
                        Lifecycle complete — no further stages
                      </span>
                    </>
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChangeRequest(e.target.value as OrderStatus)}
                      aria-label="Move the order to its next stage"
                      className="mt-1 min-w-[150px] uppercase text-xs font-semibold rounded-md border border-line bg-surface-field px-3 py-2 text-ink focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30"
                    >
                      {/* Only the moves the API will accept are offered, so an
                          impossible stage cannot be chosen and then refused. */}
                      <option value={order.status} disabled>
                        {orderStatusLabel(order.status)} (current)
                      </option>
                      {orderStatusChoices(order.status).map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-line pt-4 text-xs">
                <div>
                  <span className="text-ink/70 block">Expected trial</span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {order.expectedTrialAt ? new Date(order.expectedTrialAt).toLocaleDateString('en-IN') : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-ink/70 block">Expected delivery</span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {order.expectedDeliveryAt ? new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN') : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-ink/70 block">Created</span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-ink/70 block">Last update</span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {new Date(order.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Details */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <h3 className="font-heading text-lg text-ink mb-4 border-b border-line pb-2">Workshop garments</h3>
              <div className="space-y-4">
                {order.lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between gap-4 p-4 border border-line bg-white/40 rounded-sm">
                    <div>
                      <span className="font-medium text-ink text-sm block">
                        {item.name} <span className="text-xs text-ink/55 font-normal">({item.qty} Qty)</span>
                      </span>
                      {item.notes && <p className="text-xs text-ink/60 mt-1">{item.notes}</p>}
                    </div>
                    {item.productTypeCode && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-ink/70 bg-surface-sunken px-2.5 py-1 self-start rounded-sm">
                        {item.productTypeCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Measurements Profiles */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <div className="flex justify-between items-center mb-4 border-b border-line pb-2">
                <h3 className="font-heading text-lg text-ink">Client measurements</h3>
                <button
                  type="button"
                  onClick={() => {
                    void loadCustomerProfiles();
                    setMeasureModalOpen(true);
                  }}
                  className="text-xs font-semibold text-ink hover:underline uppercase tracking-wider"
                >
                  Link profile
                </button>
              </div>

              {order.measurementProfileIds.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink/70">
                  No measurement profile linked to this order. Linking a profile ensures stitching accuracy.
                  <button
                    type="button"
                    onClick={() => {
                      void loadCustomerProfiles();
                      setMeasureModalOpen(true);
                    }}
                    className="text-xs font-semibold text-ink hover:underline block mx-auto mt-2"
                  >
                    Link profile now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.measurementProfileIds.map((pid) => (
                    <div key={pid} className="flex justify-between items-center p-3.5 border border-line bg-white/45 rounded-sm text-xs">
                      <div>
                        <span className="font-semibold block">Profile ID: {pid.slice(-6).toUpperCase()}</span>
                        <span className="text-ink/55 mt-0.5 block">Linked to this tailor card</span>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          to="/admin/measurements"
                          className="font-semibold text-ink hover:underline uppercase text-[10px] tracking-wider"
                        >
                          Open book
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleLinkProfile(pid)}
                          className="font-semibold text-rose-700 hover:text-rose-900 uppercase text-[10px] tracking-wider"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes & Customer Messaging */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <h3 className="font-heading text-lg text-ink mb-4 border-b border-line pb-2">Internal studio log</h3>
              
              {/* Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Record an update, adjustment, thread matching details..."
                  required
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="bg-surface-raised"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-ink/55">
                      <input
                        type="radio"
                        name="note-vis"
                        checked={noteVisibility === 'internal'}
                        onChange={() => setNoteVisibility('internal')}
                      />
                      Internal note (staff only)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink/55">
                      <input
                        type="radio"
                        name="note-vis"
                        checked={noteVisibility === 'customer'}
                        onChange={() => setNoteVisibility('customer')}
                      />
                      Customer facing note
                    </label>
                  </div>
                  <Button type="submit" size="sm" disabled={addingNote}>
                    {addingNote ? 'Adding...' : 'Post note'}
                  </Button>
                </div>
              </form>

              {/* Feed */}
              <div className="mt-6 space-y-4">
                {order.notes.length === 0 ? (
                  <p className="text-xs text-ink/70 text-center py-4">No internal notes posted yet.</p>
                ) : (
                  [...order.notes].reverse().map((note, idx) => (
                    <div key={idx} className="p-3 bg-white/45 border border-line rounded text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-ink/70">
                        <span className="font-semibold">{note.createdBy}</span>
                        <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-ink/85 whitespace-pre-wrap">{note.body}</p>
                      <span
                        className={cn(
                          'inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded',
                          note.visibility === 'internal' ? 'bg-zinc-100 text-zinc-600' : 'bg-blue-50 text-blue-600',
                        )}
                      >
                        {note.visibility === 'internal' ? 'Internal' : 'Customer Viewable'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Ops panel (Takes 1/3 width) */}
          <div className="space-y-8">
            {/* Customer Details Card */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <h3 className="font-heading text-lg text-ink mb-4 border-b border-line pb-2">Client profile</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-ink/70 block">Name</span>
                  <span className="font-medium text-ink mt-0.5 block">{order.customerId.name}</span>
                </div>
                <div>
                  <span className="text-ink/70 block">Phone</span>
                  <span className="font-medium text-ink mt-0.5 block">{order.customerId.phone}</span>
                </div>
                {order.customerId.email && (
                  <div>
                    <span className="text-ink/70 block">Email</span>
                    <span className="font-medium text-ink mt-0.5 block">{order.customerId.email}</span>
                  </div>
                )}
                {order.customerId.city && (
                  <div>
                    <span className="text-ink/70 block">City</span>
                    <span className="font-medium text-ink mt-0.5 block">{order.customerId.city}</span>
                  </div>
                )}
                {order.leadId && (
                  <div>
                    <span className="text-ink/70 block">Lead Link</span>
                    <Link to={`/admin/leads/${order.leadId}`} className="font-semibold text-ink hover:underline block mt-0.5">
                      Open original crm lead <Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> 
                    </Link>
                  </div>
                )}
                {order.customerId.phone ? (
                  <a
                    href={whatsappDeepLink(
                      order.customerId.phone,
                      `Hi ${order.customerId.name}, this is Kadamba's Designer Studio regarding order #${order.orderNumber}${order.referenceId ? ` (${order.referenceId})` : ''}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-sm border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-100"
                  >
                    WhatsApp client
                  </a>
                ) : null}
              </div>
            </div>

            {/* Financial Tracker */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <div className="flex gap-3 items-center mb-4 border-b border-line pb-2">
                <h3 className="font-heading text-lg text-ink flex-1">Financial ledger</h3>
                <button
                  type="button"
                  onClick={() => { setPaymentMode('record'); setPaymentModalOpen(true); }}
                  className="text-xs font-semibold text-emerald-700 hover:underline uppercase tracking-wider"
                >
                  + Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMode('adjust'); setPaymentModalOpen(true); }}
                  className="text-xs font-semibold text-ink/70 hover:underline uppercase tracking-wider"
                >
                  Adjust
                </button>
                <Link
                  to={`/admin/invoices/${order.id}`}
                  className="text-xs font-semibold text-gold hover:underline uppercase tracking-wider"
                >
                  View invoice
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink/55">Total Quoted</span>
                  <span className="font-medium">₹{order.paymentSummary.totalQuoted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/55">Advance Paid</span>
                  <span className="font-medium text-emerald-700">₹{order.paymentSummary.advance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/55">Total Paid</span>
                  <span className="font-medium text-emerald-700">₹{order.paymentSummary.totalPaid}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 font-semibold">
                  <span className="text-ink/85">Outstanding Balance</span>
                  <span className={cn(order.paymentSummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700')}>
                    ₹{order.paymentSummary.balance}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Assignments */}
            <div className="rounded-lg border border-line bg-surface-raised p-6">
              <div className="flex justify-between items-center mb-4 border-b border-line pb-2">
                <h3 className="font-heading text-lg text-ink">Staff assignments</h3>
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(true)}
                  className="text-xs font-semibold text-ink hover:underline uppercase tracking-wider"
                >
                  Manage
                </button>
              </div>

              {order.assignedStaff.length === 0 ? (
                <p className="text-xs text-ink/70 text-center py-3">No staff assigned to this order.</p>
              ) : (
                <div className="space-y-2">
                  {order.assignedStaff.map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border border-line bg-white/40 rounded text-xs">
                      <span className="font-medium text-ink">{staff.name}</span>
                      <span className="text-[10px] uppercase font-semibold text-ink/70 tracking-wider">
                        {staff.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workshop Production Timeline */}
            <OrderTimelineSection timeline={order.timeline} />
          </div>
        </div>
      </div>

      {/* Transition note Modal */}
      <OrderStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        nextStatus={nextStatus}
        transitionNote={transitionNote}
        setTransitionNote={setTransitionNote}
        transitioning={transitioning}
        onTransition={executeStatusTransition}
      />

      {/* Staff assignment Modal */}
      <OrderStaffModal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        assignedStaff={assignedStaff}
        newStaffName={newStaffName}
        setNewStaffName={setNewStaffName}
        newStaffRole={newStaffRole}
        setNewStaffRole={setNewStaffRole}
        onAddStaffMember={handleAddStaffMember}
        onRemoveStaffMember={handleRemoveStaffMember}
        onSaveStaff={handleSaveStaff}
        savingStaff={savingStaff}
      />

      {/* Financials Modal */}
      <OrderFinancialModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentMode={paymentMode}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
        totalQuoted={totalQuoted}
        setTotalQuoted={setTotalQuoted}
        currentBalance={order?.paymentSummary.balance ?? 0}
        savingPayment={savingPayment}
        onSave={handleSavePayments}
      />

      {/* Measurements Link Modal */}
      <OrderMeasurementsModal
        open={measureModalOpen}
        onClose={() => setMeasureModalOpen(false)}
        availableProfiles={availableProfiles}
        linkedProfileIds={order.measurementProfileIds || []}
        loadingProfiles={loadingProfiles}
        linkingProfile={linkingProfile}
        onLinkProfile={handleLinkProfile}
      />
    </>
  );
}
