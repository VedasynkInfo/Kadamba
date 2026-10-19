import { useState, useEffect } from 'react';
import type { Staff } from '@/services/staff/staffService';
import { SPECIALIZATIONS } from './types';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

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
  const [menuAnchor, setMenuAnchor] = useState<{
    staff: Staff;
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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, s: Staff) {
    e.stopPropagation();
    if (menuAnchor?.staff.id === s.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      staff: s,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
  }

  return (
    <div
      className="rounded-xl border shadow-xs overflow-visible transition-colors"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
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
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75"
                style={{
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                }}
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
              className="divide-y"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
            >
              {items.map((s) => {
                const isMenuOpen = menuAnchor?.staff.id === s.id;
                const specs = s.specializations || [];

                return (
                  <tr
                    key={s.id}
                    className="transition hover:bg-current/[0.03] group"
                    style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
                  >
                    {/* Artisan / Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-xs"
                          style={{
                            backgroundColor: 'var(--admin-primary, #b59410)',
                            color: 'var(--admin-primary-text, #ffffff)',
                          }}
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
                              className="rounded px-2 py-0.5 text-[10px] font-medium border"
                              style={{
                                backgroundColor: 'rgba(181, 148, 16, 0.12)',
                                borderColor: 'rgba(181, 148, 16, 0.3)',
                                color: 'var(--admin-primary, #b59410)',
                              }}
                            >
                              {label}
                            </span>
                          );
                        })}
                        {specs.length > 2 ? (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold opacity-60 border border-current/20">
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
                          <span className="text-[10px] opacity-60 block mt-0.5">
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
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30',
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
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, s)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-[var(--admin-primary,#b59410)]/15 text-[var(--admin-primary,#b59410)] font-bold'
                            : 'hover:bg-current/[0.08]',
                        )}
                        style={{
                          borderColor: isMenuOpen
                            ? 'var(--admin-primary, #b59410)'
                            : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                        }}
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
            className="fixed z-50 w-52 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
              backgroundColor: 'var(--admin-card, #1f2937)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.22))',
              color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
              boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.staff;
                setMenuAnchor(null);
                onPreview(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <span className="text-sm">👁️</span>
              <span>View Artisan Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.staff;
                setMenuAnchor(null);
                onEdit(target);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <span className="text-sm">✏️</span>
              <span>Edit Staff Details</span>
            </button>

            {menuAnchor.staff.phone ? (
              <a
                href={whatsappDeepLink(
                  menuAnchor.staff.phone,
                  `Hello ${menuAnchor.staff.fullName}, update from Kadamba's Designer Studio workshop:`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAnchor(null)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <span className="text-sm">💬</span>
                <span>Send WhatsApp</span>
              </a>
            ) : null}

            <div
              className="my-1 border-t"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
            />

            {menuAnchor.staff.status === 'active' ? (
              <button
                type="button"
                onClick={() => {
                  const target = menuAnchor.staff;
                  setMenuAnchor(null);
                  onDeactivate(target);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <span className="text-sm">⏸️</span>
                <span>Deactivate Member</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const target = menuAnchor.staff;
                  setMenuAnchor(null);
                  onReactivate(target);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <span className="text-sm">▶️</span>
                <span>Reactivate Member</span>
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
