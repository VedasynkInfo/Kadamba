import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { brand } from '@/pages/home/data';
import { LeadsProvider } from './LeadsContext';

const nav = [
  { to: '/admin/leads', end: true, label: 'Dashboard' },
  { to: '/admin/leads/list', end: false, label: 'All leads' },
];

/**
 * Phase 11 CRM shell — lean atelier desk layout (expands in Phase 12).
 */
export function LeadsAdminLayout() {
  return (
    <LeadsProvider>
      <div className="flex min-h-screen bg-[#0a0a0a] text-cream">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-gold/15 bg-black px-5 py-8 md:flex">
          <p className="font-heading text-2xl tracking-wide text-gold">{brand.shortName}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-cream/45">
            Leads CRM
          </p>
          <nav className="mt-10 flex flex-col gap-1" aria-label="CRM navigation">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2.5 text-sm transition',
                    isActive
                      ? 'bg-gold/15 text-gold'
                      : 'text-cream/65 hover:bg-cream/5 hover:text-cream',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a
            href="/"
            className="mt-auto pt-8 text-xs uppercase tracking-[0.2em] text-cream/40 transition hover:text-gold"
          >
            ← Public site
          </a>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-gold/10 px-4 py-3 md:hidden">
            <p className="font-heading text-lg text-gold">{brand.shortName} · CRM</p>
            <nav className="flex gap-3 text-xs uppercase tracking-[0.18em]" aria-label="CRM mobile">
              <NavLink to="/admin/leads" end className="text-cream/70">
                Desk
              </NavLink>
              <NavLink to="/admin/leads/list" className="text-cream/70">
                Leads
              </NavLink>
            </nav>
          </header>
          <div className="flex-1 bg-cream text-black">
            <Outlet />
          </div>
        </div>
      </div>
    </LeadsProvider>
  );
}
