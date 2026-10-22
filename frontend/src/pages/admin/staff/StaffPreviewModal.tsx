import { useEffect } from 'react';
import type { Staff } from '@/services/staff/staffService';
import { Icon } from '@/components/icons';
import { SPECIALIZATIONS } from './types';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

interface StaffPreviewModalProps {
  staff: Staff | null;
  onClose: () => void;
  onEdit: (s: Staff) => void;
}

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
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

export function StaffPreviewModal({ staff, onClose, onEdit }: StaffPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (staff) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [staff, onClose]);

  if (!staff) return null;

  const initials = staff.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const specs = staff.specializations || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Staff profile snapshot"
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 border-line"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm shadow-xs bg-brand text-ink-on-brand"
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold tracking-wide">
                  {staff.fullName}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                    staff.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                  )}
                >
                  {staff.status}
                </span>
              </div>
              <p className="font-mono text-[11px] opacity-65 mt-0.5">{staff.phone}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Craft Skills */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-2">
              Master Crafts & Specializations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specs.map((spec) => {
                const label = SPECIALIZATIONS.find((sp) => sp.value === spec)?.label || spec;
                return (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border bg-brand/12 border-brand/30 text-brand-strong"
                  >
                    <Icon name="couture" size={12} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 2-Column Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Employment & Background */}
            <div
              className="rounded-xl border p-3.5 space-y-2.5 border-line bg-surface-sunken"
            >
              <h4 className="font-bold text-[11px] uppercase tracking-wider opacity-70">
                Employment Profile
              </h4>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Contract Type:</span>
                <span className="font-semibold uppercase tracking-wide">{staff.employmentType}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Experience:</span>
                <span className="font-semibold">{staff.yearsExperience ? `${staff.yearsExperience} Years` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Joining Date:</span>
                <span className="font-semibold">{staff.joiningDate ? formatDate(staff.joiningDate) : '—'}</span>
              </div>
              {staff.languages && staff.languages.length > 0 ? (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="opacity-60">Languages:</span>
                  <span className="font-semibold">{staff.languages.join(', ')}</span>
                </div>
              ) : null}
            </div>

            {/* Compensation & Emergency Contact */}
            <div
              className="rounded-xl border p-3.5 space-y-2.5 border-line bg-surface-sunken"
            >
              <h4 className="font-bold text-[11px] uppercase tracking-wider opacity-70">
                Compensation & Safety
              </h4>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Salary / Rate:</span>
                <span className="font-bold text-amber-400">
                  {staff.salaryAmount ? `${formatINR(staff.salaryAmount)} / ${staff.salaryType}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Workshop Locality:</span>
                <span className="font-semibold">{staff.locality || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="opacity-60">Emergency Contact:</span>
                <span className="font-semibold">
                  {staff.emergencyContact?.name || '—'}{' '}
                  {staff.emergencyContact?.phone ? `(${staff.emergencyContact.phone})` : ''}
                </span>
              </div>
              {staff.address ? (
                <div className="pt-1 border-t text-[10px] border-line">
                  <span className="opacity-50 block">Full Address:</span>
                  <span className="opacity-80 block truncate">{staff.address}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Previous Workplaces */}
          {staff.previousWorkplaces && staff.previousWorkplaces.length > 0 ? (
            <div
              className="rounded-xl border p-3 border-line bg-surface-sunken"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                Previous Studios / Boutiques
              </span>
              <p className="text-xs opacity-80">{staff.previousWorkplaces.join(', ')}</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-5 py-3.5 border-line bg-surface-sunken"
        >
          {staff.phone ? (
            <a
              href={whatsappDeepLink(
                staff.phone,
                `Hello ${staff.fullName}, update from Kadamba's Designer Studio workshop:`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer shadow-xs"
            >
              <Icon name="whatsapp" size={14} />
              <span>WhatsApp Staff</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(staff);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 border text-xs font-semibold hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              <Icon name="edit" size={14} />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-bold border hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
