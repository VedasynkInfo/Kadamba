import { Link } from 'react-router-dom';

const ROLES = [
  {
    role: 'Superadmin / Owner',
    badge: '👑 Master Access',
    desc: 'Unrestricted control across all atelier financial accounts, settings, staff remuneration, and client records.',
    permissions: ['Manage Settings & Theme', 'Disburse Salaries & P&L', 'Full Order Production Access', 'Staff Roster Management'],
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    role: 'Studio Manager',
    badge: '🏛️ Atelier Ops',
    desc: 'Oversees daily bridal appointments, client measurements, production queue assignments, and trial scheduling.',
    permissions: ['Create & Edit Orders', 'Approve Measurements', 'Manage Customer Directory', 'Assign Master Tailors'],
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    role: 'Master Craftsman / Tailor',
    badge: '✂️ Workshop Floor',
    desc: 'Assigned to active garment construction, maggam embroidery, and trial alteration fittings.',
    permissions: ['View Work Orders & Line Items', 'View Anatomical Fit Cards', 'Update Garment Stages', 'Log Trial Notes'],
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  {
    role: 'Front Desk / Billing Clerk',
    badge: '🧾 Reception & Cash',
    desc: 'Handles boutique consultations, receipt generation, and client advance collection.',
    permissions: ['Record Client Payments', 'Send WhatsApp Receipts', 'Schedule Consultations', 'View Invoice Records'],
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
];

export function StaffRolesTab() {
  return (
    <div className="space-y-6 text-xs">
      {/* Quick Link Banner */}
      <div
        className="rounded-2xl border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div>
          <h3 className="font-heading text-sm font-bold tracking-wide">
            Workshop Staff & Artisan Directory
          </h3>
          <p className="text-[11px] opacity-60 mt-0.5">
            Add or manage tailoring staff members, piece-rate contracts, and master specialties
          </p>
        </div>

        <Link
          to="/admin/staff"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 whitespace-nowrap bg-brand text-ink-on-brand"
        >
          <span>Open Staff Roster</span>
          <span>→</span>
        </Link>
      </div>

      {/* Role Hierarchy Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map((r) => (
          <div
            key={r.role}
            className="rounded-2xl border p-5 shadow-xs space-y-3 transition-colors bg-surface-raised border-line text-ink-raised"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-sm font-bold">{r.role}</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${r.badgeClass}`}>
                {r.badge}
              </span>
            </div>

            <p className="text-[11px] opacity-70 leading-relaxed">{r.desc}</p>

            <div className="pt-2 border-t space-y-1.5 border-line">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                Granted Privileges:
              </span>
              <ul className="space-y-1 text-[11px]">
                {r.permissions.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2 opacity-85">
                    <span className="text-emerald-400">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
