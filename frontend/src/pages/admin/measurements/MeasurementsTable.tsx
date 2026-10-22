import { useState, useEffect } from 'react';
import type {
  MeasurementProfile,
  MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import { getSilhouetteMeta } from './types';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';

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
  const [menuAnchor, setMenuAnchor] = useState<{
    profile: MeasurementProfile;
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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, p: MeasurementProfile) {
    e.stopPropagation();
    if (menuAnchor?.profile.id === p.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      profile: p,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

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
                const isMenuOpen = menuAnchor?.profile.id === p.id;
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

                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, p)}
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-lg border transition cursor-pointer',
                            isMenuOpen
                              ? 'bg-brand/15 text-brand-strong font-bold'
                              : 'hover:bg-current/[0.08]', isMenuOpen ? 'border-brand' : 'border-line'
                          )}
                          aria-label="Actions menu"
                          aria-expanded={isMenuOpen}
                        >
                          <span className="text-base leading-none font-bold">⋮</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Dropdown Menu */}
      {menuAnchor ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuAnchor(null)}
          />

          <div
            className="fixed z-50 w-52 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs bg-surface-raised border-line text-ink-raised"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuAnchor.profile.status === 'pending_approval' ? (
              <button
                type="button"
                onClick={() => {
                  const target = menuAnchor.profile;
                  setMenuAnchor(null);
                  onApprove(target);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-bold text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
              >
                <Icon name="check" size={14} />
                <span>Approve Fit Profile</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.profile;
                setMenuAnchor(null);
                onPreview(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>View Fit Specification</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.profile;
                setMenuAnchor(null);
                onEdit(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="edit" size={14} />
              <span>Edit Dimensions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.profile;
                setMenuAnchor(null);
                onDuplicate(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="copy" size={14} />
              <span>Duplicate Profile</span>
            </button>

            <div
              className="my-1 border-t border-line"
            />

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.profile;
                setMenuAnchor(null);
                onArchive(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-rose-700 hover:bg-rose-500/10 transition cursor-pointer"
            >
              {menuAnchor.profile.status === 'archived' ? (
                <Icon name="archived" size={14} />
              ) : null}
              <span>{menuAnchor.profile.status === 'archived' ? 'Unarchive Fit' : 'Archive Fit'}</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
