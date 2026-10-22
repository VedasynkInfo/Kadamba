import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { Lead, LeadStatus } from '@/pages/leads/data';
import { formatLeadDate } from '@/pages/leads/data';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

const SKELETON_ROWS = 6;

interface LeadsTableProps {
  items: Lead[];
  loading?: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onNewLead: () => void;
  onPreview: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

export function LeadsTable({
  items,
  loading = false,
  hasActiveFilters,
  onResetFilters,
  onNewLead,
  onPreview,
  onStatusChange,
}: LeadsTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    lead: Lead;
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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, lead: Lead) {
    e.stopPropagation();
    if (menuAnchor?.lead.id === lead.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      lead,
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
            title="No leads in this pipeline view"
            description={
              hasActiveFilters
                ? 'No client enquiries match the current filters. Try changing or clearing your filters.'
                : 'Intake new enquiries from walk-in consultations, WhatsApp chats, and digital leads.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Add New Lead'}
            onAction={hasActiveFilters ? onResetFilters : onNewLead}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 min-w-[200px]">Client / Contact</th>
                <th className="py-3 px-4 w-[140px]">Quality / Score</th>
                <th className="py-3 px-4 w-[140px]">Service & Source</th>
                <th className="py-3 px-4 w-[130px]">Assigned Desk</th>
                <th className="py-3 px-4 w-[120px]">Follow-Up</th>
                <th className="py-3 px-4 w-[110px]">Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((lead) => {
                const isMenuOpen = menuAnchor?.lead.id === lead.id;

                return (
                  <tr
                    key={lead.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Client Name & Phone */}
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(lead)}
                          className="font-semibold text-inherit text-left hover:underline text-xs sm:text-sm truncate max-w-[220px] block cursor-pointer"
                        >
                          {lead.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] opacity-70">
                          <span>{lead.phone}</span>
                          {lead.city ? <span>· {lead.city}</span> : null}
                        </div>
                      </div>
                    </td>

                    {/* Quality & Score */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            lead.quality === 'hot'
                              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                              : lead.quality === 'warm'
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              : 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
                          )}
                        >
                          <Icon
                            name={
                              lead.quality === 'hot'
                                ? 'hot'
                                : lead.quality === 'warm'
                                  ? 'priorityHigh'
                                  : 'cold'
                            }
                            size={13}
                          />
                          {lead.quality || 'warm'}
                        </span>
                        <span className="font-mono text-[11px] font-semibold opacity-75">
                          {lead.score ?? 50}/100
                        </span>
                      </div>
                    </td>

                    {/* Service & Source */}
                    <td className="py-3 px-4">
                      <span className="font-medium truncate block max-w-[130px]">{lead.service}</span>
                      <span className="text-[10px] opacity-70 capitalize">{lead.source || 'website'}</span>
                    </td>

                    {/* Assigned Desk */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs opacity-75 font-medium">{lead.assignee || 'Unassigned'}</span>
                    </td>

                    {/* Follow-Up / Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] opacity-70">
                        {lead.nextFollowUpDate ? formatLeadDate(lead.nextFollowUpDate) : 'Pending'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                          lead.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                            : lead.status === 'Rejected'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : lead.status === 'Appointment'
                            ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                            : 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, lead)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-brand/15 text-brand-strong font-bold'
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
                const ld = menuAnchor.lead;
                setMenuAnchor(null);
                onPreview(ld);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>Quick Preview</span>
            </button>

            <Link
              to={`/admin/leads/${menuAnchor.lead.id}`}
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="copy" size={14} />
              <span>Full Lead Dossier</span>
            </Link>

            <a
              href={whatsappDeepLink(
                menuAnchor.lead.phone,
                `Hi ${menuAnchor.lead.name}, this is Kadamba's Designer Studio regarding your ${menuAnchor.lead.service} enquiry.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-700 hover:bg-emerald-500/10 transition cursor-pointer"
            >
              <Icon name="message" size={14} />
              <span>WhatsApp Chat</span>
            </a>

            <div
              className="my-1 border-t border-line"
            />

            <button
              type="button"
              onClick={() => {
                const id = menuAnchor.lead.id;
                setMenuAnchor(null);
                onStatusChange(id, 'Completed');
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-700 hover:bg-emerald-500/10 cursor-pointer"
            >
              <Icon name="won" size={14} />
              <span>Mark Completed</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
