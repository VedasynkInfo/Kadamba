import type { Customer } from '@/services/customers/customerService';

interface CustomerOverviewTabProps {
  customer: Customer;
}

export function CustomerOverviewTab({ customer }: CustomerOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Profile details */}
      <div className="rounded-lg border border-line bg-surface-raised p-6 space-y-6 text-xs">
        <h3 className="font-heading text-lg text-ink border-b border-line pb-2">
          Client profile overview
        </h3>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <span className="text-ink/45 block mb-1">Full name</span>
            <span className="font-medium text-ink text-sm block">{customer.name}</span>
          </div>
          <div>
            <span className="text-ink/45 block mb-1">Primary phone</span>
            <span className="font-medium text-ink text-sm block">{customer.phone}</span>
          </div>
          <div>
            <span className="text-ink/45 block mb-1">WhatsApp number</span>
            <span className="font-medium text-ink text-sm block">
              {customer.whatsapp || customer.phone}
            </span>
          </div>
          <div>
            <span className="text-ink/45 block mb-1">Email address</span>
            <span className="font-medium text-ink text-sm block">
              {customer.email || 'None recorded'}
            </span>
          </div>
          <div>
            <span className="text-ink/45 block mb-1">Client source</span>
            <span className="font-medium text-ink text-sm block capitalize">{customer.source}</span>
          </div>
          <div>
            <span className="text-ink/45 block mb-1">Preferred Unit</span>
            <span className="font-medium text-ink text-sm block uppercase">
              {customer.preferredUnit || 'in'}
            </span>
          </div>
        </div>
      </div>

      {/* Address details */}
      <div className="rounded-lg border border-line bg-surface-raised p-6 space-y-4 text-xs">
        <h3 className="font-heading text-lg text-ink border-b border-line pb-2">
          Locality & address
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-ink/45 block">Address lines</span>
            <span className="font-medium text-ink mt-1 block">
              {customer.address?.line1 || 'No address lines recorded'}
              {customer.address?.line2 && <span className="block mt-0.5">{customer.address.line2}</span>}
            </span>
          </div>
          <div>
            <span className="text-ink/45 block">Landmark</span>
            <span className="font-medium text-ink mt-1 block">{customer.address?.landmark || '—'}</span>
          </div>
          <div>
            <span className="text-ink/45 block">Locality area</span>
            <span className="font-medium text-ink mt-1 block">{customer.address?.locality || '—'}</span>
          </div>
          <div>
            <span className="text-ink/45 block">City / Pincode</span>
            <span className="font-medium text-ink mt-1 block">
              {customer.address?.city || 'Kurnool'} - {customer.address?.pincode || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* General Remark */}
      {customer.notes && (
        <div className="rounded-lg border border-line bg-surface-raised p-6 space-y-2 text-xs">
          <h3 className="font-heading text-lg text-ink border-b border-line pb-2">
            Relationship summaries
          </h3>
          <p className="text-ink/75 leading-relaxed text-sm italic">"{customer.notes}"</p>
        </div>
      )}
    </div>
  );
}
