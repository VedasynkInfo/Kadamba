import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi, type Order, type OrderStaff } from '@/services/orders/orderService';
import { measurementApi, type MeasurementProfile } from '@/services/measurements/measurementsService';
import { financeApi } from '@/services/finance/financeService';
import { Button, Input, Spinner, Modal } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';
import { whatsappDeepLink } from '@/utils/whatsapp';

const ORDER_STATUS_FLOW = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
];

const STAFF_ROLES = [
  { value: 'designer', label: 'Designer' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'stitcher', label: 'Stitcher' },
  { value: 'maggam', label: 'Maggam / Embroidery' },
  { value: 'finishing', label: 'Finishing / Pico' },
] as const;

export default function OrderDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Note addition state
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'internal' | 'customer'>('internal');
  const [addingNote, setAddingNote] = useState(false);

  // Status transition states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>('');
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

  const handleStatusChangeRequest = (statusVal: string) => {
    setNextStatus(statusVal);
    
    // Check if status requires note popup: cancelled, on_hold, or moving backward in flow
    const currentIdx = ORDER_STATUS_FLOW.indexOf(order?.status || '');
    const nextIdx = ORDER_STATUS_FLOW.indexOf(statusVal);
    const movingBackward = currentIdx >= 0 && nextIdx >= 0 && nextIdx < currentIdx;

    if (statusVal === 'cancelled' || statusVal === 'on_hold' || movingBackward) {
      setTransitionNote('');
      setStatusModalOpen(true);
    } else {
      void executeStatusTransition(statusVal, '');
    }
  };

  const executeStatusTransition = async (statusVal: string, noteVal: string) => {
    if (!id) return;
    setTransitioning(true);
    try {
      const updated = await ordersApi.transitionStatus(id, statusVal, noteVal);
      setOrder(updated);
      setStatusModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to transition status');
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
      alert(err.response?.data?.message || 'Failed to add note');
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
      alert(err.response?.data?.message || 'Failed to assign staff');
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
          alert('Enter a valid payment amount');
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
      alert(err.response?.data?.message || 'Failed to update financials');
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
      alert(err.response?.data?.message || 'Failed to link profile');
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
        <h3 className="font-heading text-xl text-black">Order not found</h3>
        <p className="text-black/55 text-xs mt-2">The requested order workspace could not be resolved.</p>
        <Link to="/admin/orders" className="text-xs font-semibold hover:underline block mt-4 text-black">
          ← Back to orders desk
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
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-heading text-lg text-black">{order.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'text-[10px] uppercase font-semibold border px-2 py-0.5 rounded',
                        order.priority === 'rush' ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm' : 'bg-black/5 text-black/60 border-black/10',
                      )}
                    >
                      {order.priority} priority
                    </span>
                    {order.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-black/5 text-black/55 border border-black/10 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-black/45">Atelier lifecycle</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChangeRequest(e.target.value)}
                    className="mt-1 min-w-[150px] uppercase text-xs font-semibold rounded-md border border-black/15 bg-cream px-3 py-2 text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="enquiry">Enquiry</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="measurements">Measurements</option>
                    <option value="cutting">Cutting</option>
                    <option value="stitching">Stitching</option>
                    <option value="embroidery_maggam">Maggam Work</option>
                    <option value="trial">Trial / Fitting</option>
                    <option value="finishing">Finishing</option>
                    <option value="delivery">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-black/5 pt-4 text-xs">
                <div>
                  <span className="text-black/45 block">Expected trial</span>
                  <span className="font-medium text-black mt-0.5 block">
                    {order.expectedTrialAt ? new Date(order.expectedTrialAt).toLocaleDateString('en-IN') : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-black/45 block">Expected delivery</span>
                  <span className="font-medium text-black mt-0.5 block">
                    {order.expectedDeliveryAt ? new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN') : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-black/45 block">Created</span>
                  <span className="font-medium text-black mt-0.5 block">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-black/45 block">Last update</span>
                  <span className="font-medium text-black mt-0.5 block">
                    {new Date(order.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Details */}
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <h3 className="font-heading text-lg text-black mb-4 border-b border-black/5 pb-2">Workshop garments</h3>
              <div className="space-y-4">
                {order.lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between gap-4 p-4 border border-black/15 bg-white/40 rounded-sm">
                    <div>
                      <span className="font-medium text-black text-sm block">
                        {item.name} <span className="text-xs text-black/55 font-normal">({item.qty} Qty)</span>
                      </span>
                      {item.notes && <p className="text-xs text-black/60 mt-1">{item.notes}</p>}
                    </div>
                    {item.productTypeCode && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-black/50 bg-black/5 px-2.5 py-1 self-start rounded-sm">
                        {item.productTypeCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Measurements Profiles */}
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-2">
                <h3 className="font-heading text-lg text-black">Client measurements</h3>
                <button
                  type="button"
                  onClick={() => {
                    void loadCustomerProfiles();
                    setMeasureModalOpen(true);
                  }}
                  className="text-xs font-semibold text-black hover:underline uppercase tracking-wider"
                >
                  Link profile
                </button>
              </div>

              {order.measurementProfileIds.length === 0 ? (
                <div className="text-center py-6 text-xs text-black/45">
                  No measurement profile linked to this order. Linking a profile ensures stitching accuracy.
                  <button
                    type="button"
                    onClick={() => {
                      void loadCustomerProfiles();
                      setMeasureModalOpen(true);
                    }}
                    className="text-xs font-semibold text-black hover:underline block mx-auto mt-2"
                  >
                    Link profile now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.measurementProfileIds.map((pid) => (
                    <div key={pid} className="flex justify-between items-center p-3.5 border border-black/10 bg-white/45 rounded-sm text-xs">
                      <div>
                        <span className="font-semibold block">Profile ID: {pid.slice(-6).toUpperCase()}</span>
                        <span className="text-black/55 mt-0.5 block">Linked to this tailor card</span>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          to="/admin/measurements"
                          className="font-semibold text-black hover:underline uppercase text-[10px] tracking-wider"
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
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <h3 className="font-heading text-lg text-black mb-4 border-b border-black/5 pb-2">Internal studio log</h3>
              
              {/* Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Record an update, adjustment, thread matching details..."
                  required
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="bg-white"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-black/55">
                      <input
                        type="radio"
                        name="note-vis"
                        checked={noteVisibility === 'internal'}
                        onChange={() => setNoteVisibility('internal')}
                      />
                      Internal note (staff only)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-black/55">
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
                  <p className="text-xs text-black/45 text-center py-4">No internal notes posted yet.</p>
                ) : (
                  [...order.notes].reverse().map((note, idx) => (
                    <div key={idx} className="p-3 bg-white/45 border border-black/5 rounded text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-black/50">
                        <span className="font-semibold">{note.createdBy}</span>
                        <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-black/85 whitespace-pre-wrap">{note.body}</p>
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
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <h3 className="font-heading text-lg text-black mb-4 border-b border-black/5 pb-2">Client profile</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-black/45 block">Name</span>
                  <span className="font-medium text-black mt-0.5 block">{order.customerId.name}</span>
                </div>
                <div>
                  <span className="text-black/45 block">Phone</span>
                  <span className="font-medium text-black mt-0.5 block">{order.customerId.phone}</span>
                </div>
                {order.customerId.email && (
                  <div>
                    <span className="text-black/45 block">Email</span>
                    <span className="font-medium text-black mt-0.5 block">{order.customerId.email}</span>
                  </div>
                )}
                {order.customerId.city && (
                  <div>
                    <span className="text-black/45 block">City</span>
                    <span className="font-medium text-black mt-0.5 block">{order.customerId.city}</span>
                  </div>
                )}
                {order.leadId && (
                  <div>
                    <span className="text-black/45 block">Lead Link</span>
                    <Link to={`/admin/leads/${order.leadId}`} className="font-semibold text-black hover:underline block mt-0.5">
                      Open original crm lead →
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
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <div className="flex gap-3 items-center mb-4 border-b border-black/5 pb-2">
                <h3 className="font-heading text-lg text-black flex-1">Financial ledger</h3>
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
                  className="text-xs font-semibold text-black/50 hover:underline uppercase tracking-wider"
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
                  <span className="text-black/55">Total Quoted</span>
                  <span className="font-medium">₹{order.paymentSummary.totalQuoted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/55">Advance Paid</span>
                  <span className="font-medium text-emerald-700">₹{order.paymentSummary.advance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/55">Total Paid</span>
                  <span className="font-medium text-emerald-700">₹{order.paymentSummary.totalPaid}</span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
                  <span className="text-black/85">Outstanding Balance</span>
                  <span className={cn(order.paymentSummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700')}>
                    ₹{order.paymentSummary.balance}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Assignments */}
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-2">
                <h3 className="font-heading text-lg text-black">Staff assignments</h3>
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(true)}
                  className="text-xs font-semibold text-black hover:underline uppercase tracking-wider"
                >
                  Manage
                </button>
              </div>

              {order.assignedStaff.length === 0 ? (
                <p className="text-xs text-black/45 text-center py-3">No staff assigned to this order.</p>
              ) : (
                <div className="space-y-2">
                  {order.assignedStaff.map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border border-black/5 bg-white/40 rounded text-xs">
                      <span className="font-medium text-black">{staff.name}</span>
                      <span className="text-[10px] uppercase font-semibold text-black/50 tracking-wider">
                        {staff.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workshop Production Timeline */}
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <h3 className="font-heading text-lg text-black mb-4 border-b border-black/5 pb-2">Production timeline</h3>
              <div className="relative pl-4 border-l border-black/10 space-y-6 text-xs">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-cream" />
                    <div className="flex justify-between gap-2 text-[10px] text-black/45">
                      <span className="font-semibold uppercase tracking-wider text-black/60">
                        {event.status.replace('_', ' ')}
                      </span>
                      <span>
                        {new Date(event.at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {event.note && <p className="text-black/85 mt-1">{event.note}</p>}
                    <span className="text-[9px] text-black/35 block mt-0.5">By {event.actorId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transition note Modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Reason for lifecycle transition"
      >
        <div className="space-y-4">
          <p className="text-xs text-black/65">
            You are moving this order status to <span className="font-semibold uppercase">{nextStatus.replace('_', ' ')}</span>.
            Please record a brief reason or notes below for audit records.
          </p>
          <Input
            type="text"
            placeholder="e.g. fabric delayed, fitting rescheduled, client requested cancel"
            required
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2 border-t border-black/5">
            <Button variant="secondary" size="sm" onClick={() => setStatusModalOpen(false)}>
              Abort
            </Button>
            <Button
              size="sm"
              disabled={transitioning || !transitionNote.trim()}
              onClick={() => executeStatusTransition(nextStatus, transitionNote.trim())}
            >
              {transitioning ? 'Saving...' : 'Transition'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff assignment Modal */}
      <Modal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Assign staff members"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Staff worker name"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="flex-1"
            />
            <select
              value={newStaffRole}
              onChange={(e: any) => setNewStaffRole(e.target.value)}
              className="w-[150px] rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              {STAFF_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={handleAddStaffMember}>
              Add
            </Button>
          </div>

          <div className="max-h-[200px] overflow-y-auto divide-y divide-black/5 border border-black/10 rounded-sm">
            {assignedStaff.map((staff, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 text-xs">
                <div>
                  <span className="font-semibold block">{staff.name}</span>
                  <span className="text-black/50 text-[10px] uppercase block mt-0.5">{staff.role}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStaffMember(idx)}
                  className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 uppercase"
                >
                  Remove
                </button>
              </div>
            ))}
            {assignedStaff.length === 0 && (
              <p className="text-xs text-black/40 text-center py-4">No assignments added yet.</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-black/5">
            <Button variant="secondary" size="sm" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={savingStaff} onClick={handleSaveStaff}>
              {savingStaff ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Financials Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={paymentMode === 'record' ? 'Record Payment' : 'Adjust Quoted Amount'}
      >
        {paymentMode === 'record' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-black/55 mb-1.5">Amount (₹) *</label>
                <Input
                  id="record-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-black/55 mb-1.5">Date *</label>
                <Input
                  id="record-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-black/55 mb-1.5">Method *</label>
              <select
                id="record-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-black/55 mb-1.5">Reference / UPI ID</label>
              <Input
                id="record-payment-ref"
                placeholder="Transaction ID, UPI reference…"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-black/55 mb-1.5">Notes</label>
              <Input
                id="record-payment-notes"
                placeholder="Optional note"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
            <div className="rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Current balance: <strong>₹{order?.paymentSummary.balance ?? 0}</strong>
              {paymentAmount && Number(paymentAmount) > 0 && (
                <span className="ml-2">→ After payment: <strong>₹{Math.max(0, (order?.paymentSummary.balance ?? 0) - Number(paymentAmount))}</strong></span>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-black/5">
              <Button variant="secondary" size="sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={savingPayment} onClick={handleSavePayments}>
                {savingPayment ? 'Recording…' : 'Record Payment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-black/55 mb-1.5">Total Quoted Amount (₹)</label>
              <Input
                type="number"
                min="0"
                value={totalQuoted}
                onChange={(e) => setTotalQuoted(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-black/5">
              <Button variant="secondary" size="sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={savingPayment} onClick={handleSavePayments}>
                {savingPayment ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Measurements Link Modal */}
      <Modal
        open={measureModalOpen}
        onClose={() => setMeasureModalOpen(false)}
        title="Link client measurement profile"
      >
        <div className="space-y-4">
          <p className="text-xs text-black/65">
            Search or select from the client's recorded measurement profiles. If no profiles exist, you can create one in the Measurements tab.
          </p>

          <div className="max-h-[220px] overflow-y-auto border border-black/10 rounded-sm divide-y divide-black/5">
            {loadingProfiles ? (
              <div className="py-8 text-center"><Spinner size="sm" /></div>
            ) : availableProfiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-black/45">
                No profiles recorded for this customer.
                <Link
                  to="/admin/measurements"
                  className="block font-semibold text-black hover:underline mt-2 text-[10px] uppercase"
                >
                  Create fitting profile →
                </Link>
              </div>
            ) : (
              availableProfiles.map((p) => {
                const isLinked = order.measurementProfileIds?.includes(p.id) || false;
                return (
                  <div key={p.id} className="flex justify-between items-center p-3 text-xs">
                    <div>
                      <span className="font-semibold block">{p.profileName} ({p.productTypeCode})</span>
                      <span className="text-black/55 text-[10px] block mt-0.5">Updated: {new Date(p.measuredAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={isLinked ? 'secondary' : 'primary'}
                      disabled={linkingProfile}
                      onClick={() => handleLinkProfile(p.id)}
                    >
                      {isLinked ? 'Unlink' : 'Link'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-black/5">
            <Button size="sm" onClick={() => setMeasureModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
