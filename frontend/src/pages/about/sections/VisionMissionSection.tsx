import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { visionMission } from '../data';

/**
 * Vision and mission — two text columns, no cards.
 */
export function VisionMissionSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title={visionMission.title}
        description={visionMission.lede}
      />

      <motion.div
        className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div variants={reduced ? undefined : fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Studio</p>
          <h3 className="mt-3 font-heading text-2xl text-cream md:text-3xl">
            {visionMission.vision.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-cream/75">
            {visionMission.vision.body}
          </p>
        </motion.div>
        <motion.div variants={reduced ? undefined : fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Studio</p>
          <h3 className="mt-3 font-heading text-2xl text-cream md:text-3xl">
            {visionMission.mission.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-cream/75">
            {visionMission.mission.body}
          </p>
        </motion.div>
      </motion.div>
    </Section>
  );
}
