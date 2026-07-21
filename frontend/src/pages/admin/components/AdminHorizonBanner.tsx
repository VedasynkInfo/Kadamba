import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { brand } from '@/pages/home/data';
import { adminHorizonMedia } from '../data';
import { cn } from '@/utils/cn';

export interface AdminHorizonBannerProps {
  title: string;
  copy: string;
  density?: 'desk' | 'module';
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  image?: string;
  imageAlt?: string;
}

/**
 * Horizon console ribbon — cinematic filmstrip above an ink workplane.
 * Intentionally unlike public full-bleed / split / diagonal heroes.
 */
export function AdminHorizonBanner({
  title,
  copy,
  density = 'module',
  actionLabel,
  actionTo,
  onAction,
  image = adminHorizonMedia.image,
  imageAlt = adminHorizonMedia.alt,
}: AdminHorizonBannerProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const tall = density === 'desk';
  const showAction = Boolean(actionLabel && (onAction || actionTo));

  return (
    <section
      className="relative isolate overflow-hidden bg-[#070605] text-cream"
      aria-label={`${brand.shortName} admin — ${title}`}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          tall ? 'h-[min(32svh,280px)]' : 'h-[min(22svh,168px)]',
        )}
      >
        <motion.img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          width={2400}
          height={900}
          fetchPriority="high"
          initial={reduced ? false : { scale: 1.08, x: '2%' }}
          animate={reduced ? { scale: 1, x: 0 } : { scale: 1, x: '-2%' }}
          transition={{
            duration: reduced ? 0 : 14,
            ease: 'linear',
            repeat: reduced ? 0 : Infinity,
            repeatType: 'reverse',
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#070605]"
          aria-hidden
        />

        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: reduced ? 0 : 0.2 }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-6 bottom-0 flex justify-between sm:inset-x-10"
          aria-hidden
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.span
              key={i}
              className="block h-2 w-px origin-bottom bg-gold/70"
              initial={reduced ? false : { scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                duration: 0.35,
                delay: reduced ? 0 : 0.15 + i * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </div>
      </div>

      <div className="border-b border-gold/12 bg-[#0c0a08]">
        <div
          className={cn(
            'mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:px-8 lg:px-12',
            tall
              ? 'py-10 md:flex-row md:items-end md:justify-between md:py-12'
              : 'py-7 md:flex-row md:items-end md:justify-between md:py-8',
          )}
        >
          <motion.div
            className="max-w-xl"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
              delay: reduced ? 0 : 0.08,
            }}
          >
            <p className="font-heading text-[0.62rem] uppercase tracking-[0.42em] text-gold/80">
              {brand.location} · Studio console
            </p>
            <p
              className={cn(
                'mt-3 font-heading tracking-[0.08em] text-gold',
                tall ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl',
              )}
            >
              {brand.shortName}
            </p>
            <h1
              className={cn(
                'mt-3 font-heading font-medium text-cream',
                tall ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
              )}
            >
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70 sm:text-[0.95rem]">
              {copy}
            </p>
          </motion.div>

          {showAction ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: reduced ? 0 : 0.18 }}
              className="shrink-0"
            >
              <Button
                variant="primary"
                size={tall ? 'lg' : 'md'}
                onClick={() => {
                  if (onAction) onAction();
                  else if (actionTo) navigate(actionTo);
                }}
              >
                {actionLabel}
              </Button>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
