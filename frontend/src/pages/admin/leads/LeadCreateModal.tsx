import { Button, Input, Select, Textarea } from '@/components/ui';
import { LEAD_DESK_OPTIONS, LEAD_QUALITY_OPTIONS, type LeadFormData, type LeadQuality } from './types';

interface LeadCreateModalProps {
  open: boolean;
  onClose: () => void;
  form: LeadFormData;
  setForm: React.Dispatch<React.SetStateAction<LeadFormData>>;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function LeadCreateModal({
  open,
  onClose,
  form,
  setForm,
  onSave,
  saving,
}: LeadCreateModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] text-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">Register New Client Enquiry</h2>
            <p className="opacity-60 text-xs mt-0.5">
              Add walk-in, phone, or bridal exhibition leads to Kadamba's CRM
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Client Name *"
              required
              placeholder="e.g. Sravani Reddy"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Phone Number *"
              required
              placeholder="10-digit mobile"
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
              label="City"
              placeholder="Kurnool, Hyderabad..."
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Service of Interest *"
              required
              placeholder="e.g. Bridal Lehengas & Blouses"
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
            />

            <Select
              label="Acquisition Channel"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              options={[
                { value: 'walk-in', label: '🚶 Walk-In Atelier' },
                { value: 'instagram', label: '📸 Instagram / Social' },
                { value: 'website', label: '🌐 Website Enquiry' },
                { value: 'referral', label: '🤝 Client Referral' },
                { value: 'phone', label: '📞 Direct Call' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assignee Desk"
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              options={LEAD_DESK_OPTIONS.map((d) => ({ value: d, label: d }))}
            />

            <Select
              label="Initial Quality Tier"
              value={form.quality}
              onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value as LeadQuality }))}
              options={LEAD_QUALITY_OPTIONS.map((q) => ({
                value: q,
                label: q === 'hot' ? '🔥 Hot Lead' : q === 'warm' ? '⚡ Warm Lead' : '❄️ Cold Enquiry',
              }))}
            />
          </div>

          <Textarea
            label="Consultation Notes & Requirements"
            rows={3}
            placeholder="Fabric preferences, wedding date, design inspirations..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="text-xs opacity-50">
            {form.name ? `Lead: ${form.name}` : 'Name and phone required (*)'}
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
              onClick={onSave}
              className="font-bold shadow-xs"
            >
              {saving ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
