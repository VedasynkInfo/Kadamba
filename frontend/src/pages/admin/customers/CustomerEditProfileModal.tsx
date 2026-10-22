import { Button, Input, Modal } from '@/components/ui';
import { Select } from '@/components/ui';

export interface CustomerEditFormState {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  source: string;
  tags: string;
  notes: string;
  line1: string;
  line2: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  preferredUnit: 'in' | 'cm';
  portalStatus: string;
}

interface CustomerEditProfileModalProps {
  open: boolean;
  onClose: () => void;
  form: CustomerEditFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerEditFormState>>;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

export function CustomerEditProfileModal({
  open,
  onClose,
  form,
  setForm,
  onSave,
  saving,
}: CustomerEditProfileModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Client Profile">
      <form onSubmit={onSave} className="space-y-4 text-xs pb-4">
        <div>
          <label className="block text-ink/70 mb-1.5 font-semibold">Client Name *</label>
          <Input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Primary Phone *</label>
            <Input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">WhatsApp number</label>
            <Input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Email address</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Client source</label>
            <Select
              value={form.source}
              onChange={(value) => setForm((f) => ({ ...f, source: value }))}
              options={[{ value: 'walk-in', label: 'Walk-in / Phone' }, { value: 'instagram', label: 'Instagram' }, { value: 'google', label: 'Google Maps' }, { value: 'referral', label: 'Referral' }, { value: 'website', label: 'Website' }]}
            />
          </div>
        </div>

        <div>
          <label className="block text-ink/70 mb-1.5 font-semibold">Address line 1</label>
          <Input
            type="text"
            value={form.line1}
            onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-ink/70 mb-1.5 font-semibold">Address line 2</label>
          <Input
            type="text"
            value={form.line2}
            onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Landmark</label>
            <Input
              type="text"
              value={form.landmark}
              onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Locality / Area</label>
            <Input
              type="text"
              value={form.locality}
              onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">City</label>
            <Input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">State</label>
            <Input
              type="text"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Pincode</label>
            <Input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Fit Unit</label>
            <Select
              value={form.preferredUnit}
              onChange={(value) =>
                setForm((f) => ({ ...f, preferredUnit: value as 'in' | 'cm' }))
              }
              options={[{ value: 'in', label: 'Inches (in)' }, { value: 'cm', label: 'Centimeters (cm)' }]}
            />
          </div>
          <div>
            <label className="block text-ink/70 mb-1.5 font-semibold">Portal status</label>
            <Select
              value={form.portalStatus}
              onChange={(value) => setForm((f) => ({ ...f, portalStatus: value }))}
              options={[{ value: 'none', label: 'None' }, { value: 'invited', label: 'Invited' }, { value: 'active', label: 'Active' }, { value: 'locked', label: 'Locked' }]}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-ink/70 mb-1.5 font-semibold">Client tags</label>
            <Input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="bridal, VIP, etc."
            />
          </div>
        </div>

        <div>
          <label className="block text-ink/70 mb-1.5 font-semibold">Profile Notes summary</label>
          <Input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
