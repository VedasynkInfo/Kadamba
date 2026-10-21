import { motion } from 'framer-motion';
import { CountUp } from '@/components/motion/CountUp';
import { Heading, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { achievementNotes, achievementStats } from '../data';

/**
 * Local recognition and client trust — the same counter primitive as the home
 * statistics strip, so both read identically at any scroll position.
 */
export function AchievementsSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="border-y border-gold/15 py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Recognition & trust"
        description="Numbers that reflect years of fittings, bridal work, and families who return to Kadamba."
      />

      <Heading as={3} className="sr-only">
        Studio achievements
      </Heading>

      <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {achievementStats.map((stat) => (
          <li key={stat.id}>
            <p className="font-heading text-4xl text-gold md:text-5xl">
              <CountUp
                value={stat.value}
                duration={1.4}
                format={(value) => `${value}${stat.suffix}`}
              />
            </p>
            <p className="mt-2 text-sm text-ink-inverse/70">{stat.label}</p>
          </li>
        ))}
      </ul>

      <motion.ul
        className="mt-14 grid gap-6 md:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {achievementNotes.map((note) => (
          <motion.li
            key={note}
            variants={reduced ? undefined : fadeUp}
            className="border-t border-gold/25 pt-5 text-sm leading-relaxed text-ink-inverse/75"
          >
            {note}
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
