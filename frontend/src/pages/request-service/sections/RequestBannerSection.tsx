import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { requestBanner } from '../data';

/**
 * Personal atelier invitation — split, compact strip.
 * Not a full-viewport About/Services hero or Contact centered stack.
 */
export function RequestBannerSection() {
  const reduced = usePrefersReducedMotion();

  function scrollToForm() {
    document.getElementById('request-form')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#0c0a08] text-cream"
      aria-label="Request a consultation at Kadamba's Designer Studio"
    >
      <div className="grid min-h-[min(52svh,520px)] w-full md:min-h-[min(56svh,560px)] md:grid-cols-2">
        {/* Image column — edge-to-edge in its half only */}
        <motion.div
          className="relative min-h-[220px] overflow-hidden md:min-h-full"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={requestBanner.image}
            alt={requestBanner.alt}
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
            width={1600}
            height={1200}
            fetchPriority="high"
            initial={reduced ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduced ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0c0a08]/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#0c0a08]/90"
            aria-hidden
          />
        </motion.div>

        {/* Invitation copy — warm ink wash */}
        <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 md:px-12 lg:px-16 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(255,215,0,0.12),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(255,215,0,0.05),transparent_45%)]"
            aria-hidden
          />

          <motion.p
            className="relative font-heading text-[0.65rem] uppercase tracking-[0.38em] text-gold/85 sm:text-xs"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.12 }}
          >
            {requestBanner.locationLine}
          </motion.p>

          <motion.p
            className="relative mt-4 font-heading text-2xl tracking-wide text-gold sm:text-3xl"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.2 }}
          >
            {requestBanner.brandName}
          </motion.p>

          <motion.h1
            className="relative mt-5 max-w-md font-heading text-3xl font-medium leading-snug text-cream sm:text-4xl md:text-[2.35rem]"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.28 }}
          >
            {requestBanner.headline}
          </motion.h1>

          <motion.p
            className="relative mt-4 max-w-sm text-sm leading-relaxed text-cream/80 sm:text-base"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.36 }}
          >
            {requestBanner.copy}
          </motion.p>

          <motion.button
            type="button"
            onClick={scrollToForm}
            className="relative mt-8 inline-flex w-fit items-center gap-3 text-left text-xs font-medium uppercase tracking-[0.28em] text-gold/90 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.48 }}
          >
            <span className="h-px w-8 bg-gold/70" aria-hidden />
            {requestBanner.scrollHint}
          </motion.button>
        </div>
      </div>
    </section>
  );
}
