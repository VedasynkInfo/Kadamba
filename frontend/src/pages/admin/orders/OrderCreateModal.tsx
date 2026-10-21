import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { TabStrip } from '@/components/ui/TabStrip';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import type { CustomerProfile } from '@/services/orders/orderService';
import { zodResolver } from '@/lib/zodResolver';
import { ORDER_PRIORITIES, type OrderFormData } from './types';
import { ORDER_WIZARD_STEPS, orderFormSchema } from './orderFormSchema';
import { cn } from '@/utils/cn';

interface OrderCreateModalProps {
  open: boolean;
  onClose: () => void;
  defaultValues: OrderFormData;
  onSave: (values: OrderFormData) => Promise<void>;
  submitting: boolean;
  // Customer search helpers
  customerSearch: string;
  onCustomerSearchChange: (val: string) => void;
  customerResults: CustomerProfile[];
  searchingCustomers: boolean;
}

/**
 * New Order intake, as a gated three-step wizard.
 *
 * The steps are not decoration: Continue runs the zod fields for the step it is
 * leaving, so the answer to “what is missing?” always points at the screen the
 * user is on. RHF owns the field state; zod owns what a valid order means, and
 * the schema is the same object the tests exercise.
 */
export function OrderCreateModal({
  open,
  onClose,
  defaultValues,
  onSave,
  submitting,
  customerSearch,
  onCustomerSearchChange,
  customerResults,
  searchingCustomers,
}: OrderCreateModalProps) {
  const [step, setStep] = useState(0);

  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const customerMode = watch('customerMode');
  const selectedCustomer = watch('selectedCustomer');
  const title = watch('title');
  const activeStep = ORDER_WIZARD_STEPS[step];

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setStep(0);
  }, [open, reset, defaultValues]);

  async function goNext() {
    const valid = await trigger(activeStep.fields, { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, ORDER_WIZARD_STEPS.length - 1));
  }

  async function goToStep(target: number) {
    if (target <= step) {
      setStep(target);
      return;
    }
    // Moving forward means passing every step in between, not just this one.
    for (let index = step; index < target; index += 1) {
      const valid = await trigger(ORDER_WIZARD_STEPS[index].fields, { shouldFocus: true });
      if (!valid) {
        setStep(index);
        return;
      }
    }
    setStep(target);
  }

  const submit = handleSubmit(async (values) => {
    await onSave(values);
  });

  const customerError = errors.selectedCustomer?.message;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Atelier Production Order"
      description="Register custom bridal couture, assign milestones, and schedule fittings."
      size="lg"
      className="max-h-[92vh]"
      footer={
        <>
          <p className="mr-auto text-xs text-ink/65" aria-live="polite">
            Step {step + 1} of {ORDER_WIZARD_STEPS.length} · {activeStep.label}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={submitting}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              Back
            </Button>
          ) : null}
          {step < ORDER_WIZARD_STEPS.length - 1 ? (
            <Button type="button" variant="admin" size="sm" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              form="order-wizard-form"
              variant="admin"
              size="sm"
              disabled={submitting}
              className="font-bold shadow-xs"
            >
              {submitting ? 'Creating Order…' : 'Create Production Order'}
            </Button>
          )}
        </>
      }
    >
      <TabStrip
        items={ORDER_WIZARD_STEPS.map((item, index) => ({
          id: item.id,
          label: `${index + 1}. ${item.label}${item.id === 'items' ? ` (${fields.length})` : ''}`,
          icon: item.icon,
        }))}
        value={activeStep.id}
        onChange={(id) => {
          const target = ORDER_WIZARD_STEPS.findIndex((item) => item.id === id);
          if (target >= 0) void goToStep(target);
        }}
        layoutId="order-wizard-tab"
        className="-mx-1 mb-4"
        itemClassName="px-3.5"
      />

      <form
        id="order-wizard-form"
        onSubmit={submit}
        noValidate
        className="max-h-[52vh] space-y-4 overflow-y-auto pr-1"
      >
        {activeStep.id === 'client' ? (
          <div className="space-y-4">
            <Input
              label="Order Project Title *"
              required
              placeholder="e.g. Sravani Reddy Bridal Lehenga & Blouse"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold opacity-90">Customer Assignment *</span>
                <div className="flex items-center gap-2">
                  {(['search', 'create'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue('customerMode', mode, { shouldValidate: true })}
                      aria-pressed={customerMode === mode}
                      className={cn(
                        'rounded px-2.5 py-1 text-[11px] font-semibold transition',
                        customerMode === mode
                          ? 'bg-brand text-ink-on-brand'
                          : 'text-ink/65 hover:text-ink',
                      )}
                    >
                      {mode === 'search' ? 'Search Directory' : '+ New Customer'}
                    </button>
                  ))}
                </div>
              </div>

              {customerMode === 'search' ? (
                <div className="space-y-2">
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3">
                      <div>
                        <span className="block font-bold text-emerald-400">
                          {selectedCustomer.name}
                        </span>
                        <span className="text-[11px] text-ink/75">
                          <Icon
                            name="phoneCall"
                            size={14}
                            className="mr-1 inline align-middle"
                          />{' '}
                          {selectedCustomer.phone} ·{' '}
                          <Icon name="location" size={14} className="mr-1 inline align-middle" />{' '}
                          {selectedCustomer.city || 'Kurnool'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue('selectedCustomer', null, { shouldValidate: true })}
                        className="rounded-sm text-xs text-rose-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="order-customer-search" className="sr-only">
                        Search customers by name or phone
                      </label>
                      <input
                        id="order-customer-search"
                        type="search"
                        value={customerSearch}
                        onChange={(event) => onCustomerSearchChange(event.target.value)}
                        placeholder="Type name or phone to search customers…"
                        className="w-full rounded-lg border border-line bg-surface-field px-3 py-2 text-xs text-ink-raised placeholder:text-ink/60 focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                      {searchingCustomers ? (
                        <div className="py-2 text-center text-[11px] text-ink/65">Searching…</div>
                      ) : customerResults.length > 0 ? (
                        <ul className="mt-1 max-h-36 divide-y overflow-y-auto rounded-lg border border-line">
                          {customerResults.map((customer) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setValue('selectedCustomer', customer, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                }
                                className="flex w-full items-center justify-between p-2 text-left text-xs hover:bg-current/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                              >
                                <span>
                                  <span className="font-semibold">{customer.name}</span>
                                  <span className="ml-2 text-[11px] text-ink/65">
                                    {customer.phone}
                                  </span>
                                </span>
                                <span className="text-[10px] text-ink/65">
                                  {customer.city || 'Kurnool'}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : customerSearch ? (
                        <p className="py-2 text-center text-[11px] text-ink/65">
                          No customers found. Switch to “+ New Customer” above.
                        </p>
                      ) : null}
                    </div>
                  )}
                  {customerError ? (
                    <p role="alert" className="text-xs text-rose-400">
                      {customerError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-current/[0.02] p-3">
                  <Input
                    label="Client Name *"
                    required
                    placeholder="Full Name"
                    error={errors.newCustName?.message}
                    {...register('newCustName')}
                  />
                  <Input
                    label="Phone Number *"
                    required
                    inputMode="tel"
                    placeholder="10-digit mobile"
                    error={errors.newCustPhone?.message}
                    {...register('newCustPhone')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="client@example.com"
                    error={errors.newCustEmail?.message}
                    {...register('newCustEmail')}
                  />
                  <Input
                    label="City"
                    placeholder="Kurnool, Hyderabad…"
                    error={errors.newCustCity?.message}
                    {...register('newCustCity')}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Input
                label="Target Trial / Fitting Date"
                type="date"
                error={errors.expectedTrialAt?.message}
                {...register('expectedTrialAt')}
              />
              <Input
                label="Final Promised Delivery Date"
                type="date"
                error={errors.expectedDeliveryAt?.message}
                {...register('expectedDeliveryAt')}
              />
            </div>
          </div>
        ) : activeStep.id === 'items' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-90">Order Garments & Workload</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ name: '', productTypeCode: '', notes: '', qty: 1 })}
              >
                + Add Garment
              </Button>
            </div>

            {errors.lineItems?.message ? (
              <p role="alert" className="text-xs text-rose-400">
                {errors.lineItems.message}
              </p>
            ) : null}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative space-y-2 rounded-xl border border-line bg-surface-sunken p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-90">Garment #{index + 1}</span>
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-rose-400 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        <Icon name="close" size={14} /> Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Input
                        label="Garment Description *"
                        placeholder="e.g. Zardosi Silk Bridal Blouse"
                        error={errors.lineItems?.[index]?.name?.message}
                        {...register(`lineItems.${index}.name`)}
                      />
                    </div>
                    <div>
                      <Input
                        label="Quantity"
                        type="number"
                        min={1}
                        error={errors.lineItems?.[index]?.qty?.message}
                        {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <Input
                    label="Tailoring & Maggam Work Notes"
                    placeholder="e.g. Heavy aari sleeve border, sweetheart neckline, potli buttons"
                    error={errors.lineItems?.[index]?.notes?.message}
                    {...register(`lineItems.${index}.notes`)}
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
                min={0}
                placeholder="e.g. 35000"
                error={errors.totalQuoted?.message}
                {...register('totalQuoted')}
              />
              <Input
                label="Advance Received (₹)"
                type="number"
                min={0}
                placeholder="e.g. 15000"
                error={errors.advance?.message}
                {...register('advance')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Production Priority"
                options={ORDER_PRIORITIES}
                error={errors.priority?.message}
                {...register('priority')}
              />
              <Input
                label="Tags (Comma separated)"
                placeholder="bridal, silk, zardosi, VIP"
                error={errors.tagsInput?.message}
                {...register('tagsInput')}
              />
            </div>

            <Textarea
              label="Initial Atelier Consultation Notes"
              rows={3}
              placeholder="Fabric brought by client, lining requirements, special fitting instructions…"
              error={errors.initialNotes?.message}
              {...register('initialNotes')}
            />

            <p className="text-xs text-ink/65">
              {title ? `Creating: ${title}` : 'Title and customer are required to continue.'}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
