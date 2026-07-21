import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import type { ServiceDetail } from '../data';

interface ServicePricingSectionProps {
  service: ServiceDetail;
}

/**
 * Service info + pricing — transparent starting rates and what is included.
 */
export function ServicePricingSection({ service }: ServicePricingSectionProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <SectionIntro
            title="Information & pricing"
            description={`Transparent starting rates for ${service.title.toLowerCase()} at our Kurnool boutique. Final quotes follow a consultation.`}
          />

          <p className="mt-8 font-heading text-4xl text-black sm:text-5xl">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Starting from
            </span>
            <span className="mt-2 inline-block">{service.pricing.startingFrom}</span>
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-black/65">
            {service.pricing.note}
          </p>
          <p className="mt-3 text-sm text-black/55">{service.durationNote}</p>

          <motion.ul
            className="mt-10 divide-y divide-black/10 border-y border-black/10"
            variants={reduced ? undefined : staggerChildren}
            initial={reduced ? false : 'hidden'}
            whileInView={reduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
          >
            {service.pricing.tiers.map((tier) => (
              <motion.li
                key={tier.id}
                className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                variants={reduced ? undefined : fadeUp}
              >
                <div>
                  <h3 className="font-heading text-xl text-black">{tier.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-black/65">{tier.detail}</p>
                </div>
                <p className="shrink-0 font-heading text-lg text-black sm:text-right">
                  {tier.priceLabel}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="self-start border border-black/10 bg-black px-6 py-8 text-cream sm:px-8"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Included</p>
          <h3 className="mt-3 font-heading text-2xl">What you receive</h3>
          <ul className="mt-6 space-y-3">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-cream/85">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="lg"
            className="mt-8 w-full sm:w-auto"
            onClick={() => navigate(`/request-service?service=${service.slug}`)}
          >
            {service.ctaLabel}
          </Button>
        </motion.div>
      </div>
    </Section>
  );
}
