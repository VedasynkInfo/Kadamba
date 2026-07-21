import { NavLink } from 'react-router-dom';
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

const socialLinks = [
  {
    href: 'https://www.instagram.com/',
    label: 'Instagram',
  },
  {
    href: 'https://www.pinterest.com/',
    label: 'Pinterest',
  },
  {
    href: 'https://www.facebook.com/',
    label: 'Facebook',
  },
];

/**
 * Premium site footer with brand mark, links, and social presence.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/20 bg-black py-12 text-cream">
      <Container>
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-2xl text-gold">Kadamba&apos;s Designer Studio</p>
            <p className="mt-3 text-measure text-sm leading-relaxed text-cream/70">
              Well-known boutique and tailoring in Kurnool — specializing in women&apos;s traditional
              and bridal wear.
            </p>
            <ul className="mt-6 flex flex-wrap gap-4 text-sm">
              {socialLinks.map((link) => (
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
          &copy; {new Date().getFullYear()} Kadamba&apos;s Designer Studio. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
