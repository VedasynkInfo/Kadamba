import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui';
import { PortalShell } from '@/components/ui/PortalShell';
import { Icon, type GlyphName } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { customerApi } from '@/services/customers/customerService';
import { leadsAdminApi } from '@/services/leads/leadService';
import { ordersApi } from '@/services/orders/orderService';
import { visibleAdminNavGroups } from '../data';

/**
 * The console's command palette.
 *
 * A boutique console has sixteen desks and a person who knows which one they
 * want. The palette is the two-keystroke path to it: ⌘K, type two letters, go.
 *
 * It answers three kinds of question, in that order:
 *   - "where do I go?"      the desks, filtered by what this user may open
 *   - "what do I make?"     the four things a studio makes
 *   - "where is that?"      the records themselves, searched as you type
 *
 * The record search is the only part that touches the network, so it is
 * debounced and only runs once there is something to search for.
 */

interface PaletteResult {
  id: string;
  label: string;
  hint?: string;
  to: string;
  icon: GlyphName;
}

interface PaletteResults {
  leads: PaletteResult[];
  orders: PaletteResult[];
  customers: PaletteResult[];
}

const EMPTY_RESULTS: PaletteResults = { leads: [], orders: [], customers: [] };

/** What a studio makes, and where that thing is made. */
const CREATE_ACTIONS: { label: string; to: string; icon: GlyphName; hint: string }[] = [
  { label: 'New order', to: '/admin/orders?new=1', icon: 'orders', hint: 'Atelier' },
  { label: 'New lead', to: '/admin/leads?new=1', icon: 'leads', hint: 'Enquiry' },
  { label: 'New customer', to: '/admin/customers?new=1', icon: 'customers', hint: 'Client' },
  { label: 'New fitting', to: '/admin/measurements?new=1', icon: 'measurements', hint: 'Fit card' },
];

const RESULT_LIMIT = 5;

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PaletteResults>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  // Guards against a slow response overwriting a newer one.
  const requestId = useRef(0);

  const desks = useMemo(
    () => visibleAdminNavGroups(user).flatMap((group) => group.items),
    [user],
  );

  // A fresh palette each time: the last search is not what you want to see.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY_RESULTS);
      setSearching(false);
    }
  }, [open]);

  // Search the records, once there is something to search for.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }

    setSearching(true);
    const id = requestId.current + 1;
    requestId.current = id;

    const timer = window.setTimeout(async () => {
      const [leads, orders, customers] = await Promise.all([
        leadsAdminApi
          .list({ q: term, limit: RESULT_LIMIT })
          .then((page) => page.items ?? [])
          .catch(() => []),
        ordersApi
          .list({ q: term, limit: RESULT_LIMIT })
          .then((page) => page.items ?? [])
          .catch(() => []),
        customerApi
          .list({ q: term, limit: RESULT_LIMIT })
          .then((page) => page.items ?? [])
          .catch(() => []),
      ]);

      if (requestId.current !== id) return;
      setResults({
        leads: leads.slice(0, RESULT_LIMIT).map((lead) => ({
          id: lead.id,
          label: lead.name,
          hint: lead.service || lead.city || undefined,
          to: `/admin/leads/${lead.id}`,
          icon: 'leads',
        })),
        orders: orders.slice(0, RESULT_LIMIT).map((order) => ({
          id: order.id,
          label: `#${order.orderNumber} ${order.title}`,
          hint: order.customerId?.name,
          to: `/admin/orders/${order.id}`,
          icon: 'orders',
        })),
        customers: customers.slice(0, RESULT_LIMIT).map((customer) => ({
          id: customer.id,
          label: customer.name,
          hint: customer.phone,
          to: `/admin/customers/${customer.id}`,
          icon: 'customers',
        })),
      });
      setSearching(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  function go(to: string) {
    onOpenChange(false);
    navigate(to);
  }

  const hasRecords =
    results.leads.length > 0 || results.orders.length > 0 || results.customers.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <PortalShell>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-modal="true"
            className="fixed left-1/2 top-[12vh] z-50 w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface-raised text-ink-raised shadow-2xl outline-none"
          >
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <Dialog.Description className="sr-only">
              Search the console: jump to a desk, start something, or find a record.
            </Dialog.Description>

            <Command
              // The palette should feel instant even while records are loading.
              shouldFilter={true}
              loop
              className="border-0"
            >
              <div className="flex items-center gap-2 border-b border-line px-3">
                <Icon name="search" size={16} className="text-ink/70" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search the console…"
                  className="h-12"
                />
                <CommandShortcut>⌘K</CommandShortcut>
              </div>

              <CommandList className="max-h-[60vh]">
                <CommandEmpty>
                  <span className="block py-6 text-center text-sm text-ink/70">
                    Nothing matches “{query}”.
                  </span>
                </CommandEmpty>

                <CommandGroup heading="Go to">
                  {desks.map((desk) => (
                    <CommandItem
                      key={desk.to}
                      value={`${desk.label} ${desk.to}`}
                      onSelect={() => go(desk.to)}
                    >
                      <Icon name={desk.icon} size={16} className="text-ink/70" />
                      <span>{desk.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Make">
                  {CREATE_ACTIONS.map((action) => (
                    <CommandItem
                      key={action.to}
                      value={`${action.label} ${action.hint}`}
                      onSelect={() => go(action.to)}
                    >
                      <Icon name={action.icon} size={16} className="text-ink/70" />
                      <span>{action.label}</span>
                      <CommandShortcut>{action.hint}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {searching ? (
                  <div className="px-2.5 py-3 text-xs text-ink/70">Searching the studio…</div>
                ) : null}

                {results.leads.length > 0 ? (
                  <CommandGroup heading="Leads">
                    {results.leads.map((lead) => (
                      <CommandItem
                        key={lead.id}
                        value={`${lead.label} ${lead.hint ?? ''} lead`}
                        onSelect={() => go(lead.to)}
                      >
                        <Icon name="leads" size={16} className="text-ink/70" />
                        <span className="truncate">{lead.label}</span>
                        {lead.hint ? (
                          <CommandShortcut className="truncate">{lead.hint}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {results.orders.length > 0 ? (
                  <CommandGroup heading="Orders">
                    {results.orders.map((order) => (
                      <CommandItem
                        key={order.id}
                        value={`${order.label} ${order.hint ?? ''} order`}
                        onSelect={() => go(order.to)}
                      >
                        <Icon name="orders" size={16} className="text-ink/70" />
                        <span className="truncate">{order.label}</span>
                        {order.hint ? (
                          <CommandShortcut className="truncate">{order.hint}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {results.customers.length > 0 ? (
                  <CommandGroup heading="Customers">
                    {results.customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.label} ${customer.hint ?? ''} customer`}
                        onSelect={() => go(customer.to)}
                      >
                        <Icon name="customers" size={16} className="text-ink/70" />
                        <span className="truncate">{customer.label}</span>
                        {customer.hint ? (
                          <CommandShortcut className="truncate">{customer.hint}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {!hasRecords && query.trim().length >= 2 && !searching ? (
                  <div className="px-2.5 py-3 text-xs text-ink/70">
                    No lead, order or customer matches “{query.trim()}”.
                  </div>
                ) : null}
              </CommandList>
            </Command>
          </Dialog.Content>
        </PortalShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
