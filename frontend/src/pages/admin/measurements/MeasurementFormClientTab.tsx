import { useState, useRef } from 'react';
import { Icon } from '@/components/icons';
import { customerApi, type Customer } from '@/services/customers/customerService';
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_STATUSES,
  type ProfileFormData,
} from './types';
import type { MeasurementProfile } from '@/services/measurements/measurementsService';
import { DateField, Select } from '@/components/ui';

interface MeasurementFormClientTabProps {
  form: ProfileFormData;
  productTypes: { value: string; label: string }[];
  selectedCustomer: Customer | null;
  customerSearch: string;
  onCustomerSearchChange: (val: string) => void;
  onSelectCustomer: (c: Customer) => void;
  onClearCustomer: () => void;
  onUpdateField: <K extends keyof ProfileFormData>(field: K, val: ProfileFormData[K]) => void;
  onProfileNameTouched: () => void;
}

export function MeasurementFormClientTab({
  form,
  productTypes,
  selectedCustomer,
  customerSearch,
  onCustomerSearchChange,
  onSelectCustomer,
  onClearCustomer,
  onUpdateField,
  onProfileNameTouched,
}: MeasurementFormClientTabProps) {
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchInput(val: string) {
    onCustomerSearchChange(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await customerApi.list({ q: val.trim(), limit: 8 });
        setCustomerResults(res.items);
      } catch {
        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 280);
  }

  return (
    <div className="space-y-4">
      {/* Customer Search & Select */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
          Target Client *
        </label>
        {selectedCustomer ? (
          <div
            className="flex items-center justify-between rounded-xl border p-3 border-brand bg-brand/[0.08]"
          >
            <div>
              <span className="font-bold text-xs">{selectedCustomer.name}</span>
              <span className="text-[10px] opacity-70 block mt-0.5">
                {selectedCustomer.phone ? `${selectedCustomer.phone} • ` : ''}
                ID: {selectedCustomer.id}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClearCustomer();
                setCustomerResults([]);
              }}
              className="rounded-lg px-2.5 py-1 text-[11px] font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              Change Client
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search client directory by name, phone, or email..."
              className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
            {searchingCustomers ? (
              <span className="absolute right-3 top-2.5 text-[10px] opacity-70 animate-pulse">
                Searching directory...
              </span>
            ) : null}

            {customerResults.length > 0 ? (
              <ul
                className="absolute z-30 top-full mt-1 w-full rounded-xl border shadow-xl max-h-48 overflow-y-auto bg-surface-raised border-line"
              >
                {customerResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        setCustomerResults([]);
                      }}
                      className="w-full text-left p-3 hover:bg-current/[0.06] border-b last:border-b-0 cursor-pointer transition flex justify-between items-center border-line"
                    >
                      <div>
                        <span className="font-bold text-xs block">{c.name}</span>
                        <span className="text-[10px] opacity-70 block mt-0.5">
                          {c.phone || 'No phone'} {c.email ? `• ${c.email}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono opacity-70">Select <Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {/* Garment Silhouette & Profile Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Garment Silhouette / Template *
          </label>
          <Select
            value={form.productTypeCode}
            onChange={(value) => onUpdateField('productTypeCode', value)}
            options={productTypes.map((pt) => ({ value: pt.value, label: pt.label }))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Profile Title *
          </label>
          <input
            type="text"
            required
            value={form.profileName}
            onChange={(e) => {
              onProfileNameTouched();
              onUpdateField('profileName', e.target.value);
            }}
            placeholder="e.g. Sangeet Bridal Lehenga"
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
          />
          <p className="text-[10px] opacity-70">Auto-filled from client + silhouette, fully editable</p>
        </div>
      </div>

      {/* Unit, Status & Measured Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Measurement Unit *
          </label>
          <Select
            value={form.unit}
            onChange={(value) => onUpdateField('unit', value)}
            options={MEASUREMENT_UNITS.map((u) => ({ value: u.value, label: u.label }))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Approval Status *
          </label>
          <Select
            value={form.status}
            onChange={(value) =>
              onUpdateField('status', value as MeasurementProfile['status'])
            }
            options={MEASUREMENT_STATUSES.map((st) => ({ value: st.value, label: st.label }))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Sitting / Measured Date
          </label>
          <DateField
            value={form.measuredAt}
            onChange={(value) => onUpdateField('measuredAt', value)}
            />
        </div>
      </div>
    </div>
  );
}
