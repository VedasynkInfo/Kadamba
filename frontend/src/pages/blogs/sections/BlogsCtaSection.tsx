import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { blogsPageCta } from '../data';

/**
 * Soft journal CTA — consultation without competing with the listing banner.
 */
export function BlogsCtaSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="relative overflow-hidden py-20 md:py-28" contained={false}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(255,215,0,0.1),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-center font-heading text-sm uppercase tracking-[0.25em] text-gold">
            {blogsPageCta.eyebrow}
          </p>
          <SectionIntro
            tone="dark"
            align="center"
            className="mt-4"
            title={blogsPageCta.title}
            description={blogsPageCta.description}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/request-service')}>
              Book consultation
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="!text-cream"
              onClick={() => navigate('/contact')}
            >
              Contact the studio
            </Button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
