import { useState } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import type { CustomerProfile } from '@/services/orders/orderService';
import { ORDER_PRIORITIES, type OrderFormData } from './types';
import { cn } from '@/utils/cn';

interface OrderCreateModalProps {
  open: boolean;
  onClose: () => void;
  form: OrderFormData;
  setForm: React.Dispatch<React.SetStateAction<OrderFormData>>;
  onSave: () => Promise<void>;
  submitting: boolean;
  // Customer search helpers
  customerSearch: string;
  onCustomerSearchChange: (val: string) => void;
  customerResults: CustomerProfile[];
  searchingCustomers: boolean;
}

export function OrderCreateModal({
  open,
  onClose,
  form,
  setForm,
  onSave,
  submitting,
  customerSearch,
  onCustomerSearchChange,
  customerResults,
  searchingCustomers,
}: OrderCreateModalProps) {
  const [activeTab, setActiveTab] = useState<'client' | 'items' | 'pricing'>('client');

  if (!open) return null;

  function addLineItem() {
    setForm((f) => ({
      ...f,
      lineItems: [...f.lineItems, { name: '', productTypeCode: '', notes: '', qty: 1 }],
    }));
  }

  function removeLineItem(index: number) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((_, i) => i !== index),
    }));
  }

  function updateLineItem(index: number, field: string, val: any) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] text-xs"
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
            <h2 className="font-heading text-lg font-bold text-inherit">Create Atelier Production Order</h2>
            <p className="opacity-60 text-xs mt-0.5">
              Register custom bridal couture, assign milestones, and schedule fittings
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

        {/* Tab Strip */}
        <div
          className="flex border-b px-6 gap-2 bg-current/[0.02]"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
        >
          {[
            { id: 'client', label: '1. Client & Dates', icon: '👤' },
            { id: 'items', label: `2. Garments (${form.lineItems.length})`, icon: '✂️' },
            { id: 'pricing', label: '3. Pricing & Priority', icon: '💎' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'border-[var(--admin-primary,#b59410)] text-[var(--admin-primary,#b59410)]'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'client' ? (
            <div className="space-y-4">
              <Input
                label="Order Project Title *"
                required
                placeholder="e.g. Sravani Reddy Bridal Lehenga & Blouse"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />

              {/* Customer Selector Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold opacity-75">Customer Assignment *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, customerMode: 'search' }))}
                      className={cn(
                        'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                        form.customerMode === 'search'
                          ? 'bg-[var(--admin-primary,#b59410)] text-white'
                          : 'opacity-60 hover:opacity-100',
                      )}
                    >
                      Search Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, customerMode: 'create' }))}
                      className={cn(
                        'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                        form.customerMode === 'create'
                          ? 'bg-[var(--admin-primary,#b59410)] text-white'
                          : 'opacity-60 hover:opacity-100',
                      )}
                    >
                      + New Customer
                    </button>
                  </div>
                </div>

                {form.customerMode === 'search' ? (
                  <div className="space-y-2">
                    {form.selectedCustomer ? (
                      <div
                        className="p-3 rounded-xl border flex items-center justify-between"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <div>
                          <span className="font-bold text-emerald-400 block">{form.selectedCustomer.name}</span>
                          <span className="text-[11px] opacity-75">
                            📞 {form.selectedCustomer.phone} · 📍 {form.selectedCustomer.city || 'Kurnool'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, selectedCustomer: null }))}
                          className="text-xs text-rose-400 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => onCustomerSearchChange(e.target.value)}
                          placeholder="Type name or phone to search customers..."
                          className="w-full rounded-lg border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                            color: 'inherit',
                          }}
                        />
                        {searchingCustomers ? (
                          <div className="py-2 text-[11px] opacity-50 text-center">Searching...</div>
                        ) : customerResults.length > 0 ? (
                          <div
                            className="mt-1 max-h-36 overflow-y-auto rounded-lg border divide-y"
                            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
                          >
                            {customerResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, selectedCustomer: c }))}
                                className="w-full text-left p-2 hover:bg-current/[0.05] flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div>
                                  <span className="font-semibold">{c.name}</span>
                                  <span className="text-[11px] opacity-60 ml-2">{c.phone}</span>
                                </div>
                                <span className="text-[10px] opacity-50">{c.city || 'Kurnool'}</span>
                              </button>
                            ))}
                          </div>
                        ) : customerSearch ? (
                          <div className="py-2 text-[11px] opacity-50 text-center">
                            No customers found. Switch to "+ New Customer" above.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border bg-current/[0.02]" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
                    <Input
                      label="Client Name *"
                      required
                      placeholder="Full Name"
                      value={form.newCustName}
                      onChange={(e) => setForm((f) => ({ ...f, newCustName: e.target.value }))}
                    />
                    <Input
                      label="Phone Number *"
                      required
                      placeholder="10-digit mobile"
                      value={form.newCustPhone}
                      onChange={(e) => setForm((f) => ({ ...f, newCustPhone: e.target.value }))}
                    />
                    <Input
                      label="Email"
                      placeholder="client@example.com"
                      value={form.newCustEmail}
                      onChange={(e) => setForm((f) => ({ ...f, newCustEmail: e.target.value }))}
                    />
                    <Input
                      label="City"
                      placeholder="Kurnool, Hyderabad..."
                      value={form.newCustCity}
                      onChange={(e) => setForm((f) => ({ ...f, newCustCity: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Target Milestone Dates */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Input
                  label="Target Trial / Fitting Date"
                  type="date"
                  value={form.expectedTrialAt}
                  onChange={(e) => setForm((f) => ({ ...f, expectedTrialAt: e.target.value }))}
                />
                <Input
                  label="Final Promised Delivery Date"
                  type="date"
                  value={form.expectedDeliveryAt}
                  onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryAt: e.target.value }))}
                />
              </div>
            </div>
          ) : activeTab === 'items' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold opacity-75">Order Garments & Workload</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-2.5 py-1 rounded text-xs font-bold border hover:bg-current/[0.05] cursor-pointer"
                  style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
                >
                  + Add Garment
                </button>
              </div>

              <div className="space-y-3">
                {form.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border space-y-2 relative"
                    style={{
                      backgroundColor: 'rgba(128, 128, 128, 0.04)',
                      borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs opacity-75">Garment #{idx + 1}</span>
                      {form.lineItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          label="Garment Description *"
                          placeholder="e.g. Zardosi Silk Bridal Blouse"
                          value={item.name}
                          onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          label="Quantity"
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateLineItem(idx, 'qty', Number(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <Input
                      label="Tailoring & Maggam Work Notes"
                      placeholder="e.g. Heavy aari sleeve border, sweetheart neckline, potli buttons"
                      value={item.notes}
                      onChange={(e) => updateLineItem(idx, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total Quoted Price (₹) *"
                  type="number"
                  placeholder="e.g. 35000"
                  value={form.totalQuoted}
                  onChange={(e) => setForm((f) => ({ ...f, totalQuoted: e.target.value }))}
                />
                <Input
                  label="Advance Received (₹)"
                  type="number"
                  placeholder="e.g. 15000"
                  value={form.advance}
                  onChange={(e) => setForm((f) => ({ ...f, advance: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Production Priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  options={ORDER_PRIORITIES}
                />
                <Input
                  label="Tags (Comma separated)"
                  placeholder="bridal, silk, zardosi, VIP"
                  value={form.tagsInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
                />
              </div>

              <Textarea
                label="Initial Atelier Consultation Notes"
                rows={3}
                placeholder="Fabric brought by client, lining requirements, special fitting instructions..."
                value={form.initialNotes}
                onChange={(e) => setForm((f) => ({ ...f, initialNotes: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="text-xs opacity-50">
            {form.title ? `Order: ${form.title}` : 'Title and customer required (*)'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={submitting}
              onClick={onSave}
              className="font-bold shadow-xs"
            >
              {submitting ? 'Creating Order...' : 'Create Production Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
