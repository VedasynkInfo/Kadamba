import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { contactBanner, whatsappHref } from '../data';

/**
 * Contact banner — centered editorial invitation.
 * Deliberately different from About/Services left-stack heroes.
 */
export function ContactBannerSection() {
  const reduced = usePrefersReducedMotion();

  function scrollToForm() {
    document.getElementById('contact-form')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="Contact Kadamba's Designer Studio"
    >
      <div className="relative min-h-[min(90svh,900px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={contactBanner.image}
            alt={contactBanner.alt}
            className="h-full w-full object-cover object-center"
            width={2400}
            height={1600}
            priority
          />
          {/* Soft center glow + vignette — not the left-heavy wash used on older pages */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,215,0,0.16)_0%,transparent_42%),radial-gradient(ellipse_at_50%_50%,transparent_25%,rgba(0,0,0,0.72)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/80"
            aria-hidden
          />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[min(90svh,900px)] w-full max-w-4xl flex-col items-center justify-center px-6 py-28 text-center sm:px-8 md:min-h-[calc(100svh-4.25rem)] md:py-32">
          <motion.p
            className="font-heading text-[0.7rem] uppercase tracking-[0.42em] text-gold/90 sm:text-xs"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.1 }}
          >
            {contactBanner.locationLine}
          </motion.p>

          <motion.p
            className="mt-6 font-heading text-5xl leading-none tracking-wide text-gold sm:text-6xl md:text-7xl lg:text-8xl"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.18 }}
          >
            {contactBanner.brandName}
          </motion.p>

          <motion.span
            className="mt-7 block h-px origin-center bg-gold/70"
            initial={reduced ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.35 }}
            style={{ width: 'min(12rem, 40vw)' }}
            aria-hidden
          />

          <motion.h1
            className="mt-7 max-w-xl font-heading text-2xl font-medium leading-snug text-cream sm:text-3xl md:text-4xl"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.42 }}
          >
            {contactBanner.headline}
          </motion.h1>

          <motion.p
            className="text-lede mt-5 max-w-md text-cream/85"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.5 }}
          >
            {contactBanner.copy}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.58 }}
          >
            <Button variant="primary" size="lg" onClick={scrollToForm}>
              {contactBanner.primaryCta}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="!text-cream"
              onClick={() => {
                window.open(whatsappHref(), '_blank', 'noopener,noreferrer');
              }}
            >
              {contactBanner.secondaryCta}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
