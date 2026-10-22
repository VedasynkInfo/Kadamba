import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { Lead, LeadStatus } from '@/pages/leads/data';
import { formatLeadDate } from '@/pages/leads/data';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

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
                      <RowActionsMenu
                        label={`Actions for ${lead.name}`}
                        row={lead}
                        actions={[
                          { id: 'preview', label: 'Quick Preview', icon: 'view', onSelect: (row) => onPreview(row) },
                          { id: 'dossier', label: 'Full Lead Dossier', icon: 'copy', onSelect: (row) => navigate(`/admin/leads/${row.id}`) },
                          { id: 'whatsapp', label: 'WhatsApp Chat', icon: 'message', onSelect: (row) => window.open(whatsappDeepLink(row.phone, `Hi ${row.name}, this is Kadamba's Designer Studio regarding your ${row.service} enquiry.`), '_blank', 'noopener,noreferrer') },
                          { id: 'complete', label: 'Mark Completed', icon: 'won', divider: true, onSelect: (row) => onStatusChange(row.id, 'Completed') },
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
