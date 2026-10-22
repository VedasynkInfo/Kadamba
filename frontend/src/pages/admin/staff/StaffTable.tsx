import type { Staff } from '@/services/staff/staffService';
import { SPECIALIZATIONS } from './types';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

const SKELETON_ROWS = 6;

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface StaffTableProps {
  items: Staff[];
  loading?: boolean;
  onPreview: (s: Staff) => void;
  onEdit: (s: Staff) => void;
  onDeactivate: (s: Staff) => void;
  onReactivate: (s: Staff) => void;
  onNewStaff: () => void;
}

export function StaffTable({
  items,
  loading = false,
  onPreview,
  onEdit,
  onDeactivate,
  onReactivate,
  onNewStaff,
}: StaffTableProps) {

  function getInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
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
            title="No staff members found"
            description="No artisans or staff profiles match your current search filters."
            actionLabel="+ Add Staff Member"
            onAction={onNewStaff}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[950px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[240px]">Artisan / Contact</th>
                <th className="py-3 px-4 w-[140px]">Locality & Type</th>
                <th className="py-3 px-4 min-w-[200px]">Crafts & Skills</th>
                <th className="py-3 px-4 w-[130px]">Salary / Rate</th>
                <th className="py-3 px-4 w-[100px]">Experience</th>
                <th className="py-3 px-4 w-[100px]">Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((s) => {
                const specs = s.specializations || [];

                return (
                  <tr
                    key={s.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Artisan / Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-xs bg-brand text-ink-on-brand"
                        >
                          {getInitials(s.fullName)}
                        </div>
                        <div className="truncate min-w-0">
                          <button
                            type="button"
                            onClick={() => onPreview(s)}
                            className="font-semibold text-xs text-inherit hover:underline block truncate text-left cursor-pointer"
                          >
                            {s.fullName}
                          </button>
                          <span className="text-[11px] opacity-65 block font-mono mt-0.5">
                            {s.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Locality & Type */}
                    <td className="py-3 px-4">
                      <span className="font-medium block truncate">{s.locality || 'Hyderabad'}</span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider mt-1 border',
                          s.employmentType === 'permanent'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : s.employmentType === 'freelance'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
                        )}
                      >
                        {s.employmentType}
                      </span>
                    </td>

                    {/* Skills */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {specs.slice(0, 2).map((spec) => {
                          const label = SPECIALIZATIONS.find((sp) => sp.value === spec)?.label || spec;
                          return (
                            <span
                              key={spec}
                              className="rounded px-2 py-0.5 text-[10px] font-medium border bg-brand/12 border-brand/30 text-brand-strong"
                            >
                              {label}
                            </span>
                          );
                        })}
                        {specs.length > 2 ? (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold opacity-70 border border-current/20">
                            +{specs.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.salaryAmount ? (
                        <div>
                          <span className="font-semibold text-xs">{formatINR(s.salaryAmount)}</span>
                          <span className="text-[10px] opacity-70 block mt-0.5">
                            /{s.salaryType === 'monthly' ? 'month' : s.salaryType}
                          </span>
                        </div>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </td>

                    {/* Experience */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium">
                        {s.yearsExperience ? `${s.yearsExperience} yrs` : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                          s.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 border-rose-500/30',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            s.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400',
                          )}
                        />
                        {s.status}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <RowActionsMenu
                        label={`Actions for ${s.fullName}`}
                        row={s}
                        actions={[
                          { id: 'view', label: 'View Artisan Dossier', icon: 'view', onSelect: (row) => onPreview(row) },
                          { id: 'edit', label: 'Edit Staff Details', icon: 'edit', onSelect: (row) => onEdit(row) },
                          { id: 'whatsapp', label: 'Send WhatsApp', icon: 'whatsapp', hidden: (row) => !row.phone, onSelect: (row) => window.open(whatsappDeepLink(row.phone || '', `Hello ${row.fullName}, update from Kadamba's Designer Studio workshop:`), '_blank', 'noopener,noreferrer') },
                          { id: 'status', label: s.status === 'active' ? 'Deactivate Member' : 'Reactivate Member', icon: s.status === 'active' ? 'idle' : 'play', divider: true, tone: s.status === 'active' ? 'danger' : 'default', onSelect: (row) => (row.status === 'active' ? onDeactivate(row) : onReactivate(row)) },
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
