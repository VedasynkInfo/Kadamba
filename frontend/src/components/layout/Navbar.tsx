import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
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
 * Sticky site navbar with scroll styling and mobile drawer.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { logoDarkUrl, logoUrl } = useTheme();
  const activeLogo = logoDarkUrl || logoUrl;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'on-dark sticky top-0 z-40 border-b bg-espresso text-ink-inverse transition-shadow duration-300',
          scrolled ? 'border-gold/30 shadow-soft' : 'border-transparent',
        )}
      >
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4"
          aria-label="Primary"
        >
          <NavLink
            to="/"
            viewTransition
            className="flex items-center gap-2 font-heading text-xl tracking-wide text-gold transition-opacity hover:opacity-90"
          >
            {activeLogo ? (
              <OptimizedImage
                src={activeLogo}
                alt="Kadamba"
                responsive={false}
                priority
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span>Kadamba</span>
            )}
          </NavLink>

          <ul className="hidden flex-wrap items-center gap-4 text-sm lg:flex">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  viewTransition
                  className={({ isActive }) =>
                    cn(
                      'link-sweep transition-colors duration-200',
                      isActive ? 'text-gold' : 'text-ink-inverse/80 hover:text-gold',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Button
            variant="ghost"
            size="sm"
            className="text-ink-inverse hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </Button>
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigate" side="right">
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                viewTransition
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-ink-inverse/80 hover:text-gold',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
