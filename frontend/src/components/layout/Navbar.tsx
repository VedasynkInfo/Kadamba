import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import { OptimizedImage } from '@/components/media/OptimizedImage';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/products', label: 'Collections' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/contact', label: 'Contact' },
  { to: '/request-service', label: 'Consultation' },
];

/**
 * The public nav.
 *
 * A fixed, full-width bar that begins transparent over the hero and settles
 * into a blurred espresso rail once the page moves. The announcement strip
 * folds away on scroll; the navigation itself never leaves, so the route
 * remains one gesture away at every depth.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { logoDarkUrl, logoUrl } = useTheme();
  const { settings } = usePublicContent();
  const navigate = useNavigate();
  const activeLogo = logoDarkUrl || logoUrl || '/media/brand/kadamba-logo-gold.png';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="on-dark fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            'overflow-hidden border-b border-white/10 bg-[#120d0b] text-ink-inverse transition-all duration-500',
            scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100',
          )}
        >
          <div className="house-container flex items-center justify-between gap-6 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-ink-inverse/75">
            <p className="truncate">
              Bridal consultations open <span className="mx-2 text-gold">·</span> Kurnool atelier
            </p>
            <div className="hidden items-center gap-5 sm:flex">
              <a href={`tel:${settings.phoneTel}`} className="transition hover:text-gold">
                {settings.phoneDisplay}
              </a>
              <span className="h-3 w-px bg-white/15" aria-hidden />
              <span>Mon–Sat · 10–7</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'border-b transition-all duration-500',
            scrolled
              ? 'border-white/10 bg-[#120d0b]/88 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl'
              : 'border-white/10 bg-[#120d0b]',
          )}
        >
          <nav
            className={cn(
              'house-container flex items-center justify-between gap-6 transition-all duration-500',
              scrolled ? 'py-3' : 'py-4',
            )}
            aria-label="Primary"
          >
            <NavLink
              to="/"
              viewTransition
              aria-label="Kadamba's Designer Studio — home"
              className="group flex items-center gap-3 text-gold transition-opacity hover:opacity-90"
            >
              {activeLogo ? (
                <OptimizedImage
                  src={activeLogo}
                  alt="Kadamba's Designer Studio"
                  responsive={false}
                  priority
                  className="h-12 w-auto max-w-[240px] object-contain sm:h-16 lg:h-20"
                />
              ) : (
                <>
                  <span className="font-heading text-2xl leading-none tracking-[0.02em]">Kadamba</span>
                  <span className="hidden border-l border-gold/30 pl-3 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-ink-inverse/55 xl:block">
                    Kurnool · Est. 2009
                  </span>
                </>
              )}
            </NavLink>

            <ul className="hidden items-center gap-0.5 lg:flex">
              {links.slice(1).map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    viewTransition
                    className={({ isActive }) =>
                      cn(
                        'link-under group relative px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.17em] transition-colors duration-200',
                        isActive ? 'text-gold' : 'text-ink-inverse/75 hover:text-ink-inverse',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-2 lg:flex">
              <Button
                variant="primary"
                size="sm"
                className="rounded-none px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
                onClick={() => navigate('/request-service')}
              >
                Book a fitting
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border border-white/15 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink-inverse hover:bg-white/10 hover:text-gold lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              Menu
            </Button>
          </nav>
        </div>
      </header>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navigate"
        side="right"
        tone="dark"
      >
        <div className="flex h-full flex-col justify-between gap-10">
          <ul className="flex flex-col">
            {links.map((link, index) => (
              <li key={link.to} className="border-b border-white/10">
                <NavLink
                  to={link.to}
                  viewTransition
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-baseline gap-4 py-4 transition-colors',
                      isActive ? 'text-gold' : 'text-ink-inverse/80 hover:text-gold',
                    )
                  }
                >
                  <span className="font-mono text-[0.58rem] tabular-nums tracking-[0.18em] text-gold/60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-heading text-3xl leading-none">{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-white/10 pt-6 text-sm text-ink-inverse/65">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-gold">
              Visit / write
            </p>
            <p>{settings.addressLines.join(', ')}</p>
            <p>
              <a href={`tel:${settings.phoneTel}`} className="transition hover:text-gold">
                {settings.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${settings.email}`} className="transition hover:text-gold">
                {settings.email}
              </a>
            </p>
          </div>
        </div>
      </Drawer>
    </>
  );
}
