import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const steps = [
  {
    title: 'Enquire',
    copy: 'Request a consultation or message the boutique about bridal or traditional wear.',
  },
  {
    title: 'Confirm',
    copy: 'We confirm your order and schedule measurements or a studio visit in Kurnool.',
  },
  {
    title: 'Reference ID',
    copy: 'You receive a Reference ID by email — keep it safe for portal access.',
  },
  {
    title: 'Portal',
    copy: 'Activate the customer portal to track orders, share fits, and chat with us.',
  },
] as const;

/**
 * Portal journey strip — Enquire → Confirm → Reference ID → Portal.
 */
export function HowItWorksPortalSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-20">
      <SectionIntro
        title="How it works"
        description="From enquiry to your private portal — a clear path with Kadamba's Designer Studio."
      />
      <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <motion.li
            key={step.title}
            className="border-t border-black/15 pt-5"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-black/40">
              Step {i + 1}
            </p>
            <h3 className="mt-2 font-heading text-2xl text-black">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/65">{step.copy}</p>
          </motion.li>
        ))}
      </ol>
      <p className="mt-10 text-center text-sm text-black/55">
        Already have a Reference ID?{' '}
        <Link to="/portal/activate" className="font-medium text-black underline underline-offset-2">
          Activate portal
        </Link>
      </p>
    </Section>
  );
}
