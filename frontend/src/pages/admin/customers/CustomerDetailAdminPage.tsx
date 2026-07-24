import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { customerApi, type Customer } from '@/services/customers/customerService';
import api from '@/services/api/client';
import type { ApiResponse } from '@/types';
import { Button, Input, Spinner, Modal } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

type AdminPortalMessage = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
  customerId?: string;
};

function adminSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

export default function CustomerDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs: overview, orders, measurements, journal
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'measurements' | 'journal'>('overview');

  // Nested lists states
  const [orders, setOrders] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // Note states
  const [noteBody, setNoteBody] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [postingNote, setPostingNote] = useState(false);

  // Edit / Archival states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editSource, setEditSource] = useState('walk-in');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Edit Address fields
  const [editLine1, setEditLine1] = useState('');
  const [editLine2, setEditLine2] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editPreferredUnit, setEditPreferredUnit] = useState<'in' | 'cm'>('in');
  const [editPortalStatus, setEditPortalStatus] = useState('none');

  const [portalChat, setPortalChat] = useState<AdminPortalMessage[]>([]);
  const [chatBody, setChatBody] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const loadPortalChat = async () => {
    if (!id) return;
    setLoadingChat(true);
    try {
      const { data } = await api.get<ApiResponse<AdminPortalMessage[]>>(
        `/admin/portal/customers/${id}/chat`,
      );
      setPortalChat(data.data || []);
    } catch (err) {
      console.error('Failed to load portal chat', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const sendPortalReply = async () => {
    if (!id || !chatBody.trim()) return;
    setSendingChat(true);
    try {
      await api.post(`/admin/portal/customers/${id}/chat`, { body: chatBody.trim() });
      setChatBody('');
      await loadPortalChat();
    } catch (err) {
      console.error('Failed to send portal reply', err);
    } finally {
      setSendingChat(false);
    }
  };

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      const data = await customerApi.get(id);
      setCustomer(data);
      
      // Seed edit form states
      setEditName(data.name || '');
      setEditPhone(data.phone || '');
      setEditEmail(data.email || '');
      setEditWhatsapp(data.whatsapp || '');
      setEditSource(data.source || 'walk-in');
      setEditTags(data.tags?.join(', ') || '');
      setEditNotes(data.notes || '');
      setEditLine1(data.address?.line1 || '');
      setEditLine2(data.address?.line2 || '');
      setEditLandmark(data.address?.landmark || '');
      setEditLocality(data.address?.locality || '');
      setEditCity(data.address?.city || 'Kurnool');
      setEditState(data.address?.state || 'Andhra Pradesh');
      setEditPincode(data.address?.pincode || '');
      setEditPreferredUnit((data.preferredUnit as any) || 'in');
      setEditPortalStatus(data.portalStatus || 'none');
    } catch (err) {
      console.error('Failed to get customer record', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedOrders = async () => {
    if (!id) return;
    setLoadingOrders(true);
    try {
      const data = await customerApi.getOrders(id);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load related orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadRelatedMeasurements = async () => {
    if (!id) return;
    setLoadingMeasurements(true);
    try {
      const data = await customerApi.getMeasurements(id);
      setMeasurements(data);
    } catch (err) {
      console.error('Failed to load measurements list', err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchCustomer();
  }, [id]);

  useEffect(() => {
    if (id) void loadPortalChat();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('kadamba_token');
    if (!token) return;

    const socket = io(adminSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('portal:watch', id);
    });

    socket.on('portal:chat', (payload: AdminPortalMessage) => {
      if (payload.customerId && payload.customerId !== id) return;
      setPortalChat((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (activeTab === 'orders') void loadRelatedOrders();
    if (activeTab === 'measurements') void loadRelatedMeasurements();
  }, [activeTab]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteBody.trim()) return;
    setPostingNote(true);
    try {
      const updatedNotes = await customerApi.addNote(id, noteBody.trim(), notePinned);
      setCustomer((prev) => prev ? { ...prev, crmNotes: updatedNotes } : null);
      setNoteBody('');
      setNotePinned(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record CRM note.');
    } finally {
      setPostingNote(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingEdit(true);
    try {
      const tags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await customerApi.update(id, {
        name: editName,
        phone: editPhone,
        email: editEmail || undefined,
        whatsapp: editWhatsapp || undefined,
        source: editSource,
        tags,
        notes: editNotes || undefined,
        preferredUnit: editPreferredUnit,
        portalStatus: editPortalStatus,
        address: {
          line1: editLine1 || undefined,
          line2: editLine2 || undefined,
          landmark: editLandmark || undefined,
          locality: editLocality || undefined,
          city: editCity || undefined,
          state: editState || undefined,
          pincode: editPincode || undefined,
        },
      });

      setCustomer((prev) => prev ? {
        ...prev,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        whatsapp: updated.whatsapp,
        address: updated.address,
        tags: updated.tags,
        notes: updated.notes,
        preferredUnit: updated.preferredUnit,
        portalStatus: updated.portalStatus,
      } : null);

      setEditModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update client profile details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to archive this client record? This action soft deletes their profile from directory searches.')) return;
    setArchiving(true);
    try {
      await customerApi.update(id, { archive: true });
      navigate('/admin/customers');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive customer record.');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <Spinner size="lg" label="Retrieving client profile..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h3 className="font-heading text-xl text-black">Client not found</h3>
        <p className="text-black/55 text-xs mt-2">The requested client profile workspace could not be resolved.</p>
        <Link to="/admin/customers" className="text-xs font-semibold hover:underline block mt-4 text-black">
          ← Back to customers directory
        </Link>
      </div>
    );
  }

  const pinnedNotes = customer.crmNotes?.filter((n) => n.pinned) || [];
  const normalNotes = customer.crmNotes?.filter((n) => !n.pinned) || [];

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={customer.name}
        copy={adminBanners.customerDetail.copy}
        actionLabel={adminBanners.customerDetail.actionLabel}
        actionTo={adminBanners.customerDetail.actionTo}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        {/* Header client info bar */}
        <div className="rounded-lg border border-black/10 bg-cream p-6 mb-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl text-black">{customer.name}</h2>
              {customer.tags?.map((t) => (
                <span key={t} className="text-[9px] bg-gold/15 text-black border border-gold/30 px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-black/60">
              <a href={`tel:${customer.phone}`} className="hover:underline font-semibold text-black flex items-center gap-1">
                📞 {customer.phone}
              </a>
              <a
                href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-emerald-800 font-semibold flex items-center gap-1"
              >
                💬 WhatsApp
              </a>
              {customer.email && <span className="text-black/45">· {customer.email}</span>}
              {customer.address?.locality && <span className="text-black/45">· {customer.address.locality}</span>}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
              Edit Profile
            </Button>
            <Button variant="luxury" size="sm" onClick={handleArchive} disabled={archiving}>
              {archiving ? 'Archiving...' : 'Archive Client'}
            </Button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-black/10 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Identity & Address' },
            { id: 'orders', label: `Order History (${customer.summary?.orderCount || 0})` },
            { id: 'measurements', label: `Measurements (${customer.summary?.measurementCount || 0})` },
            { id: 'journal', label: `Timeline Journal (${customer.crmNotes?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-black text-black font-bold'
                  : 'border-transparent text-black/45 hover:text-black hover:border-black/20',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main workspace column (takes 2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Client Profile details */}
                <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-6 text-xs">
                  <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Client profile overview</h3>
                  
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                    <div>
                      <span className="text-black/45 block mb-1">Full name</span>
                      <span className="font-medium text-black text-sm block">{customer.name}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block mb-1">Primary phone</span>
                      <span className="font-medium text-black text-sm block">{customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block mb-1">WhatsApp number</span>
                      <span className="font-medium text-black text-sm block">{customer.whatsapp || customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block mb-1">Email address</span>
                      <span className="font-medium text-black text-sm block">{customer.email || 'None recorded'}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block mb-1">Client source</span>
                      <span className="font-medium text-black text-sm block capitalize">{customer.source}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block mb-1">Preferred Unit</span>
                      <span className="font-medium text-black text-sm block uppercase">{customer.preferredUnit || 'in'}</span>
                    </div>
                  </div>
                </div>

                {/* Address details */}
                <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-4 text-xs">
                  <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Locality & address</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-black/45 block">Address lines</span>
                      <span className="font-medium text-black mt-1 block">
                        {customer.address?.line1 || 'No address lines recorded'}
                        {customer.address?.line2 && <span className="block mt-0.5">{customer.address.line2}</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-black/45 block">Landmark</span>
                      <span className="font-medium text-black mt-1 block">{customer.address?.landmark || '—'}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block">Locality area</span>
                      <span className="font-medium text-black mt-1 block">{customer.address?.locality || '—'}</span>
                    </div>
                    <div>
                      <span className="text-black/45 block">City / Pincode</span>
                      <span className="font-medium text-black mt-1 block">
                        {customer.address?.city || 'Kurnool'} - {customer.address?.pincode || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* General Remark */}
                {customer.notes && (
                  <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-2 text-xs">
                    <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Relationship summaries</h3>
                    <p className="text-black/75 leading-relaxed text-sm italic">"{customer.notes}"</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <h3 className="font-heading text-lg text-black">Customer order book</h3>
                  <Link to="/admin/orders">
                    <Button size="sm" variant="ghost">Place new order →</Button>
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="py-8 text-center"><Spinner size="sm" /></div>
                ) : orders.length === 0 ? (
                  <p className="text-xs text-black/45 text-center py-6">No orders registered for this customer yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-black/10 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/10 bg-black/5 text-[0.65rem] uppercase font-semibold text-black/50">
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Order Description</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Delivery Date</th>
                          <th className="p-3 text-right">Balance</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 bg-white/30">
                        {orders.map((order) => (
                          <tr key={order._id || order.id} className="hover:bg-black/[0.01]">
                            <td className="p-3 font-mono font-bold">
                              {order.referenceId || `Enq #${order.orderNumber}`}
                            </td>
                            <td className="p-3 font-medium text-black max-w-[150px] truncate">{order.title}</td>
                            <td className="p-3">
                              <span className="inline-block text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/5 border border-black/10">
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-black/60">
                              {order.expectedDeliveryAt ? new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN') : '—'}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {order.paymentSummary.balance > 0 ? (
                                <span className="text-rose-700">₹{order.paymentSummary.balance}</span>
                              ) : (
                                <span className="text-emerald-700">Paid</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Link to={`/admin/orders/${order._id || order.id}`} className="font-semibold hover:underline">
                                View →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'measurements' && (
              <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <h3 className="font-heading text-lg text-black">Linked fit cards</h3>
                  <Link to="/admin/measurements">
                    <Button size="sm" variant="ghost">New fit profile →</Button>
                  </Link>
                </div>

                {loadingMeasurements ? (
                  <div className="py-8 text-center"><Spinner size="sm" /></div>
                ) : measurements.length === 0 ? (
                  <p className="text-xs text-black/45 text-center py-6">No measurement profile records recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {measurements.map((m) => (
                      <div key={m.id || m._id} className="p-4 border border-black/15 bg-white/40 rounded space-y-3 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-black text-sm block">{m.profileName}</span>
                            <span className="text-[10px] text-black/50 block mt-0.5 uppercase tracking-wider font-semibold">
                              {m.productTypeCode}
                            </span>
                          </div>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-black/10 font-bold bg-black/5">
                            {m.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-black/50 pt-2 border-t border-black/5">
                          <span>Measured: {new Date(m.measuredAt || m.createdAt).toLocaleDateString('en-IN')}</span>
                          <Link to="/admin/measurements" className="font-bold text-black hover:underline">
                            Open fitting →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'journal' && (
              <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-6">
                <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Timeline journal notes</h3>
                
                {/* Pinned Reminders */}
                {pinnedNotes.length > 0 && (
                  <div className="p-4 bg-yellow-50/70 border border-yellow-200 rounded space-y-3 text-xs">
                    <span className="font-semibold text-amber-800 uppercase tracking-wider text-[9px] block">
                      📌 Pinned fit instructions
                    </span>
                    <div className="space-y-3.5">
                      {pinnedNotes.map((note, idx) => (
                        <div key={idx} className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0">
                          <p className="text-black/85 font-medium whitespace-pre-wrap">{note.body}</p>
                          <span className="text-[9px] text-black/45 block mt-1">
                            By {note.createdBy} on {new Date(note.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post note form */}
                <form onSubmit={handlePostNote} className="space-y-3 text-xs">
                  <Input
                    type="text"
                    placeholder="Write a fitting note, styling remark, fabric selection alert..."
                    required
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    className="bg-white"
                  />
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-black/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notePinned}
                        onChange={(e) => setNotePinned(e.target.checked)}
                      />
                      Pin this note to profile highlights
                    </label>
                    <Button type="submit" size="sm" disabled={postingNote}>
                      {postingNote ? 'Posting...' : 'Post remark'}
                    </Button>
                  </div>
                </form>

                {/* Normal Notes feed */}
                <div className="space-y-4">
                  {normalNotes.length === 0 && pinnedNotes.length === 0 ? (
                    <p className="text-xs text-black/45 text-center py-4">No journal notes logged yet.</p>
                  ) : (
                    [...normalNotes].reverse().map((note, idx) => (
                      <div key={idx} className="p-3 bg-white/40 border border-black/5 rounded text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-black/40">
                          <span className="font-semibold">{note.createdBy}</span>
                          <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-black/80 whitespace-pre-wrap">{note.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar column (takes 1/3 width) */}
          <div className="space-y-8 text-xs">
            {/* Quick Summary Counts */}
            <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-4">
              <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Atelier ledger</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-black/55">Active Tailoring Orders</span>
                  <span className="font-semibold text-black">{customer.summary?.activeOrderCount || 0} active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/55">Total Orders Placed</span>
                  <span className="font-semibold text-black">{customer.summary?.orderCount || 0} jobs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/55">Measurement Profiles</span>
                  <span className="font-semibold text-black">{customer.summary?.measurementCount || 0} fit cards</span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-3">
                  <span className="text-black/85 font-semibold">Total Revenue Spent</span>
                  <span className="font-bold text-emerald-800">₹{customer.summary?.totalSpent || 0}</span>
                </div>
              </div>
            </div>

            {/* Portal Link status */}
            <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-3">
              <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Client portal status</h3>
              <div>
                <span className="text-black/45 block">Invitation Status</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider mt-1.5',
                    customer.portalStatus === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    customer.portalStatus === 'invited' && 'bg-amber-50 text-amber-800 border-amber-200',
                    customer.portalStatus === 'locked' && 'bg-rose-50 text-rose-800 border-rose-200',
                    (!customer.portalStatus || customer.portalStatus === 'none') && 'bg-zinc-50 text-zinc-600 border-zinc-200',
                  )}
                >
                  {customer.portalStatus || 'none'}
                </span>
              </div>
              {customer.portalUserId ? (
                <div>
                  <span className="text-black/45 block">Portal User ID</span>
                  <span className="font-mono text-[10px] text-black mt-1 block">{customer.portalUserId}</span>
                </div>
              ) : (
                <p className="text-[10px] text-black/50 leading-relaxed mt-2 bg-black/5 p-2 rounded">
                  Portal access enables the customer to track their orders, view measurements, and receive status reminders. Linked on checkout.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-black/10 bg-cream p-6 space-y-3">
              <h3 className="font-heading text-lg text-black border-b border-black/5 pb-2">Portal chat</h3>
              {loadingChat ? (
                <Spinner size="sm" label="Loading chat" />
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
                  {portalChat.length === 0 ? (
                    <p className="text-black/45">No portal messages yet.</p>
                  ) : (
                    portalChat.map((m) => (
                      <div key={m.id} className="rounded border border-black/10 bg-white/60 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-wider text-black/40">
                          {m.senderRole === 'customer' ? 'Customer' : 'Studio'}
                        </p>
                        <p className="mt-0.5 text-black/80 whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Input
                  value={chatBody}
                  onChange={(e) => setChatBody(e.target.value)}
                  placeholder="Reply to customer…"
                />
                <Button type="button" size="sm" disabled={sendingChat || !chatBody.trim()} onClick={() => void sendPortalReply()}>
                  {sendingChat ? '…' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Profile details modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Client Profile"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs pb-4">
          <div>
            <label className="block text-black/55 mb-1.5 font-semibold">Client Name *</label>
            <Input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Primary Phone *</label>
              <Input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">WhatsApp number</label>
              <Input
                type="tel"
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Email address</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Client source</label>
              <select
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="walk-in">Walk-in / Phone</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google Maps</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-black/55 mb-1.5 font-semibold">Address line 1</label>
            <Input
              type="text"
              value={editLine1}
              onChange={(e) => setEditLine1(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-black/55 mb-1.5 font-semibold">Address line 2</label>
            <Input
              type="text"
              value={editLine2}
              onChange={(e) => setEditLine2(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Landmark</label>
              <Input
                type="text"
                value={editLandmark}
                onChange={(e) => setEditLandmark(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Locality / Area</label>
              <Input
                type="text"
                value={editLocality}
                onChange={(e) => setEditLocality(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">City</label>
              <Input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">State</label>
              <Input
                type="text"
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Pincode</label>
              <Input
                type="text"
                value={editPincode}
                onChange={(e) => setEditPincode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Fit Unit</label>
              <select
                value={editPreferredUnit}
                onChange={(e: any) => setEditPreferredUnit(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="in">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
              </select>
            </div>
            <div>
              <label className="block text-black/55 mb-1.5 font-semibold">Portal status</label>
              <select
                value={editPortalStatus}
                onChange={(e) => setEditPortalStatus(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="none">None</option>
                <option value="invited">Invited</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-black/55 mb-1.5 font-semibold">Client tags</label>
              <Input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="bridal, VIP, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-black/55 mb-1.5 font-semibold">Profile Notes summary</label>
            <Input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-black/5">
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
