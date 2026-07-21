import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { cn } from '@/utils/cn';
import { brand, services, type ServiceItem } from '../data';

function ServiceIcon({ name }: { name: ServiceItem['icon'] }) {
  const common = 'size-7 stroke-current sm:size-8';
  switch (name) {
    case 'bridal':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c2.5 3 4 5.5 4 8a4 4 0 1 1-8 0c0-2.5 1.5-5 4-8Z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 21h8M12 15v6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'traditional':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 4h12v4H6V4Z" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 8v13M16 8v13M8 14h8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'tailoring':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20 12 4l8 16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14h8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h10M4 17h14" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

/**
 * Image-led services — bridal, traditional, tailoring, boutique.
 */
export function ServicesSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <Section tone="light" className="overflow-hidden py-16 md:py-24">
      <SectionIntro
        title="Services"
        description={`${brand.summary} Explore bridal wear, traditional ensembles, custom tailoring, and boutique styling.`}
        actions={
          <p className="hidden text-xs uppercase tracking-[0.2em] text-black/40 md:block" aria-hidden>
            Hover to explore
          </p>
        }
      />

      <motion.ul
        className="mt-10 hidden h-[min(68vh,560px)] gap-2 md:flex"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
        onMouseLeave={() => setActive(0)}
      >
        {services.map((service, i) => {
          const isActive = active === i;
          return (
            <motion.li
              key={service.id}
              variants={reduced ? undefined : fadeUp}
              className="relative flex min-w-0 basis-0"
              animate={reduced ? undefined : { flexGrow: isActive ? 3.4 : 1 }}
              initial={false}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={reduced ? { flexGrow: isActive ? 3.4 : 1 } : undefined}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <button
                type="button"
                className={cn(
                  'group relative h-full w-full overflow-hidden text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                )}
                onClick={() => navigate(service.href)}
                aria-expanded={isActive}
              >
                <OptimizedImage
                  src={service.image}
                  alt=""
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-luxury)]',
                    isActive ? 'scale-105' : 'scale-100',
                  )}
                  width={900}
                  height={700}
                />
                <div
                  className={cn(
                    'absolute inset-0 transition-colors duration-500',
                    isActive ? 'bg-black/35' : 'bg-black/60',
                  )}
                  aria-hidden
                />
                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-1 origin-left bg-gold transition-transform duration-500',
                    isActive ? 'scale-x-100' : 'scale-x-0',
                  )}
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-7">
                  <span className="text-gold">
                    <ServiceIcon name={service.icon} />
                  </span>
                  <h3 className="mt-4 font-heading text-xl text-cream lg:text-2xl">{service.title}</h3>
                  <p
                    className={cn(
                      'mt-2 text-sm leading-relaxed text-cream/85 transition-all duration-500',
                      isActive
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-2 opacity-0 lg:h-0 lg:overflow-hidden',
                    )}
                  >
                    {service.description}
                  </p>
                  <span
                    className={cn(
                      'mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-gold transition-opacity duration-300',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    Explore →
                  </span>
                </div>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      <motion.ul
        className="mt-8 grid gap-4 md:hidden"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.15 }}
      >
        {services.map((service) => (
          <motion.li key={service.id} variants={reduced ? undefined : fadeUp}>
            <button
              type="button"
              className="group relative block aspect-[16/11] w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              onClick={() => navigate(service.href)}
            >
              <OptimizedImage
                src={service.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
                width={800}
                height={550}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="text-gold">
                  <ServiceIcon name={service.icon} />
                </span>
                <h3 className="mt-3 font-heading text-xl text-cream">{service.title}</h3>
                <p className="mt-1.5 text-sm text-cream/80">{service.description}</p>
              </div>
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
