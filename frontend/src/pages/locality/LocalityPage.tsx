import { Link, Navigate, useParams } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Accordion, CtaBand, PageHero, Reveal, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { faqJsonLd, JsonLd, PageMeta } from '@/seo';
import { getLocality, LOCALITIES, serviceLabels, type Locality } from './data';

/**
 * One town's page.
 *
 * The shape is the same for every locality on purpose: the honest visit
 * arrangement, the disciplines that make sense from there, the practical note
 * for travelling in, and the questions people ask before they book. The FAQ
 * list is also the page's `FAQPage` markup, so the answers a visitor reads are
 * the answers a search result can show.
 */
export default function LocalityPage() {
  const { slug } = useParams<{ slug: string }>();
  const locality = getLocality(slug);
  const { settings } = usePublicContent();

  if (!locality) return <Navigate to="/kurnool" replace />;

  const path = `/kurnool/${locality.slug}`;
  const others = LOCALITIES.filter((item) => item.slug !== locality.slug);

  return (
    <>
      <PageMeta
        title={`${locality.name} — bridal & tailoring`}
        description={`${locality.tagline} ${locality.visit}`}
        path={path}
        image={locality.image}
      />
      <JsonLd
        data={faqJsonLd(
          locality.faqs.map((item) => ({ question: item.question, answer: item.answer })),
        )}
      />

      <PageHero
        eyebrow="Kurnool & the district"
        title={`Dressing ${locality.shortName},`}
        accent="from one studio."
        description={locality.tagline}
        image={locality.image}
        imageAlt={locality.imageAlt}
        trail={[{ label: 'Kurnool', to: '/kurnool' }, { label: locality.name }]}
        facts={[
          { label: 'From', value: locality.shortName },
          { label: 'Fittings', value: 'In Kurnool' },
          { label: 'Studio', value: 'One location' },
          { label: 'Visits', value: 'By appointment' },
        ]}
      />

      <Section className="house-section bg-surface">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-20">
          <Reveal>
            <p className="eyebrow">The arrangement</p>
            <h2 className="display-lg mt-6 text-ink">
              What it takes <span className="display-accent">from {locality.shortName}.</span>
            </h2>
            <div className="mt-8 space-y-5 text-[1.02rem] leading-[1.85] text-ink/70">
              {locality.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 30)}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-9 border-t border-ink/12 pt-6">
              <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/40">
                This page speaks to
              </p>
              <p className="mt-3 font-heading text-lg text-ink">{locality.covers.join(' · ')}</p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="plate plate-frame plate-frame-dark aspect-[4/5]">
              <OptimizedImage
                src={locality.image}
                alt={locality.imageAlt}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 flex items-baseline justify-between gap-4 text-[0.6rem] uppercase tracking-[0.26em] text-ink/40">
              <span>Cloth study</span>
              <span>Kurnool, A.P.</span>
            </p>
          </Reveal>
        </div>
      </Section>

      <Section className="house-section bg-surface-sunken/40">
        <SectionHead
          eyebrow="What we make"
          title="The same four"
          accent="disciplines."
          description={`A commission from ${locality.shortName} is made the same way as one from Kurnool city. The difference is only the journey.`}
        />

        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {locality.serviceSlugs.map((serviceSlug, index) => (
            <Reveal as="li" key={serviceSlug} delay={index * 0.04}>
              <Link
                to={`/services/${serviceSlug}`}
                className="group flex h-full flex-col border-t border-ink/20 pt-5"
              >
                <span className="font-mono text-[0.6rem] tabular-nums tracking-[0.24em] text-brand-strong">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="mt-3 font-heading text-2xl text-ink">
                  {serviceLabels[serviceSlug] || serviceSlug}
                </span>
                <span className="link-arrow mt-5 text-brand-strong">Read the service</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section className="house-section bg-surface">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Before you travel</p>
            <h2 className="display-lg mt-6 text-ink">
              The practical <span className="display-accent">note.</span>
            </h2>
            <p className="mt-8 text-[1.02rem] leading-[1.85] text-ink/70">{locality.visit}</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <Link to="/contact" className="link-arrow text-brand-strong">
                Address and map
              </Link>
              <Link to="/request-service" className="link-arrow text-brand-strong">
                Book an appointment
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="border border-ink/12 bg-surface-raised p-7">
              <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/40">The studio</p>
              <div className="mt-4 space-y-1 text-sm leading-relaxed text-ink/70">
                {(settings.addressLines.length
                  ? settings.addressLines
                  : ["Kadamba's Designer Studio", 'Kurnool, Andhra Pradesh']
                ).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {settings.landmark ? <p>{settings.landmark}</p> : null}
              </div>
              <dl className="mt-6 border-t border-ink/12">
                {(settings.hours.length
                  ? settings.hours
                  : [
                      { day: 'Mon — Sat', time: '10:00 AM — 7:00 PM' },
                      { day: 'Sunday', time: 'By appointment' },
                    ]
                ).map((row) => (
                  <div
                    key={row.day}
                    className="flex items-baseline justify-between gap-6 border-b border-ink/12 py-3"
                  >
                    <dt className="text-xs text-ink/55">{row.day}</dt>
                    <dd className="text-xs tabular-nums text-ink/80">{row.time}</dd>
                  </div>
                ))}
              </dl>
              {settings.phoneDisplay ? (
                <a
                  href={`tel:${settings.phoneTel}`}
                  className="link-arrow mt-6 inline-flex text-brand-strong"
                >
                  {settings.phoneDisplay}
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="house-section bg-surface-sunken/40">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">Questions</p>
            <h2 className="display-lg mt-6 text-ink">
              Asked from <span className="display-accent">{locality.shortName}.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[0.96rem] leading-relaxed text-ink/60">
              If the answer is not here, the studio would rather answer it on the phone than have
              you guess.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <Accordion items={locality.faqs} defaultOpen={0} />
          </Reveal>
        </div>
      </Section>

      <Section className="house-section bg-surface">
        <SectionHead
          eyebrow="Elsewhere in the district"
          title="The other"
          accent="places we dress."
        />
        <ul className="mt-10 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {others.map((item: Locality) => (
            <li key={item.slug} className="border-b border-ink/12">
              <Link
                to={`/kurnool/${item.slug}`}
                className="flex items-baseline justify-between gap-6 py-4 transition hover:text-brand-strong"
              >
                <span className="font-heading text-xl text-ink">{item.name}</span>
                <span className="text-[0.66rem] uppercase tracking-[0.18em] text-ink/45">
                  Read the page
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        eyebrow={`From ${locality.shortName}`}
        title="Send the date."
        accent="We will send the plan."
        copy="Tell us the occasion, the date and where you are travelling from. The studio will answer with the service that fits and the first appointment available."
        image="/media/placeholders/atelier.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
