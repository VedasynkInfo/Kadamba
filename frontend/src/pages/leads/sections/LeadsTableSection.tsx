import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '@/components/ui';
import { cn } from '@/utils/cn';
import { whatsappDeepLink } from '@/utils/whatsapp';
import {
  downloadCsv,
  filterLeads,
  formatLeadDate,
  leadAssignees,
  LEAD_STATUSES,
  leadsToCsv,
  statusTone,
  type Lead,
  type LeadStatus,
} from '../data';

interface LeadsTableSectionProps {
  leads: Lead[];
  title?: string;
  description?: string;
}

/**
 * Searchable, filterable lead list with CSV export.
 */
export function LeadsTableSection({
  leads,
  title = 'All leads',
  description = 'Search, filter by status or desk, and export CSV.',
}: LeadsTableSectionProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'All'>('All');
  const [assignee, setAssignee] = useState<string | 'All'>('All');

  const filtered = useMemo(
    () => filterLeads(leads, query, status, assignee),
    [leads, query, status, assignee],
  );

  function exportCsv() {
    downloadCsv(`kadamba-leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(filtered));
  }

  function waHref(lead: Lead) {
    return whatsappDeepLink(
      lead.phone,
      `Hi ${lead.name}, this is Kadamba's Designer Studio (Kurnool) regarding your ${lead.service} enquiry.`,
    );
  }

  return (
    <section className="px-4 py-12 sm:px-6 md:px-10 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-3xl text-black md:text-4xl">{title}</h2>
            <p className="text-lede mt-3 text-black/65">{description}</p>
          </div>
          <Button variant="luxury" size="md" onClick={exportCsv}>
            Export CSV ({filtered.length})
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Input
            id="leads-search"
            type="search"
            label="Search"
            placeholder="Name, phone, service…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            id="leads-status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | 'All')}
            options={[
              { value: 'All', label: 'All statuses' },
              ...LEAD_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            id="leads-assignee"
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            options={[
              { value: 'All', label: 'All desks' },
              ...leadAssignees.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.2em] text-black/45">
                <th className="py-3 pr-4 font-medium">Lead</th>
                <th className="py-3 pr-4 font-medium">Service</th>
                <th className="py-3 pr-4 font-medium">Order</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Desk</th>
                <th className="py-3 pr-4 font-medium">Updated</th>
                <th className="py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-black/8 transition hover:bg-black/[0.02]"
                >
                  <td className="py-4 pr-4">
                    <p className="font-heading text-lg text-black">{lead.name}</p>
                    <p className="mt-0.5 text-xs text-black/50">
                      {lead.phone} · {lead.city}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-black/75">
                    {lead.service}
                    <span className="mt-0.5 block text-xs text-black/45">{lead.source}</span>
                  </td>
                  <td className="py-4 pr-4 text-sm text-black/75">
                    {lead.orderNumber ? (
                      <button
                        type="button"
                        className="text-left hover:text-gold"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.orderId) navigate(`/admin/orders/${lead.orderId}`);
                        }}
                      >
                        #{lead.orderNumber}
                        {lead.referenceId ? (
                          <span className="mt-0.5 block text-xs text-black/45">{lead.referenceId}</span>
                        ) : (
                          <span className="mt-0.5 block text-xs text-black/45">Enquiry</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-black/35">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={cn(
                        'inline-block border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em]',
                        statusTone(lead.status),
                      )}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-black/70">{lead.assignee}</td>
                  <td className="py-4 pr-4 text-xs text-black/50">
                    {formatLeadDate(lead.updatedAt)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <a
                        href={waHref(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        WhatsApp
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="border border-black/15"
                        onClick={() => navigate(`/admin/leads/${lead.id}`)}
                      >
                        Open
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <ul className="mt-8 list-none space-y-4 md:hidden">
          {filtered.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => navigate(`/admin/leads/${lead.id}`)}
                className="w-full border-t border-black/12 pt-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl">{lead.name}</p>
                    <p className="mt-1 text-sm text-black/60">{lead.service}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 border px-2 py-1 text-[0.6rem] uppercase tracking-[0.14em]',
                      statusTone(lead.status),
                    )}
                  >
                    {lead.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-black/45">
                  {lead.orderNumber ? `Order #${lead.orderNumber} · ` : ''}
                  {lead.assignee} · {formatLeadDate(lead.updatedAt)}
                </p>
              </button>
              <a
                href={waHref(lead)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-emerald-700"
                onClick={(e) => e.stopPropagation()}
              >
                WhatsApp
              </a>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-black/55">No leads match these filters.</p>
        ) : null}
      </div>
    </section>
  );
}
