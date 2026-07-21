import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { brand, type ServiceDetail } from '../data';

interface ServiceCtaSectionProps {
  service: ServiceDetail;
}

/**
 * Service detail conversion CTA → request / contact.
 */
export function ServiceCtaSection({ service }: ServiceCtaSectionProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="relative overflow-hidden py-20 md:py-28" contained={false}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,215,0,0.12),transparent_55%)]"
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
            {brand.shortName}
          </p>
          <SectionIntro
            tone="dark"
            align="center"
            className="mt-4"
            title={`Begin your ${service.title.toLowerCase()}`}
            description={`Request a consultation at our ${brand.location} boutique — measurements, trials, and finishing for ${service.category.toLowerCase()} wear.`}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/request-service?service=${service.slug}`)}
            >
              {service.ctaLabel}
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
