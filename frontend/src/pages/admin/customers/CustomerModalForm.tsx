import { useState } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { CUSTOMER_SOURCES, type CustomerFormData } from './types';
import { cn } from '@/utils/cn';

interface CustomerModalFormProps {
  open: boolean;
  onClose: () => void;
  form: CustomerFormData;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  onSave: (e?: React.FormEvent, forceBypass?: boolean) => Promise<void>;
  saving: boolean;
}

export function CustomerModalForm({
  open,
  onClose,
  form,
  setForm,
  onSave,
  saving,
}: CustomerModalFormProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'address'>('contact');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">Register Client Profile</h2>
            <p className="opacity-60 text-xs mt-0.5">
              Add client to studio registry with bespoke measurements, orders, and portal access
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-6 pt-2 gap-4 text-xs font-semibold border-line"
        >
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'contact'
                ? 'border-brand text-brand'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            👤 Personal & Contact
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'address'
                ? 'border-brand text-brand'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            📍 Address & Delivery
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'contact' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Full Legal Name *"
                  required
                  placeholder="e.g. Sravani Devi"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />

                <Input
                  label="Primary Phone Number *"
                  required
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="client@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />

                <Input
                  label="WhatsApp Number"
                  placeholder="If different from primary"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Acquisition Channel"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  options={CUSTOMER_SOURCES}
                />

                <Input
                  label="Client Tags (comma separated)"
                  placeholder="VIP, Bridal2025, Silk"
                  value={form.tagsInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
                />
              </div>

              <Textarea
                label="Atelier Client Notes"
                rows={3}
                placeholder="Style preferences, wedding dates, family references..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </>
          ) : (
            <>
              <Input
                label="Address Line 1"
                placeholder="Door / Flat / Building No."
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              />

              <Input
                label="Address Line 2"
                placeholder="Street / Road name"
                value={form.line2}
                onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Landmark"
                  placeholder="Near temple / landmark"
                  value={form.landmark}
                  onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                />

                <Input
                  label="Locality / Area"
                  placeholder="e.g. Gayatri Estate"
                  value={form.locality}
                  onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />

                <Input
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />

                <Input
                  label="Pincode"
                  placeholder="518001"
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <div className="text-xs opacity-50">
            {form.name ? `Client: ${form.name}` : 'Name and phone required (*)'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={(e) => onSave(e)}
              className="font-bold shadow-xs"
            >
              {saving ? 'Saving...' : 'Register Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
