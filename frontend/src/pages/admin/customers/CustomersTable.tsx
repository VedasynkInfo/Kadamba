import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { Customer } from '@/services/customers/customerService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

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
  const [menuAnchor, setMenuAnchor] = useState<{
    customer: Customer;
    top: number;
    right: number;
    showAbove: boolean;
  } | null>(null);

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAnchor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuAnchor]);

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, customer: Customer) {
    e.stopPropagation();
    if (menuAnchor?.customer.id === customer.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      customer,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

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
              className="divide-y border-line"
            >
              {items.map((customer) => {
                const isMenuOpen = menuAnchor?.customer.id === customer.id;

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
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] opacity-60">
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
                        <span className="block text-[10px] opacity-50 truncate max-w-[140px]">{customer.email}</span>
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
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'opacity-60 border-current/15',
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
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, customer)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-brand/15 text-brand font-bold'
                            : 'hover:bg-current/[0.08]', isMenuOpen ? 'border-brand' : 'border-line'
                        )}
                        aria-label="Actions menu"
                        aria-expanded={isMenuOpen}
                      >
                        <span className="text-base leading-none font-bold">⋮</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Dropdown */}
      {menuAnchor ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuAnchor(null)}
          />

          <div
            className="fixed z-50 w-48 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs bg-surface-raised border-line text-ink-raised"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const c = menuAnchor.customer;
                setMenuAnchor(null);
                onPreview(c);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>Quick Preview</span>
            </button>

            <Link
              to={`/admin/customers/${menuAnchor.customer.id}`}
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="user" size={14} />
              <span>Client Profile & Measurements</span>
            </Link>

            <a
              href={whatsappDeepLink(
                menuAnchor.customer.whatsapp || menuAnchor.customer.phone,
                `Hi ${menuAnchor.customer.name}, this is Kadamba's Designer Studio regarding your atelier account.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
            >
              <Icon name="message" size={14} />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
