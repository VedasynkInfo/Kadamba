import { NavLink, useNavigate } from 'react-router-dom';
import { usePublicContent } from '@/hooks/usePublicContent';
import { brand } from '@/pages/home/data';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';

const footerLinks = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/products', label: 'Collections' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blogs', label: 'Journal' },
  { to: '/kurnool', label: 'Kurnool & district' },
  { to: '/contact', label: 'Contact' },
];

const serviceLinks = [
  { to: '/services/bridal-wear', label: 'Bridal couture' },
  { to: '/services/traditional-wear', label: 'Traditional wear' },
  { to: '/services/custom-tailoring', label: 'Custom tailoring' },
  { to: '/services/boutique-styling', label: 'Boutique styling' },
];

/**
 * The closing spread.
 *
 * A large invitation at the top, the practical details in the middle, and the
 * wordmark at the scale of a magazine cover at the bottom. The footer is part
 * of the page's argument, not a utility drawer.
 */
export function Footer() {
  const { settings } = usePublicContent();
  const social = settings.social ?? [];
  const logo = settings.logoDarkUrl || settings.logoUrl || '/media/brand/kadamba-logo-gold.png';
  const navigate = useNavigate();

  return (
    <footer className="on-dark relative mt-auto overflow-hidden border-t border-gold/20 bg-[#120d0b] text-ink-inverse">
      <div className="house-container relative z-10 py-16 md:py-24">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold/85">The next celebration</p>
            <h2 className="mt-6 max-w-[14ch] font-heading text-[clamp(2.8rem,6vw,5.8rem)] font-light leading-[0.92] tracking-[-0.04em]">
              Let’s make <span className="display-accent">the next one.</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-5 lg:items-end">
            <p className="max-w-md text-sm leading-relaxed text-ink-inverse/65 lg:text-right">
              Bring the date, the occasion and the photographs you have saved. The studio will
              tell you what can be made properly, and how long it needs.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="lg"
                className="rounded-none px-6 py-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
                onClick={() => navigate('/request-service')}
              >
                Book a consultation
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-none border-ink-inverse/25 px-6 py-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-ink-inverse hover:border-gold hover:text-gold"
                onClick={() => navigate('/contact')}
              >
                Contact
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.35fr_0.65fr_0.65fr_0.85fr]">
          <div>
            {logo ? (
              <OptimizedImage
                src={logo}
                alt={settings.studioName || brand.name}
                responsive={false}
                className="mb-5 h-14 w-auto max-w-[210px] object-contain"
              />
            ) : (
              <p className="font-heading text-2xl text-gold">{settings.studioName || brand.name}</p>
            )}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-inverse/65">
              {settings.tagline || brand.summary}
            </p>
            <div className="mt-6 space-y-1 text-sm text-ink-inverse/70">
              {settings.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
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
            {social.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-4 text-sm">
                {social.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-inverse/70 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Footer">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-gold">
              Explore
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    viewTransition
                    className="link-under text-ink-inverse/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-gold">
              The work
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              {serviceLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    viewTransition
                    className="link-under text-ink-inverse/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-gold">
              Studio hours
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-inverse/70">
              {settings.hours.map((row) => (
                <li key={row.day} className="flex flex-col gap-0.5">
                  <span>{row.day}</span>
                  <span className="text-ink-inverse/50">{row.time}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.55rem] font-semibold uppercase leading-[1.8] tracking-[0.2em] text-ink-inverse/50">
              By appointment
              <br />
              Kurnool, Andhra Pradesh
              <br />
              Serving India &amp; the world
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-7 text-[0.62rem] uppercase tracking-[0.18em] text-ink-inverse/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {settings.studioName || brand.name}. All rights reserved.
          </p>
          <p>Handmade in Kurnool · Est. 2009</p>
        </div>
      </div>

      <div className="pointer-events-none select-none overflow-hidden border-t border-white/10">
        <p
          className="house-container whitespace-nowrap py-2 text-center font-heading text-[clamp(4.5rem,15vw,13rem)] leading-[0.72] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(212,166,42,0.28)]"
          aria-hidden
        >
          Kadamba
        </p>
      </div>
    </footer>
  );
}
