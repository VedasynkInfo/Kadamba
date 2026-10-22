import { Button, Input, Modal } from '@/components/ui';
import type { OrderStaff } from '@/services/orders/orderService';
import { Select } from '@/components/ui';

const STAFF_ROLES = [
  { value: 'designer', label: 'Designer' },
  { value: 'cutter', label: 'Cutter' },
  { value: 'stitcher', label: 'Stitcher' },
  { value: 'maggam', label: 'Maggam / Embroidery' },
  { value: 'finishing', label: 'Finishing / Pico' },
] as const;

interface OrderStaffModalProps {
  open: boolean;
  onClose: () => void;
  assignedStaff: OrderStaff[];
  newStaffName: string;
  setNewStaffName: (v: string) => void;
  newStaffRole: 'cutter' | 'stitcher' | 'maggam' | 'finishing' | 'designer';
  setNewStaffRole: (v: 'cutter' | 'stitcher' | 'maggam' | 'finishing' | 'designer') => void;
  onAddStaffMember: () => void;
  onRemoveStaffMember: (idx: number) => void;
  onSaveStaff: () => void;
  savingStaff: boolean;
}

export function OrderStaffModal({
  open,
  onClose,
  assignedStaff,
  newStaffName,
  setNewStaffName,
  newStaffRole,
  setNewStaffRole,
  onAddStaffMember,
  onRemoveStaffMember,
  onSaveStaff,
  savingStaff,
}: OrderStaffModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Assign Workshop Staff">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Staff name / artisan"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
          />
          <Select
            value={newStaffRole}
            onChange={(value) => setNewStaffRole(value as typeof newStaffRole)}
            options={STAFF_ROLES.map((role) => ({ value: role.value, label: role.label }))}
          />
          <Button type="button" size="sm" onClick={onAddStaffMember}>
            Add
          </Button>
        </div>

        <div className="max-h-[200px] overflow-y-auto divide-y divide-black/5 border border-line rounded-sm">
          {assignedStaff.map((staff, idx) => (
            <div key={idx} className="flex justify-between items-center p-2.5 text-xs">
              <div>
                <span className="font-semibold block">{staff.name}</span>
                <span className="text-ink/70 text-[10px] uppercase block mt-0.5">{staff.role}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveStaffMember(idx)}
                className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 uppercase"
              >
                Remove
              </button>
            </div>
          ))}
          {assignedStaff.length === 0 && (
            <p className="text-xs text-ink/70 text-center py-4">No assignments added yet.</p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={savingStaff} onClick={onSaveStaff}>
            {savingStaff ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
