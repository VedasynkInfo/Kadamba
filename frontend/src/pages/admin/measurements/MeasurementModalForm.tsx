import { useState, useEffect, useMemo } from 'react';
import {
  measurementApi,
  type MeasurementProfile,
  type MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import type { Customer } from '@/services/customers/customerService';
import {
  SILHOUETTE_FALLBACKS,
  type ProfileFormData,
  createBlankProfileForm,
  profileToFormData,
} from './types';
import { MeasurementFormClientTab } from './MeasurementFormClientTab';
import { MeasurementFormDimensionsTab } from './MeasurementFormDimensionsTab';
import { MeasurementFormDirectivesTab } from './MeasurementFormDirectivesTab';
import { cn } from '@/utils/cn';

interface MeasurementModalFormProps {
  open: boolean;
  profile: MeasurementProfile | null;
  templates: MeasurementTemplate[];
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'identity' | 'dimensions' | 'notes';

export function MeasurementModalForm({
  open,
  profile,
  templates,
  onClose,
  onSuccess,
}: MeasurementModalFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [form, setForm] = useState<ProfileFormData>(createBlankProfileForm());
  const isNew = !profile;

  // Customer selection tracking
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileNameTouched, setProfileNameTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available product types from templates
  const productTypes = useMemo(() => {
    if (templates.length > 0) {
      return templates.map((t) => ({ value: t.code, label: t.name }));
    }
    return SILHOUETTE_FALLBACKS.map((s) => ({ value: s.code, label: s.name }));
  }, [templates]);

  // Selected template object
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.code === form.productTypeCode) || null;
  }, [templates, form.productTypeCode]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab('identity');
      setError(null);
      if (profile) {
        setForm(profileToFormData(profile));
        setCustomerSearch(profile.customerName || profile.customerId || '');
        setSelectedCustomer(
          profile.customerId
            ? ({
                id: profile.customerId,
                name: profile.customerName || profile.customerId.slice(-6),
                phone: '',
                createdAt: '',
                updatedAt: '',
              } as Customer)
            : null,
        );
        setProfileNameTouched(true);
      } else {
        const defaultCode = productTypes[0]?.value || 'BR-LH';
        setForm(createBlankProfileForm(defaultCode));
        setCustomerSearch('');
        setSelectedCustomer(null);
        setProfileNameTouched(false);
      }
    }
  }, [open, profile, productTypes]);

  // Auto-generate profile name: `${selectedCustomer.name} — ${productLabel}`
  useEffect(() => {
    if (!isNew || profileNameTouched) return;
    const productLabel =
      templates.find((t) => t.code === form.productTypeCode)?.name ||
      SILHOUETTE_FALLBACKS.find((s) => s.code === form.productTypeCode)?.name ||
      form.productTypeCode ||
      'Fit';
    if (selectedCustomer?.name) {
      setForm((f) => ({ ...f, profileName: `${selectedCustomer.name} — ${productLabel}` }));
    }
  }, [selectedCustomer, form.productTypeCode, templates, isNew, profileNameTouched]);

  // Keyboard Escape listener & body scroll lock
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

  function updateField<K extends keyof ProfileFormData>(field: K, val: ProfileFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleDimensionChange(key: string, val: unknown) {
    setForm((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: val,
      },
    }));
  }

  function handleSelectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerSearch(`${c.name} · ${c.phone || c.email || 'Client'}`);
    setForm((f) => ({
      ...f,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
    }));
  }

  function handleClearCustomer() {
    setSelectedCustomer(null);
    setCustomerSearch('');
    updateField('customerId', '');
    updateField('customerName', '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) {
      setError('Please search and select a client from the directory.');
      setActiveTab('identity');
      return;
    }
    if (!form.profileName.trim()) {
      setError('Profile title is required.');
      setActiveTab('identity');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        customerId: form.customerId,
        customerName: form.customerName,
        productTypeCode: form.productTypeCode,
        profileName: form.profileName.trim(),
        unit: form.unit,
        status: form.status,
        values: form.values,
        notes: form.notes.trim() || undefined,
        measuredAt: new Date(form.measuredAt).toISOString(),
        measuredBy: form.measuredBy.trim() || undefined,
        referenceImages: form.referenceImages,
      };

      if (profile) {
        await measurementApi.update(profile.id, payload);
      } else {
        await measurementApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errObj?.response?.data?.message || errObj?.message || 'Failed to save measurement profile';
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
      aria-label="Measurement form dialog"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📏</span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">
                {profile ? `Edit Fit Profile: ${profile.profileName}` : 'New Couture Fit Specification'}
              </h3>
              <p className="text-[11px] opacity-60 mt-0.5">
                Record anatomical specifications, template dimensions, and atelier posture directives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* 3-Step Tabs */}
        <div
          className="flex border-b px-6 text-xs font-semibold border-line bg-surface-sunken"
        >
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'identity'
                ? 'border-brand text-brand font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            1. Client & Silhouette
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dimensions')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'dimensions'
                ? 'border-brand text-brand font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            2. Anatomical Dimensions ({Object.keys(form.values).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={cn(
              'py-3 px-4 border-b-2 transition cursor-pointer',
              activeTab === 'notes'
                ? 'border-brand text-brand font-bold'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            3. Sketches & Directives
          </button>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        ) : null}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {activeTab === 'identity' ? (
            <MeasurementFormClientTab
              form={form}
              productTypes={productTypes}
              selectedCustomer={selectedCustomer}
              customerSearch={customerSearch}
              onCustomerSearchChange={setCustomerSearch}
              onSelectCustomer={handleSelectCustomer}
              onClearCustomer={handleClearCustomer}
              onUpdateField={updateField}
              onProfileNameTouched={() => setProfileNameTouched(true)}
            />
          ) : null}

          {activeTab === 'dimensions' ? (
            <MeasurementFormDimensionsTab
              form={form}
              activeTemplate={activeTemplate}
              onDimensionChange={handleDimensionChange}
            />
          ) : null}

          {activeTab === 'notes' ? (
            <MeasurementFormDirectivesTab
              form={form}
              onUpdateField={updateField}
            />
          ) : null}

          {/* Dialog Footer Navigation */}
          <div
            className="flex items-center justify-between pt-4 border-t border-line"
          >
            <div>
              {activeTab !== 'identity' ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'notes' ? 'dimensions' : 'identity')
                  }
                  className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer border-line"
                >
                  ← Back
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer border-line"
              >
                Cancel
              </button>

              {activeTab !== 'notes' ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'identity' ? 'dimensions' : 'notes')
                  }
                  className="rounded-xl px-5 py-2 text-xs font-bold border border-brand hover:bg-brand/10 text-brand transition cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !form.customerId}
                  className="rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-brand text-ink-on-brand"
                >
                  {submitting ? 'Saving Fit...' : profile ? 'Update Fit Specification' : 'Save Fit Specification'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
