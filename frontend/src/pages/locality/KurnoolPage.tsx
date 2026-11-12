import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { CtaBand, PageHero, Reveal, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { JsonLd, PageMeta, localBusinessJsonLd, staticPageMeta } from '@/seo';
import { LOCALITIES, localityIntro } from './data';

const travellingSteps = [
  {
    title: 'Write first',
    copy: 'Send the occasion, the date and a rough budget on WhatsApp. We will tell you which service fits the timeline before you plan a journey.',
  },
  {
    title: 'First visit',
    copy: 'Choose the cloth and be measured. For bridal work this is where the order is planned and the trial dates are agreed.',
  },
  {
    title: 'The trial',
    copy: 'A garment is judged on the body, in daylight, with the undergarments it will be worn with. Bring the shoes if the hem depends on them.',
  },
  {
    title: 'Collection',
    copy: 'The final fitting and handover. If you cannot return, say so when you book and we will agree the handover in advance.',
  },
];

/**
 * Kurnool and the district around it.
 *
 * The index exists so the locality pages have a parent, and so a visitor from
 * outside the city can see the whole arrangement in one screen: one studio,
 * honest visit counts, and a named page for the town they are travelling from.
 */
export default function KurnoolPage() {
  const { settings } = usePublicContent();

  return (
    <>
      <PageMeta {...staticPageMeta.kurnool} />
      <JsonLd data={localBusinessJsonLd()} />

      <PageHero
        variant="atlas"
        eyebrow={localityIntro.eyebrow}
        title="The studio,"
        accent="and the district around it."
        description={localityIntro.description}
        image="/media/photos/boutique-warm.jpg"
        imageAlt="The warm-lit Kadamba boutique in Kurnool"
        trail={[{ label: 'Kurnool' }]}
        facts={[
          { label: 'Studio', value: 'Kurnool city' },
          { label: 'Places', value: String(LOCALITIES.length).padStart(2, '0') },
          { label: 'Fittings', value: 'In person' },
          { label: 'Visits', value: 'By appointment' },
        ]}
      />

      <Section className="house-section bg-surface">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-20">
          <Reveal>
            <p className="eyebrow">The arrangement</p>
            <h2 className="display-lg mt-6 text-ink">
              Every garment is cut <span className="display-accent">in one room.</span>
            </h2>
            <div className="mt-8 space-y-5 text-[1.02rem] leading-[1.85] text-ink/70">
              <p>
                There is no second workshop and no work sent away. Pattern, cutting, embroidery,
                fitting and finishing happen at the studio in Kurnool city, which is why the visit
                count on these pages is not a marketing number — it is the number of times a garment
                has to be on a body before it is right.
              </p>
              <p>
                Clients travel in from across the district. We do not pretend to have a branch in
                every town. What we can do is plan the visits around your journey, send photographs
                of cloth before you come, and tell you honestly at the first appointment whether
                your date is realistic.
              </p>
            </div>
            <Link to="/contact" className="link-arrow mt-8 inline-flex text-brand-strong">
              Find the studio
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="plate plate-frame plate-frame-dark aspect-[4/5]">
              <OptimizedImage
                src="/media/photos/fabric-ivory.jpg"
                alt="Cloth on the cutting table, ready to be measured"
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 flex items-baseline justify-between gap-4 text-[0.6rem] uppercase tracking-[0.26em] text-ink/65">
              <span>Cloth study</span>
              <span>Kurnool, A.P.</span>
            </p>
          </Reveal>
        </div>
      </Section>

      <Section className="house-section bg-surface-sunken/40">
        <SectionHead
          eyebrow="The district"
          title="Where our clients"
          accent="travel from."
          description="Each page says how many visits a commission takes and what to bring. Nothing more is claimed."
          actions={
            <span className="text-[0.6rem] uppercase tracking-[0.24em] text-ink/65">
              {String(LOCALITIES.length).padStart(2, '0')} places
            </span>
          }
        />

        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {LOCALITIES.map((locality, index) => (
            <Reveal as="li" key={locality.slug} delay={index * 0.04}>
              <Link to={`/kurnool/${locality.slug}`} className="group block">
                <div className="plate plate-frame aspect-[4/5] overflow-hidden">
                  <OptimizedImage
                    src={locality.image}
                    alt={locality.imageAlt}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-ink/12 pb-3">
                  <h3 className="font-heading text-2xl text-ink">{locality.name}</h3>
                  <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/65">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{locality.tagline}</p>
                <p className="mt-3 text-[0.58rem] uppercase tracking-[0.2em] text-ink/65">
                  {locality.covers.join(' · ')}
                </p>
                <span className="link-arrow mt-5 inline-flex text-brand-strong">Read the page</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section className="house-section bg-surface">
        <SectionHead
          eyebrow="When you travel in"
          title="A commission,"
          accent="planned around the journey."
          description="The only appointment that cannot be replaced by a photograph is the one where the garment is on the body."
        />

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {travellingSteps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 0.05}>
              <div className="border-t border-ink/20 pt-5">
                <span className="font-mono text-[0.6rem] tabular-nums tracking-[0.24em] text-brand-strong">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-heading text-xl text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{step.copy}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section className="house-section bg-surface-sunken/40">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Visit</p>
            <h2 className="display-lg mt-6 text-ink">
              The studio <span className="display-accent">is the destination.</span>
            </h2>
            <div className="mt-8 space-y-1 text-[0.98rem] leading-relaxed text-ink/70">
              {(settings.addressLines.length
                ? settings.addressLines
                : ["Kadamba's Designer Studio", 'Kurnool, Andhra Pradesh']
              ).map((line) => (
                <p key={line}>{line}</p>
              ))}
              {settings.landmark ? <p>{settings.landmark}</p> : null}
              <p>
                {[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {settings.phoneDisplay ? (
                <a href={`tel:${settings.phoneTel}`} className="link-arrow text-brand-strong">
                  {settings.phoneDisplay}
                </a>
              ) : null}
              {settings.mapLink ? (
                <a
                  href={settings.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow text-brand-strong"
                >
                  Open the map
                </a>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="eyebrow">Hours</p>
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
                  className="flex items-baseline justify-between gap-6 border-b border-ink/12 py-4"
                >
                  <dt className="text-sm text-ink/70">{row.day}</dt>
                  <dd className="text-sm tabular-nums text-ink">{row.time}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-ink/70">
              The studio works by appointment. Call or message before travelling from another town
              so the fitting room and the cutter are free.
            </p>
          </Reveal>
        </div>
      </Section>

      <CtaBand
        eyebrow="Start here"
        title="Tell us the town."
        accent="We will tell you the visits."
        copy="Send the occasion, the date and where you are travelling from. We will answer with the service that fits and the first appointment available."
        image="/media/photos/atelier-seamstress.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
