import type {
  MeasurementProfile,
  MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import { getSilhouetteMeta } from './types';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

const SKELETON_ROWS = 6;

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface MeasurementsTableProps {
  items: MeasurementProfile[];
  templates: MeasurementTemplate[];
  loading?: boolean;
  approvingId?: string | null;
  onPreview: (p: MeasurementProfile) => void;
  onEdit: (p: MeasurementProfile) => void;
  onApprove: (p: MeasurementProfile) => void;
  onDuplicate: (p: MeasurementProfile) => void;
  onArchive: (p: MeasurementProfile) => void;
  onNewMeasurement: () => void;
}

export function MeasurementsTable({
  items,
  templates,
  loading = false,
  approvingId = null,
  onPreview,
  onEdit,
  onApprove,
  onDuplicate,
  onArchive,
  onNewMeasurement,
}: MeasurementsTableProps) {

  function getInitials(name?: string) {
    if (!name) return 'CL';
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
            title="No measurement fit cards found"
            description="No couture anatomical specifications match your search or filter."
            actionLabel="+ Create Fit Profile"
            onAction={onNewMeasurement}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[950px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[240px]">Client / Contact</th>
                <th className="py-3 px-4 min-w-[220px]">Silhouette & Fit Name</th>
                <th className="py-3 px-4 w-[130px]">Dimensions</th>
                <th className="py-3 px-4 w-[140px]">Recorded Date</th>
                <th className="py-3 px-4 w-[120px]">Status</th>
                <th className="py-3 px-4 w-[130px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="stagger-rows divide-y border-line"
            >
              {items.map((p) => {
                const silhouette = getSilhouetteMeta(p.productTypeCode, templates);
                const valuesCount = Object.keys(p.values || {}).length;
                const isPending = p.status === 'pending_approval';
                const isApproving = approvingId === p.id;

                return (
                  <tr
                    key={p.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Client & Phone */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-xs bg-brand text-ink-on-brand"
                        >
                          {getInitials(p.customerName)}
                        </div>
                        <div className="truncate min-w-0">
                          <button
                            type="button"
                            onClick={() => onPreview(p)}
                            className="font-semibold text-xs text-inherit hover:underline block truncate text-left cursor-pointer"
                          >
                            {p.customerName || 'Walk-in Client'}
                          </button>
                          <span className="text-[11px] opacity-70 block font-mono mt-0.5 truncate">
                            ID: {p.customerId ? p.customerId.slice(-6).toUpperCase() : 'General'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Silhouette & Profile Name */}
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[240px]">
                        <span className="font-semibold block truncate">{p.profileName}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-brand/12 border-brand/30 text-brand-strong"
                          >
                            <Icon name={silhouette.icon} size={13} />
                        {silhouette.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dimensions Count */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-xs">{valuesCount} Points</span>
                      <span className="text-[10px] opacity-70 block mt-0.5 uppercase">
                        in {p.unit || 'inches'}
                      </span>
                    </td>

                    {/* Recorded Date & Tailor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium block">{formatDate(p.measuredAt)}</span>
                      <span className="text-[10px] opacity-70 block mt-0.5 truncate max-w-[120px]">
                        By {p.measuredBy || 'Atelier Master'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                          p.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : p.status === 'pending_approval'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : p.status === 'draft'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            p.status === 'active'
                              ? 'bg-emerald-400'
                              : p.status === 'pending_approval'
                              ? 'bg-amber-400'
                              : 'bg-stone-400',
                          )}
                        />
                        {p.status === 'pending_approval' ? 'Pending' : p.status}
                      </span>
                    </td>

                    {/* Actions: Direct Approve if Pending + Menu Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => onApprove(p)}
                            disabled={isApproving}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer disabled:opacity-70"
                            title="Approve measurement specification"
                          >
                            <span><Icon name="check" size={14} className="mr-1 inline align-middle" /> </span>
                            <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                          </button>
                        ) : null}

                        <RowActionsMenu
                          label={`Actions for ${p.customerName}`}
                          row={p}
                          actions={[
                            { id: 'approve', label: 'Approve Fit Profile', icon: 'check', hidden: (row) => row.status !== 'pending_approval', onSelect: (row) => onApprove(row) },
                            { id: 'view', label: 'View Fit Specification', icon: 'view', onSelect: (row) => onPreview(row) },
                            { id: 'edit', label: 'Edit Dimensions', icon: 'edit', onSelect: (row) => onEdit(row) },
                            { id: 'duplicate', label: 'Duplicate Profile', icon: 'copy', onSelect: (row) => onDuplicate(row) },
                            { id: 'archive', label: p.status === 'archived' ? 'Unarchive Fit' : 'Archive Fit', icon: 'archived', divider: true, tone: p.status === 'archived' ? 'default' : 'danger', onSelect: (row) => onArchive(row) },
                          ]}
                        />
                      </div>
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
