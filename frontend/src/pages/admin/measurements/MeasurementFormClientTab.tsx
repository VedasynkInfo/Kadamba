import { useState, useRef } from 'react';
import { customerApi, type Customer } from '@/services/customers/customerService';
import {
  MEASUREMENT_UNITS,
  MEASUREMENT_STATUSES,
  type ProfileFormData,
} from './types';
import type { MeasurementProfile } from '@/services/measurements/measurementsService';

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
            className="flex items-center justify-between rounded-xl border p-3"
            style={{
              borderColor: 'var(--admin-primary, #b59410)',
              backgroundColor: 'rgba(181, 148, 16, 0.08)',
            }}
          >
            <div>
              <span className="font-bold text-xs">{selectedCustomer.name}</span>
              <span className="text-[10px] opacity-60 block mt-0.5">
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
              className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.05)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
            {searchingCustomers ? (
              <span className="absolute right-3 top-2.5 text-[10px] opacity-50 animate-pulse">
                Searching directory...
              </span>
            ) : null}

            {customerResults.length > 0 ? (
              <ul
                className="absolute z-30 top-full mt-1 w-full rounded-xl border shadow-xl max-h-48 overflow-y-auto"
                style={{
                  backgroundColor: 'var(--admin-card, #1e293b)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                }}
              >
                {customerResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        setCustomerResults([]);
                      }}
                      className="w-full text-left p-3 hover:bg-current/[0.06] border-b last:border-b-0 cursor-pointer transition flex justify-between items-center"
                      style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
                    >
                      <div>
                        <span className="font-bold text-xs block">{c.name}</span>
                        <span className="text-[10px] opacity-60 block mt-0.5">
                          {c.phone || 'No phone'} {c.email ? `• ${c.email}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono opacity-50">Select →</span>
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
          <select
            value={form.productTypeCode}
            onChange={(e) => onUpdateField('productTypeCode', e.target.value)}
            className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-card, #141b26)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          >
            {productTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
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
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          />
          <p className="text-[10px] opacity-50">Auto-filled from client + silhouette, fully editable</p>
        </div>
      </div>

      {/* Unit, Status & Measured Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Measurement Unit *
          </label>
          <select
            value={form.unit}
            onChange={(e) => onUpdateField('unit', e.target.value)}
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-card, #141b26)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          >
            {MEASUREMENT_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Approval Status *
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              onUpdateField('status', e.target.value as MeasurementProfile['status'])
            }
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-card, #141b26)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          >
            {MEASUREMENT_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Sitting / Measured Date
          </label>
          <input
            type="date"
            value={form.measuredAt}
            onChange={(e) => onUpdateField('measuredAt', e.target.value)}
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          />
        </div>
      </div>
    </div>
  );
}
