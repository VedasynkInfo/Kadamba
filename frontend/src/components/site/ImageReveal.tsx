import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface ImageRevealProps {
  image: string;
  alt: string;
  eyebrow?: string;
  title: React.ReactNode;
  accent?: React.ReactNode;
  copy?: string;
  className?: string;
}

/**
 * A full-viewport image that settles into place as it arrives — a cinematic
 * breath between two editorial sections. The photograph scales down from a
 * slightly enlarged state while a veil lifts, and the caption rises a beat
 * later. Reduced motion shows the still frame and the caption at once.
 */
export function ImageReveal({ image, alt, eyebrow, title, accent, copy, className }: ImageRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.18, 1.04, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);
  const veil = useTransform(scrollYProgress, [0, 0.45], [0.72, 0.32]);
  const captionOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const captionY = useTransform(scrollYProgress, [0.15, 0.45], [24, 0]);

  return (
    <section
      ref={ref}
      className={cn('on-dark relative isolate h-[92svh] min-h-[34rem] w-full overflow-hidden bg-espresso text-ink-inverse', className)}
    >
      <motion.div className="absolute inset-0" style={reduced ? undefined : { scale, y }}>
        <OptimizedImage
          src={image}
          alt={alt}
          sizes="100vw"
          width={2000}
          height={1250}
          className="h-full w-full object-cover"
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-espresso"
        style={reduced ? { opacity: 0.32 } : { opacity: veil }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,0.15)_0%,rgba(10,8,6,0.05)_40%,rgba(10,8,6,0.78)_100%)]" aria-hidden />

      <motion.div
        className="house-container relative z-10 flex h-full flex-col justify-end pb-14 lg:pb-20"
        style={reduced ? undefined : { opacity: captionOpacity, y: captionY }}
      >
        {eyebrow ? <p className="eyebrow text-gold/85">{eyebrow}</p> : null}
        <h2 className="display-lg mt-6 max-w-3xl text-ink-inverse">
          {title} {accent ? <span className="display-accent">{accent}</span> : null}
        </h2>
        {copy ? <p className="text-lede mt-6 max-w-xl text-ink-inverse/70">{copy}</p> : null}
      </motion.div>
    </section>
  );
}