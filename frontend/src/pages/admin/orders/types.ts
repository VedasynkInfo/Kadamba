import { allowedOrderTransitions, ORDER_PRODUCTION_FLOW, type OrderStatus } from '@/shared/enums';
import type { CustomerProfile } from '@/services/orders/orderService';

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  enquiry: { label: 'Enquiry', color: 'bg-stone-500/15 text-stone-400 border-stone-500/30', dotColor: 'bg-stone-400' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dotColor: 'bg-blue-400' },
  measurements: { label: 'Measurements', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', dotColor: 'bg-indigo-400' },
  cutting: { label: 'Pattern / Cutting', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-400' },
  stitching: { label: 'Tailoring / Stitching', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dotColor: 'bg-orange-400' },
  embroidery_maggam: { label: 'Maggam / Aari Work', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', dotColor: 'bg-purple-400' },
  trial: { label: 'Trial & Fitting', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30', dotColor: 'bg-pink-400' },
  finishing: { label: 'Quality Finishing', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', dotColor: 'bg-teal-400' },
  delivery: { label: 'Delivered', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dotColor: 'bg-rose-400' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-400' },
};

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_CONFIG);

/** Display label for a status value, tolerating a value we do not know. */
export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status]?.label ?? status.replace(/_/g, ' ');
}

/** Where a status sits on the happy path, or -1 for cancelled / on hold. */
function productionStageIndex(status: string): number {
  return (ORDER_PRODUCTION_FLOW as readonly OrderStatus[]).indexOf(status as OrderStatus);
}

/**
 * The stages this order may move to next, ready to render.
 *
 * Read from the shared machine rather than listed again here, so the console
 * cannot offer a move the API will refuse with a 409. A delivered order yields
 * an empty list: its lifecycle is complete.
 */
export function orderStatusChoices(from: string): { value: OrderStatus; label: string }[] {
  return allowedOrderTransitions(from as OrderStatus).map((value) => ({
    value,
    label: orderStatusLabel(value),
  }));
}

/**
 * Whether a transition should ask for a reason before it happens.
 *
 * Cancelling or pausing always deserves one, and so does moving *backwards*
 * along the production flow — a finished garment sent back to trial is rework,
 * and the audit trail should record who asked for it and why.
 */
export function transitionNeedsNote(from: string, to: OrderStatus): boolean {
  if (to === 'cancelled' || to === 'on_hold') return true;
  const fromIndex = productionStageIndex(from);
  const toIndex = productionStageIndex(to);
  return fromIndex >= 0 && toIndex >= 0 && toIndex < fromIndex;
}

export const ORDER_PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High Priority' },
  { value: 'rush', label: 'Rush Order' },
];

export interface OrderLineItemForm {
  name: string;
  productTypeCode: string;
  notes: string;
  qty: number;
}

export interface OrderFormData {
  title: string;
  priority: string;
  status: string;
  expectedTrialAt: string;
  expectedDeliveryAt: string;
  totalQuoted: string;
  advance: string;
  initialNotes: string;
  tagsInput: string;
  lineItems: OrderLineItemForm[];
  customerMode: 'search' | 'create';
  selectedCustomer: CustomerProfile | null;
  newCustName: string;
  newCustPhone: string;
  newCustEmail: string;
  newCustCity: string;
  newCustNotes: string;
}

export const createBlankOrderForm = (): OrderFormData => ({
  title: '',
  priority: 'normal',
  status: 'enquiry',
  expectedTrialAt: '',
  expectedDeliveryAt: '',
  totalQuoted: '0',
  advance: '0',
  initialNotes: '',
  tagsInput: '',
  lineItems: [{ name: '', productTypeCode: '', notes: '', qty: 1 }],
  customerMode: 'search',
  selectedCustomer: null,
  newCustName: '',
  newCustPhone: '',
  newCustEmail: '',
  newCustCity: 'Kurnool',
  newCustNotes: '',
});

export interface OrdersMetricsData {
  total: number;
  inProduction: number;
  rushOrders: number;
  readyForTrial: number;
}
