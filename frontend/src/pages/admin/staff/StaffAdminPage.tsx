import { useState, useEffect, useRef } from 'react';
import { staffApi, type Staff } from '@/services/staff/staffService';
import { Button, Drawer, Input, Spinner, Modal } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

const SPECIALIZATIONS = [
  'blouse-stitching',
  'bridal-lehenga',
  'maggam',
  'hand-embroidery',
  'machine-embroidery',
  'cutting',
  'finishing',
  'fabric-selection',
  'customer-consultation',
  'trial-management',
  'quality-inspection',
  'admin',
];

const SPECIALIZATION_LABELS: Record<string, string> = {
  'blouse-stitching': 'Blouse Stitching',
  'bridal-lehenga': 'Bridal Lehenga Tailoring',
  'maggam': 'Maggam Embroidery',
  'hand-embroidery': 'Hand Embroidery / Aari',
  'machine-embroidery': 'Machine Embroidery',
  'cutting': 'Pattern Making / Cutting',
  'finishing': 'Finishing / Alteration',
  'fabric-selection': 'Fabric Selection',
  'customer-consultation': 'Customer Consultation',
  'trial-management': 'Trial Management',
  'quality-inspection': 'Quality Inspection',
  'admin': 'Admin / Front Desk',
};

export default function StaffAdminPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deactivate confirm modal
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Staff | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [employmentType, setEmploymentType] = useState<'permanent' | 'freelance' | 'intern'>('permanent');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [previousWorkplaces, setPreviousWorkplaces] = useState('');
  const [languages, setLanguages] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [salaryType, setSalaryType] = useState<'monthly' | 'piece-rate' | 'freelance' | 'other'>('monthly');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const searchRef = useRef<any>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await staffApi.list({
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery || undefined,
        status: statusFilter || undefined,
        specialization: specializationFilter || undefined,
        employmentType: employmentFilter || undefined,
      });
      setStaff(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to list staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, [pagination.page, statusFilter, specializationFilter, employmentFilter]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { void fetchStaff(); }, 350);
    return () => clearTimeout(searchRef.current);
  }, [searchQuery]);

  const resetForm = () => {
    setEditingStaff(null);
    setFullName(''); setPhone(''); setEmail(''); setLocality(''); setAddress('');
    setJoiningDate(''); setEmploymentType('permanent'); setSelectedSpecs([]);
    setYearsExperience(''); setPreviousWorkplaces(''); setLanguages('');
    setEmergencyName(''); setEmergencyPhone('');
    setSalaryType('monthly'); setSalaryAmount(''); setStatus('active');
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    setFullName(s.fullName); setPhone(s.phone); setEmail(s.email || '');
    setLocality(s.locality); setAddress(s.address || '');
    setJoiningDate(s.joiningDate ? s.joiningDate.slice(0, 10) : '');
    setEmploymentType(s.employmentType); setSelectedSpecs(s.specializations || []);
    setYearsExperience(String(s.yearsExperience || ''));
    setPreviousWorkplaces((s.previousWorkplaces || []).join(', '));
    setLanguages((s.languages || []).join(', '));
    setEmergencyName(s.emergencyContact?.name || '');
    setEmergencyPhone(s.emergencyContact?.phone || '');
    setSalaryType(s.salaryType); setSalaryAmount(String(s.salaryAmount || ''));
    setStatus(s.status);
    setDrawerOpen(true);
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !locality.trim() || selectedSpecs.length === 0) {
      alert('Full name, phone, locality and at least one specialization are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<Staff> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        locality: locality.trim(),
        address: address.trim() || undefined,
        joiningDate: joiningDate || undefined,
        employmentType,
        specializations: selectedSpecs,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        previousWorkplaces: previousWorkplaces ? previousWorkplaces.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        languages: languages ? languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        emergencyContact: (emergencyName || emergencyPhone) ? { name: emergencyName, phone: emergencyPhone } : undefined,
        salaryType,
        salaryAmount: salaryAmount ? Number(salaryAmount) : undefined,
        status,
      } as any;

      if (editingStaff) {
        await staffApi.update(editingStaff.id, payload);
      } else {
        await staffApi.create(payload);
      }
      setDrawerOpen(false);
      resetForm();
      void fetchStaff();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save staff profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await staffApi.update(deactivateTarget.id, { status: 'inactive' } as any);
      setDeactivateModal(false);
      setDeactivateTarget(null);
      void fetchStaff();
    } catch (err) {
      alert('Failed to deactivate staff member');
    }
  };

  const handleReactivate = async (s: Staff) => {
    try {
      await staffApi.update(s.id, { status: 'active' } as any);
      void fetchStaff();
    } catch (err) {
      alert('Failed to reactivate staff member');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHorizonBanner
        title={adminBanners.staff.title}
        copy={adminBanners.staff.copy}
        actionLabel={adminBanners.staff.actionLabel}
        onAction={openCreate}
      />

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-xs">
              <Input
                id="staff-search"
                placeholder="Search name, phone, locality…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={employmentFilter}
              onChange={e => setEmploymentFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="freelance">Freelance</option>
              <option value="intern">Intern</option>
            </select>
            <select
              value={specializationFilter}
              onChange={e => setSpecializationFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All Skills</option>
              {SPECIALIZATIONS.map(s => (
                <option key={s} value={s}>{SPECIALIZATION_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <Button id="add-staff-btn" onClick={openCreate}>+ Add Staff</Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Staff', value: pagination.total, color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { label: 'Showing', value: staff.length, color: 'bg-stone-50 text-stone-700 border-stone-200' },
            { label: 'Active', value: staff.filter(s => s.status === 'active').length, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            { label: 'Inactive', value: staff.filter(s => s.status === 'inactive').length, color: 'bg-rose-50 text-rose-800 border-rose-200' },
          ].map(stat => (
            <div key={stat.label} className={cn('rounded-xl border p-4 text-center', stat.color)}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs mt-1 font-medium opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" label="Loading staff…" />
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="text-stone-400 text-lg">No staff profiles found</p>
            <Button className="mt-4" onClick={openCreate}>Add your first staff member</Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Staff Member</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Locality</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Salary</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-stone-800">{s.fullName}</p>
                      <p className="text-stone-500 text-xs mt-0.5">{s.phone}</p>
                      {s.email && <p className="text-stone-400 text-xs">{s.email}</p>}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-stone-600">{s.locality}</td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        s.employmentType === 'permanent' ? 'bg-blue-100 text-blue-700' :
                        s.employmentType === 'freelance' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      )}>
                        {s.employmentType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.specializations.slice(0, 2).map(spec => (
                          <span key={spec} className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">
                            {SPECIALIZATION_LABELS[spec] || spec}
                          </span>
                        ))}
                        {s.specializations.length > 2 && (
                          <span className="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 text-xs">
                            +{s.specializations.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-stone-700">
                      {s.salaryAmount ? `₹${s.salaryAmount.toLocaleString('en-IN')}` : '—'}
                      {s.salaryAmount ? <span className="text-stone-400 text-xs ml-1">/{s.salaryType === 'monthly' ? 'mo' : s.salaryType}</span> : null}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      )}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>Edit</Button>
                        {s.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => { setDeactivateTarget(s); setDeactivateModal(true); }}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleReactivate(s)}>Reactivate</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
            <span>Page {pagination.page} of {pagination.pages} · {pagination.total} staff</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); resetForm(); }} title={editingStaff ? 'Edit Staff Profile' : 'Add Staff Member'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Full Name *</label>
              <Input id="staff-fullname" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Phone *</label>
              <Input id="staff-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
              <Input id="staff-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Locality *</label>
              <Input id="staff-locality" value={locality} onChange={e => setLocality(e.target.value)} placeholder="e.g. Prakash Nagar" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Joining Date</label>
              <Input id="staff-joining-date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} type="date" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Address</label>
              <Input id="staff-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Employment Type *</label>
              <select
                id="staff-employment-type"
                value={employmentType}
                onChange={e => setEmploymentType(e.target.value as any)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="permanent">Permanent</option>
                <option value="freelance">Freelance</option>
                <option value="intern">Intern</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Status</label>
              <select
                id="staff-status"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="mb-2 block text-xs font-medium text-stone-600">Specializations * (select at least one)</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpec(spec)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    selectedSpecs.includes(spec)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-300 hover:border-amber-300'
                  )}
                >
                  {SPECIALIZATION_LABELS[spec]}
                </button>
              ))}
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Salary Type</label>
              <select
                id="staff-salary-type"
                value={salaryType}
                onChange={e => setSalaryType(e.target.value as any)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="monthly">Monthly</option>
                <option value="piece-rate">Piece Rate</option>
                <option value="freelance">Freelance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Salary Amount (₹)</label>
              <Input id="staff-salary-amount" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} placeholder="e.g. 15000" type="number" min="0" />
            </div>
          </div>

          {/* Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Years of Experience</label>
              <Input id="staff-experience" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="e.g. 5" type="number" min="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Languages</label>
              <Input id="staff-languages" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Telugu, Hindi, English" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Previous Workplaces (comma-separated)</label>
              <Input id="staff-workplaces" value={previousWorkplaces} onChange={e => setPreviousWorkplaces(e.target.value)} placeholder="Studio A, Boutique B" />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Name</label>
                <Input id="staff-emergency-name" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="Contact name" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Phone</label>
                <Input id="staff-emergency-phone" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="Contact phone" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setDrawerOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : editingStaff ? 'Update Profile' : 'Create Profile'}</Button>
          </div>
        </form>
      </Drawer>

      {/* Deactivate Confirm Modal */}
      <Modal open={deactivateModal} onClose={() => { setDeactivateModal(false); setDeactivateTarget(null); }} title="Deactivate Staff Member">
        <p className="text-stone-600 text-sm mb-6">
          Deactivate <strong>{deactivateTarget?.fullName}</strong>? Their history and assignments will be preserved. You can reactivate them later.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setDeactivateModal(false); setDeactivateTarget(null); }}>Cancel</Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
            onClick={handleDeactivate}
          >
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
