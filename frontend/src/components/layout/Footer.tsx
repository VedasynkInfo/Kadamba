import { NavLink } from 'react-router-dom';
import { usePublicContent } from '@/hooks/usePublicContent';
import { brand } from '@/pages/home/data';
import { Container } from './Container';

const footerLinks = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/contact', label: 'Contact' },
  { to: '/request-service', label: 'Consultation' },
];

/**
 * Premium site footer — contact/address/logo from Settings API when available.
 */
export function Footer() {
  const { settings } = usePublicContent();
  const social = settings.social?.length
    ? settings.social
    : [
        { href: 'https://www.instagram.com/', label: 'Instagram' },
        { href: 'https://www.pinterest.com/', label: 'Pinterest' },
        { href: 'https://www.facebook.com/', label: 'Facebook' },
      ];
  const logo = settings.logoDarkUrl || settings.logoUrl;

  return (
    <footer className="mt-auto border-t border-gold/20 bg-black py-12 text-cream">
      <Container>
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            {logo ? (
              <img
                src={logo}
                alt={settings.studioName || brand.name}
                className="mb-3 h-10 w-auto object-contain"
              />
            ) : null}
            <p className="font-heading text-2xl text-gold">
              {settings.studioName || brand.name}
            </p>
            <p className="mt-3 text-measure text-sm leading-relaxed text-cream/70">
              {settings.tagline || brand.summary}
            </p>
            <div className="mt-5 space-y-1 text-sm text-cream/65">
              {settings.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {settings.landmark || settings.locality ? (
                <p>
                  {[settings.landmark, settings.locality].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              {(settings.city || settings.state || settings.pincode) &&
              !settings.addressLines.some((l) => l.includes(settings.city || '')) ? (
                <p>
                  {[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}
                </p>
              ) : null}
              <p>
                <a href={`tel:${settings.phoneTel}`} className="transition hover:text-gold">
                  {settings.phoneDisplay}
                </a>
              </p>
              {settings.phoneAltDisplay ? (
                <p>
                  <a href={`tel:${settings.phoneAltTel || settings.phoneAltDisplay}`} className="transition hover:text-gold">
                    {settings.phoneAltDisplay}
                  </a>
                </p>
              ) : null}
              <p>
                <a href={`mailto:${settings.email}`} className="transition hover:text-gold">
                  {settings.email}
                </a>
              </p>
            </div>
            <ul className="mt-6 flex flex-wrap gap-4 text-sm">
              {social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">Explore</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className="text-cream/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-10 border-t border-gold/10 pt-6 text-xs text-cream/50">
          &copy; {new Date().getFullYear()} {settings.studioName || brand.name}. All rights
          reserved.
        </p>
      </Container>
    </footer>
  );
}
