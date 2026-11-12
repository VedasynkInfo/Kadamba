import { Link } from 'react-router-dom';
import { Reveal, SectionHead } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';

const services = [
  {
    title: 'Bridal lehengas in Kurnool',
    href: '/services/bridal-wear',
    copy: 'Bridal lehenga, blouse and dupatta designed as one commission, with maggam, zardozi and hand finishing in the studio.',
  },
  {
    title: 'Designer blouse stitching',
    href: '/services/custom-tailoring',
    copy: 'Saree blouses, crop tops and occasion blouses cut from a personal pattern, with two fittings and a proper lining.',
  },
  {
    title: 'Saree fall, pico & alterations',
    href: '/services/custom-tailoring',
    copy: 'Fall and pico on silk and cotton sarees, blouse alterations, and careful restyling of inherited or ready-made pieces.',
  },
  {
    title: 'Traditional & festive wear',
    href: '/services/traditional-wear',
    copy: 'Sarees, half-sarees, anarkalis and festive sets for Ugadi, Dasara, weddings and family functions across the district.',
  },
  {
    title: 'Boutique styling in Kurnool',
    href: '/services/boutique-styling',
    copy: 'Fabric selection, colour matching and jewellery advice for the bride, the mother of the bride and the wedding party.',
  },
];

const areas = [
  { label: 'Kurnool city', href: '/kurnool/kurnool-city' },
  { label: 'Adoni', href: '/kurnool/adoni' },
  { label: 'Nandyal', href: '/kurnool/nandyal' },
  { label: 'Yemmiganur', href: '/kurnool/yemmiganur' },
  { label: 'Dhone', href: '/kurnool/dhone' },
];

const journal = [
  { label: 'Choosing a bridal lehenga for a Kurnool wedding', href: '/blogs/choosing-bridal-lehenga-kurnool' },
  { label: 'A realistic bridal fitting timeline', href: '/blogs/bridal-fitting-timeline' },
  { label: 'How to take accurate measurements', href: '/blogs/how-to-take-accurate-measurements' },
  { label: 'Saree blouse necklines by figure', href: '/blogs/saree-blouse-necklines-by-figure' },
];

/**
 * The local search landing copy.
 *
 * A real paragraph for a person, written around the queries a Kurnool bride
 * actually types: bridal lehenga, blouse stitching, saree fall and pico, custom
 * tailoring. The links are the same services and localities the rest of the
 * site already proves, so this section strengthens the internal graph rather
 * than creating a keyword page.
 */
export function LocalSeoSection() {
  const { settings, whatsappHref } = usePublicContent();

  return (
    <section id="kurnool-boutique" className="house-section relative bg-surface-sunken">
      <div className="house-container">
        <SectionHead
          eyebrow="Kurnool & the district"
          index="07"
          title="A bridal boutique in Kurnool,"
          accent="built around the fitting."
          description="Kadamba's Designer Studio is a bridal boutique and custom tailoring studio in Kurnool, Andhra Pradesh. We make bridal lehengas, designer blouses, traditional sarees, festive kurtis, gowns and made-to-measure everyday wear for women across Kurnool and the district."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <Reveal>
              <h3 className="font-heading text-2xl text-ink md:text-3xl">
                What you can commission
              </h3>
            </Reveal>
            <ul className="mt-8 border-t border-ink/12">
              {services.map((service, index) => (
                <Reveal key={service.title} as="li" delay={index * 0.04}>
                  <Link
                    to={service.href}
                    className="group grid gap-2 border-b border-ink/12 py-5 transition-colors hover:text-brand-strong sm:grid-cols-[2.5rem_1fr] sm:gap-4"
                  >
                    <span className="font-mono text-[0.58rem] tabular-nums tracking-[0.18em] text-brand-strong">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <span className="block font-heading text-xl text-ink transition-colors group-hover:text-brand-strong">
                        {service.title}
                      </span>
                      <span className="mt-1 block max-w-lg text-sm leading-relaxed text-ink/62">
                        {service.copy}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-8">
            <Reveal className="well p-7 sm:p-9">
              <p className="eyebrow text-brand-strong">Visit the studio</p>
              <p className="mt-4 font-heading text-2xl leading-snug text-ink">
                {settings.addressLines.slice(0, 2).join(', ')}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/62">
                {settings.addressLines.slice(2).join(', ')}
              </p>
              <p className="mt-5 text-sm text-ink/70">
                <a href={`tel:${settings.phoneTel}`} className="link-under text-brand-strong">
                  {settings.phoneDisplay}
                </a>
                <span className="mx-3 text-ink/30" aria-hidden>
                  /
                </span>
                <a href={`mailto:${settings.email}`} className="link-under text-brand-strong">
                  {settings.email}
                </a>
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/request-service"
                  className="inline-flex items-center border border-brand-strong bg-brand-strong px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-ink"
                >
                  Book a consultation
                </Link>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center border border-ink/20 px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-brand-strong hover:text-brand-strong"
                >
                  WhatsApp
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <p className="eyebrow text-ink/70">Areas we serve</p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {areas.map((area) => (
                  <li key={area.href}>
                    <Link to={area.href} className="link-under text-ink/70 hover:text-brand-strong">
                      {area.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="eyebrow text-ink/70">From the journal</p>
              <ul className="mt-4 space-y-2 text-sm">
                {journal.map((post) => (
                  <li key={post.href}>
                    <Link to={post.href} className="link-under text-ink/70 hover:text-brand-strong">
                      {post.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
