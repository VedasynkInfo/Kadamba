import { useNavigate } from 'react-router-dom';
import type { Customer } from '@/services/customers/customerService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

const SKELETON_ROWS = 6;

interface CustomersTableProps {
  items: Customer[];
  loading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onNewCustomer: () => void;
  onPreview: (customer: Customer) => void;
}

export function CustomersTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onNewCustomer,
  onPreview,
}: CustomersTableProps) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl border shadow-xs overflow-visible transition-colors bg-surface-raised border-line text-ink-raised"
    >
      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} variant="table" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No clients found"
            description={
              hasActiveFilters
                ? 'No client profiles match your filter criteria. Try adjusting or resetting your search.'
                : 'Register clients to manage bespoke measurements, production orders, and couture invoices.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Register First Client'}
            onAction={hasActiveFilters ? onResetFilters : onNewCustomer}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 min-w-[200px]">Client / Code</th>
                <th className="py-3 px-4 w-[150px]">Contact Mobile</th>
                <th className="py-3 px-4 w-[140px]">Locality & City</th>
                <th className="py-3 px-4 w-[130px]">Portal Access</th>
                <th className="py-3 px-4 w-[110px]">Open Orders</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((customer) => {

                return (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Client Name & Code */}
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(customer)}
                          className="font-semibold text-inherit text-left hover:underline text-xs sm:text-sm truncate max-w-[220px] block cursor-pointer"
                        >
                          {customer.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] opacity-70">
                          <span className="font-mono">#{customer.id.slice(-6).toUpperCase()}</span>
                          {customer.source ? (
                            <span className="capitalize">· {customer.source}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Contact Mobile */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs">{customer.phone}</span>
                      {customer.email ? (
                        <span className="block text-[10px] opacity-70 truncate max-w-[140px]">{customer.email}</span>
                      ) : null}
                    </td>

                    {/* Locality & City */}
                    <td className="py-3 px-4">
                      <span className="text-xs truncate block max-w-[130px]">
                        {customer.address?.locality || customer.address?.city || 'Kurnool'}
                      </span>
                    </td>

                    {/* Portal Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          customer.portalStatus === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                            : 'opacity-70 border-current/15',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1 w-1 rounded-full',
                            customer.portalStatus === 'active' ? 'bg-emerald-500' : 'bg-current opacity-40',
                          )}
                        />
                        {customer.portalStatus === 'active' ? 'Active Login' : 'No Account'}
                      </span>
                    </td>

                    {/* Open Orders */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs opacity-75">
                        {customer.orderCount ? (
                          <span className="text-blue-500 font-bold">{customer.orderCount} Orders</span>
                        ) : (
                          '0 Orders'
                        )}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <RowActionsMenu
                        label={`Actions for ${customer.name}`}
                        row={customer}
                        actions={[
                          { id: 'preview', label: 'Quick Preview', icon: 'view', onSelect: (row) => onPreview(row) },
                          { id: 'profile', label: 'Client Profile & Measurements', icon: 'user', onSelect: (row) => navigate(`/admin/customers/${row.id}`) },
                          { id: 'whatsapp', label: 'WhatsApp Concierge', icon: 'message', onSelect: (row) => window.open(whatsappDeepLink(row.whatsapp || row.phone, `Hi ${row.name}, this is Kadamba's Designer Studio regarding your atelier account.`), '_blank', 'noopener,noreferrer') },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      
    </div>
  );
}
