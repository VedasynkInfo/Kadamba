import { Link } from 'react-router-dom';
import { Reveal } from '@/components/site';
import { aftercare } from '../content';

const STAGES = ['Enquiry', 'Design approved', 'In the making', 'Fitting', 'Delivered'];

/**
 * After the order.
 *
 * The website has promised a relationship, so this section has to show the
 * machinery that keeps it: the care that outlasts the sale, and the portal that
 * lets a bride in another country see the garment move through the studio.
 */
export function PortalSection() {
  return (
    <section className="house-section bg-surface-sunken">
      <div className="house-container grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow">After the order</p>
            <h2 className="display-lg mt-6 text-ink">
              The studio stays on <span className="display-accent">after the wedding.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-ink/62">
              A garment has a life after the occasion. We keep the measurements, the pattern and the
              photographs, so a blouse can be remade in another colour three years later and a
              daughter can wear her mother&rsquo;s lehenga with a new border.
            </p>
          </Reveal>

          <ul className="mt-10 border-t border-ink/12">
            {aftercare.map((item, index) => (
              <Reveal
                key={item}
                as="li"
                delay={index * 0.04}
                className="flex items-baseline gap-5 border-b border-ink/12 py-4"
              >
                <span className="font-mono text-[0.58rem] tabular-nums tracking-[0.16em] text-brand-strong">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[0.9rem] leading-relaxed text-ink/70">{item}</span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/portal/activate" className="link-arrow text-brand-strong">
              Open the client portal
            </Link>
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-ink/65">
              Reference ID required
            </span>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <div className="well relative overflow-hidden p-7 sm:p-9">
            <div className="flex items-start justify-between gap-6 border-b border-ink/12 pb-6">
              <div>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-ink/65">
                  Commission
                </p>
                <p className="mt-2 font-heading text-2xl text-ink">Bridal Lehenga</p>
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/65">
                  KDS &middot; 2026 &middot; 0142
                </p>
              </div>
              <span className="border border-brand-strong/35 px-2.5 py-1 text-[0.52rem] font-semibold uppercase tracking-[0.2em] text-brand-strong">
                In the making
              </span>
            </div>

            <ol className="mt-6 space-y-0">
              {STAGES.map((stage, index) => {
                const done = index < 2;
                const current = index === 2;
                return (
                  <li key={stage} className="relative flex gap-5 pb-6 last:pb-0">
                    {index < STAGES.length - 1 ? (
                      <span
                        className="absolute left-[0.44rem] top-4 h-full w-px bg-ink/12"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={
                        done || current
                          ? 'relative z-10 mt-1 size-[0.9rem] shrink-0 rounded-full border border-brand-strong bg-brand-strong'
                          : 'relative z-10 mt-1 size-[0.9rem] shrink-0 rounded-full border border-ink/25 bg-surface-raised'
                      }
                      aria-hidden
                    />
                    <span className="flex-1">
                      <span
                        className={
                          current
                            ? 'block text-[0.82rem] font-semibold text-ink'
                            : done
                              ? 'block text-[0.82rem] text-ink/65'
                              : 'block text-[0.82rem] text-ink/65'
                        }
                      >
                        {stage}
                      </span>
                      {current ? (
                        <span className="mt-1 block text-[0.68rem] text-ink/65">
                          Second fitting &middot; Thursday, 4:30 pm
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink/65">
                      {index < 2 ? 'done' : current ? 'now' : '—'}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/12 pt-6">
              <div>
                <p className="text-[0.52rem] font-semibold uppercase tracking-[0.22em] text-ink/65">
                  Balance
                </p>
                <p className="mt-1 font-heading text-xl text-ink">₹0</p>
              </div>
              <div>
                <p className="text-[0.52rem] font-semibold uppercase tracking-[0.22em] text-ink/65">
                  Delivery
                </p>
                <p className="mt-1 font-heading text-xl text-ink">12 Nov</p>
              </div>
            </div>

            <p className="mt-6 text-[0.58rem] uppercase tracking-[0.22em] text-ink/65">
              A sample of the client portal
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
