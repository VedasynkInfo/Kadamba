import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { team } from '../data';

/**
 * Tailors and stylists — portrait + text, no card chrome.
 */
export function TeamSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro
        title="The people behind the craft"
        description="Stylists and tailors who guide fabric choices, fittings, and finishing at the studio."
      />

      <motion.ul
        className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {team.map((member) => (
          <motion.li key={member.id} variants={reduced ? undefined : fadeUp}>
            <div className="aspect-[4/5] w-full overflow-hidden">
              <OptimizedImage
                src={member.image}
                alt={member.alt}
                className="h-full w-full object-cover"
                width={800}
                height={1000}
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {member.role}
            </p>
            <h3 className="mt-2 font-heading text-2xl leading-snug">{member.name}</h3>
            <p className="mt-3 text-base leading-relaxed text-black/70">{member.bio}</p>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
