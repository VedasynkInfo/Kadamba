import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerApi, type Customer } from '@/services/customers/customerService';
import { Button, Drawer, Input, Spinner, Modal } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [localityFilter, setLocalityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [portalFilter, setPortalFilter] = useState('');
  const [openOrdersFilter, setOpenOrdersFilter] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [source, setSource] = useState('walk-in');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Address sub-form
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Kurnool');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');

  // Duplicate Warning Modal
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupCustomer, setDupCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery,
        locality: localityFilter || undefined,
        tag: tagFilter || undefined,
        source: sourceFilter || undefined,
        portalStatus: portalFilter || undefined,
        hasOpenOrders: openOrdersFilter || undefined,
      });
      setCustomers(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to get customer registry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, [pagination.page, searchQuery, localityFilter, tagFilter, sourceFilter, portalFilter, openOrdersFilter]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setWhatsapp('');
    setSource('walk-in');
    setTagsInput('');
    setNotes('');
    setLine1('');
    setLine2('');
    setLandmark('');
    setLocality('');
    setCity('Kurnool');
    setState('Andhra Pradesh');
    setPincode('');
    setDupModalOpen(false);
    setDupCustomer(null);
  };

  const handleCreateCustomer = async (e?: React.FormEvent, forceBypass = false) => {
    if (e) e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await customerApi.create({
        name,
        phone,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        address: {
          line1: line1 || undefined,
          line2: line2 || undefined,
          landmark: landmark || undefined,
          locality: locality || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
        },
        source,
        tags,
        notes: notes || undefined,
        force: forceBypass || undefined,
      });

      setDrawerOpen(false);
      resetForm();
      void fetchCustomers();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.duplicateFound) {
        // Show duplicate modal warning
        setDupCustomer(err.response.data.data);
        setDupModalOpen(true);
      } else {
        alert(err.response?.data?.message || 'Failed to register customer profile.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.customers.title}
        copy={adminBanners.customers.copy}
        actionLabel={adminBanners.customers.actionLabel}
        onAction={() => setDrawerOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 mb-6">
          <div className="flex flex-1 min-w-[280px] max-w-md">
            <Input
              type="text"
              placeholder="Search by client name, phone, tags, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cream/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="text"
              placeholder="Locality..."
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              className="w-[120px] bg-cream/30 text-xs py-1"
            />

            <select
              value={openOrdersFilter}
              onChange={(e) => setOpenOrdersFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-cream px-3 py-2 text-xs text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Order status...</option>
              <option value="true">Has active orders</option>
              <option value="false">No active orders</option>
            </select>

            <select
              value={portalFilter}
              onChange={(e) => setPortalFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-cream px-3 py-2 text-xs text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Portal Status...</option>
              <option value="none">Not Activated</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-cream px-3 py-2 text-xs text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Tag...</option>
              <option value="bridal">Bridal</option>
              <option value="VIP">VIP</option>
              <option value="rush">Rush</option>
              <option value="maggam">Maggam</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-cream px-3 py-2 text-xs text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Source...</option>
              <option value="walk-in">Walk-in</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google Maps</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
            </select>
          </div>
        </div>

        {/* Customer Directory Table */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Spinner size="lg" label="Retrieving client index..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-black/10 border-dashed rounded-lg bg-cream/20 p-8 text-center">
            <span className="text-3xl mb-3">👥</span>
            <h3 className="font-heading text-lg text-black">No client records found</h3>
            <p className="text-xs text-black/55 mt-1 max-w-[280px]">
              Try adjusting your searches or registers, or create a brand new walk-in customer profile.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => setDrawerOpen(true)}>
              New profile
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-black/10 rounded-md overflow-hidden bg-cream">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/5 text-[0.65rem] uppercase tracking-wider text-black/60">
                      <th className="px-4 py-3.5 font-semibold">Client Name</th>
                      <th className="px-4 py-3.5 font-semibold">Contact</th>
                      <th className="px-4 py-3.5 font-semibold">Locality / City</th>
                      <th className="px-4 py-3.5 font-semibold">Orders Count</th>
                      <th className="px-4 py-3.5 font-semibold">Last Order Date</th>
                      <th className="px-4 py-3.5 font-semibold">Tags</th>
                      <th className="px-4 py-3.5 font-semibold">Portal Status</th>
                      <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-black/[0.01] transition-colors">
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/admin/customers/${cust.id}`}
                            className="font-semibold text-black hover:underline text-sm block"
                          >
                            {cust.name}
                          </Link>
                          {cust.email && <span className="text-[10px] text-black/45 block mt-0.5">{cust.email}</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="block font-medium">{cust.phone}</span>
                          {cust.whatsapp && cust.whatsapp !== cust.phone && (
                            <span className="text-[10px] text-black/40 block mt-0.5">WA: {cust.whatsapp}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-black/75">
                          {cust.address?.locality ? (
                            <span>
                              {cust.address.locality}, <span className="text-black/55">{cust.address.city || 'Kurnool'}</span>
                            </span>
                          ) : (
                            <span className="text-black/35">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold">
                          {cust.orderCount || 0} orders
                        </td>
                        <td className="px-4 py-3.5 text-xs text-black/60">
                          {cust.lastOrderDate ? (
                            new Date(cust.lastOrderDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-black/35">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {cust.tags && cust.tags.length > 0 ? (
                              cust.tags.map((t) => (
                                <span key={t} className="text-[9px] bg-black/5 text-black/60 px-1.5 py-0.5 rounded border border-black/5">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-black/25 text-[10px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold border uppercase tracking-wider',
                              cust.portalStatus === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                              cust.portalStatus === 'invited' && 'bg-amber-50 text-amber-800 border-amber-200',
                              cust.portalStatus === 'locked' && 'bg-rose-50 text-rose-800 border-rose-200',
                              (!cust.portalStatus || cust.portalStatus === 'none') && 'bg-zinc-50 text-zinc-600 border-zinc-200',
                            )}
                          >
                            {cust.portalStatus || 'none'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            to={`/admin/customers/${cust.id}`}
                            className="inline-flex items-center text-xs font-semibold hover:underline text-black"
                          >
                            View profile →
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

      {/* Walk-in Customer Create Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
        title="Register client profile"
      >
        <form onSubmit={(e) => handleCreateCustomer(e, false)} className="space-y-6 pb-20">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Identity details *
            </label>
            <Input
              type="text"
              placeholder="Client full name *"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Primary Phone *
              </label>
              <Input
                type="tel"
                placeholder="Indian mobile format *"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                WhatsApp Phone
              </label>
              <Input
                type="tel"
                placeholder="Optional (defaults to phone)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="e.g. client@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Locality & address (Kurnool studio context)
            </label>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Flat / House / Street Details (Line 1)"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Apartment name / Locality extension (Line 2)"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Landmark (e.g. beside Gulf Cafe)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Locality area (e.g. Prakash Nagar)"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Referral channel / source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2.5 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="walk-in">Walk In / Phone Call</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google Maps / Search</option>
                <option value="referral">Client Referral</option>
                <option value="website">Website Enquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
                Client Tags (comma separated)
              </label>
              <Input
                type="text"
                placeholder="e.g. bridal, VIP, maggam"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-black/55 mb-2">
              Profile notes / remarks
            </label>
            <Input
              type="text"
              placeholder="e.g. prefers pastel silk shades, VIP bride"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {submitting ? 'Registering...' : 'Register Profile'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Duplicate Warning Dialog */}
      <Modal
        open={dupModalOpen}
        onClose={() => setDupModalOpen(false)}
        title="Duplicate Phone Number Found"
      >
        <div className="space-y-4 text-xs">
          <p className="text-black/70">
            A customer profile already exists in the database with the phone number{' '}
            <span className="font-semibold text-black">{phone}</span>:
          </p>
          <div className="p-3 bg-black/5 border border-black/10 rounded">
            <span className="font-bold block text-sm">{dupCustomer?.name}</span>
            <span className="text-black/50 block mt-0.5">Phone: {dupCustomer?.phone}</span>
          </div>
          <p className="text-black/60 leading-relaxed">
            Would you like to view this customer's profile directly, or override and create a new separate profile?
          </p>
          <div className="flex gap-3 justify-end pt-3 border-t border-black/5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDupModalOpen(false);
                setDrawerOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            {dupCustomer && (
              <Link to={`/admin/customers/${dupCustomer.id}`}>
                <Button size="sm" variant="luxury">
                  View Profile
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              disabled={submitting}
              onClick={() => handleCreateCustomer(undefined, true)}
            >
              {submitting ? 'Overriding...' : 'Override & Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
