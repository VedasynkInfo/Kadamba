import { useState, useEffect } from 'react';
import { staffApi, type Staff } from '@/services/staff/staffService';
import {
  SPECIALIZATIONS,
  EMPLOYMENT_TYPES,
  SALARY_TYPES,
  type StaffFormData,
  createBlankStaffForm,
  staffToFormData,
} from './types';
import { cn } from '@/utils/cn';

interface StaffModalFormProps {
  open: boolean;
  staff: Staff | null; // null => create mode, Staff => edit mode
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'contact' | 'craft' | 'payroll';

export function StaffModalForm({ open, staff, onClose, onSuccess }: StaffModalFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [form, setForm] = useState<StaffFormData>(createBlankStaffForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab('contact');
      setError(null);
      if (staff) {
        setForm(staffToFormData(staff));
      } else {
        setForm(createBlankStaffForm());
      }
    }
  }, [open, staff]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  function updateField<K extends keyof StaffFormData>(field: K, val: StaffFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function toggleSpec(spec: string) {
    setForm((prev) => {
      const exists = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: exists
          ? prev.specializations.filter((s) => s !== spec)
          : [...prev.specializations, spec],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.locality.trim()) {
      setError('Full name, phone, and workshop locality are required.');
      setActiveTab('contact');
      return;
    }
    if (form.specializations.length === 0) {
      setError('Please select at least one craft specialization in Tab 2.');
      setActiveTab('craft');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Partial<Staff> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        locality: form.locality.trim(),
        address: form.address.trim() || undefined,
        joiningDate: form.joiningDate || undefined,
        employmentType: form.employmentType,
        specializations: form.specializations,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        previousWorkplaces: form.previousWorkplaces
          ? form.previousWorkplaces.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        languages: form.languages
          ? form.languages.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        emergencyContact:
          form.emergencyName || form.emergencyPhone
            ? { name: form.emergencyName, phone: form.emergencyPhone }
            : undefined,
        salaryType: form.salaryType,
        salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : undefined,
        status: form.status,
      } as any;

      if (staff) {
        await staffApi.update(staff.id, payload);
      } else {
        await staffApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save staff profile';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Staff member form"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.22))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{staff ? '✏️' : '👥'}</span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">
                {staff ? `Edit Artisan: ${staff.fullName}` : 'Register New Artisan'}
              </h3>
              <p className="text-[10px] opacity-60 mt-0.5">
                Workshop craftsman profile, master skills, and compensation contract
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-5 text-xs font-semibold"
          style={{
            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))',
            backgroundColor: 'rgba(128, 128, 128, 0.04)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'contact'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)] font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            1. Personal & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('craft')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'craft'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)] font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            2. Craft & Specialization ({form.specializations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'payroll'
                ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)] font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            3. Payroll & Status
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        ) : null}

        {/* Tab Content */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* TAB 1: Contact */}
          {activeTab === 'contact' ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Locality / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.locality}
                    onChange={(e) => updateField('locality', e.target.value)}
                    placeholder="e.g. Jubilee Hills / Old City"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                  Full Residential Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Street, door no, landmark..."
                  className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                  style={{
                    backgroundColor: 'rgba(128, 128, 128, 0.05)',
                    borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                    color: 'inherit',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={form.emergencyName}
                    onChange={(e) => updateField('emergencyName', e.target.value)}
                    placeholder="e.g. Spouse / Brother"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    placeholder="e.g. 9876500000"
                    className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* TAB 2: Craft & Skills */}
          {activeTab === 'craft' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Employment Type *
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => updateField('employmentType', e.target.value as any)}
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
                    style={{
                      backgroundColor: 'var(--admin-card, #141b26)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => updateField('joiningDate', e.target.value)}
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Specializations Picker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                  Artisan Specializations * (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPECIALIZATIONS.map((s) => {
                    const isSelected = form.specializations.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleSpec(s.value)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between',
                          isSelected
                            ? 'bg-[var(--admin-primary,#b59410)]/15 border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)] font-bold'
                            : 'hover:bg-current/[0.04] opacity-70',
                        )}
                        style={{
                          borderColor: isSelected
                            ? 'var(--admin-primary, #b59410)'
                            : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                        }}
                      >
                        <span className="truncate">{s.label}</span>
                        {isSelected ? <span className="ml-1">✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.yearsExperience}
                    onChange={(e) => updateField('yearsExperience', e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Languages (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.languages}
                    onChange={(e) => updateField('languages', e.target.value)}
                    placeholder="e.g. Telugu, Hindi, Urdu"
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                  Previous Boutiques / Studios (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.previousWorkplaces}
                  onChange={(e) => updateField('previousWorkplaces', e.target.value)}
                  placeholder="e.g. Tarun Tahiliani Hyderabad, Self Employed"
                  className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                  style={{
                    backgroundColor: 'rgba(128, 128, 128, 0.05)',
                    borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                    color: 'inherit',
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* TAB 3: Payroll & Status */}
          {activeTab === 'payroll' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Salary / Remuneration Model *
                  </label>
                  <select
                    value={form.salaryType}
                    onChange={(e) => updateField('salaryType', e.target.value as any)}
                    className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
                    style={{
                      backgroundColor: 'var(--admin-card, #141b26)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                      color: 'inherit',
                    }}
                  >
                    {SALARY_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                    Rate / Salary Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.salaryAmount}
                    onChange={(e) => updateField('salaryAmount', e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl border py-2 px-3 text-xs font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.05)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
                <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                  Roster Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('status', 'active')}
                    className={cn(
                      'p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer',
                      form.status === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'opacity-60 hover:opacity-100',
                    )}
                    style={{
                      borderColor:
                        form.status === 'active'
                          ? '#10b981'
                          : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                    }}
                  >
                    ⚡ Active (On Floor)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('status', 'inactive')}
                    className={cn(
                      'p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer',
                      form.status === 'inactive'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                        : 'opacity-60 hover:opacity-100',
                    )}
                    style={{
                      borderColor:
                        form.status === 'inactive'
                          ? '#f43f5e'
                          : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                    }}
                  >
                    ⏸️ Inactive / Leave
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer Controls */}
          <div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
          >
            <div>
              {activeTab !== 'contact' ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'payroll' ? 'craft' : 'contact')
                  }
                  className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer"
                  style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
                >
                  ← Back
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer"
                style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
              >
                Cancel
              </button>

              {activeTab !== 'payroll' ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'contact' ? 'craft' : 'payroll')
                  }
                  className="rounded-xl px-5 py-2 text-xs font-bold border border-[var(--admin-primary,#b59410)] hover:bg-[var(--admin-primary,#b59410)]/10 text-[var(--admin-primary,#b59410)] transition cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--admin-primary, #b59410)',
                    color: 'var(--admin-primary-text, #ffffff)',
                  }}
                >
                  {submitting ? 'Saving...' : staff ? 'Update Staff' : 'Save Staff'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
