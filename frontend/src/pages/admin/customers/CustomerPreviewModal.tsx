import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { Customer } from '@/services/customers/customerService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

interface CustomerPreviewModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerPreviewModal({ customer, onClose }: CustomerPreviewModalProps) {
  if (!customer) return null;

  const waHref = whatsappDeepLink(
    customer.whatsapp || customer.phone,
    `Hi ${customer.name}, this is Kadamba's Designer Studio regarding your atelier profile and bridal orders.`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-spring-in text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand/15 text-brand-strong"
            >
              #{customer.id.slice(-6).toUpperCase()}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold',
                customer.portalStatus === 'active'
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : 'opacity-60 bg-current/[0.06]',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {customer.portalStatus === 'active' ? 'Portal Active' : 'No Portal Account'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-xl font-bold font-heading text-inherit">{customer.name}</h3>
            <p className="opacity-70 mt-0.5">
              Acquisition channel: <strong className="capitalize opacity-100 font-semibold">{customer.source || 'Walk-in'}</strong>
            </p>
          </div>

          {/* Contact Details Card */}
          <div
            className="grid grid-cols-2 gap-3 rounded-xl p-3.5 border bg-surface-sunken border-line"
          >
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Primary Mobile</span>
              <span className="font-bold mt-0.5 block font-mono">{customer.phone}</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">WhatsApp Number</span>
              <span className="font-semibold mt-0.5 block font-mono">{customer.whatsapp || customer.phone}</span>
            </div>
            {customer.email ? (
              <div className="col-span-2">
                <span className="opacity-50 block text-[10px] uppercase font-semibold">Email Address</span>
                <span className="font-medium mt-0.5 block opacity-90">{customer.email}</span>
              </div>
            ) : null}
          </div>

          {/* Address Information */}
          {customer.address ? (
            <div
              className="rounded-xl p-3.5 border text-xs space-y-1 bg-surface-sunken border-line"
            >
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Bespoke Atelier Address</span>
              <p className="opacity-90">
                {[
                  customer.address.line1,
                  customer.address.line2,
                  customer.address.locality,
                  customer.address.city,
                  customer.address.state,
                  customer.address.pincode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No address registered.'}
              </p>
            </div>
          ) : null}

          {/* Tags */}
          {customer.tags?.length ? (
            <div>
              <span className="opacity-60 block text-[10px] uppercase font-semibold mb-1.5">Client Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full border text-[11px] opacity-80 border-line"
                  >
                    <Icon name="tag" size={14} className="mr-1 inline align-middle" /> {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-bold text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer border-emerald-500/30"
          >
            <span><Icon name="message" size={14} className="mr-1 inline align-middle" /> WhatsApp Concierge</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
            <Link
              to={`/admin/customers/${customer.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 font-bold shadow-xs transition hover:opacity-95 bg-brand text-ink-on-brand"
            >
              <span>View Full Profile</span>
              <span><Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
