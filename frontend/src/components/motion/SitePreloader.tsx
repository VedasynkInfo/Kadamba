import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const SESSION_KEY = 'kadamba.preloaded.v1';

/**
 * A short, first-visit curtain.
 *
 * It exists to cover the one paint where webfonts, the first hero image and the
 * theme variables are still settling. It is capped at 700ms, skipped for
 * reduced-motion visitors and skipped on every visit after the first in a
 * session: a preloader that makes a repeat visit slower is a bug.
 */
export function SitePreloader() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(() => {
    if (reduced) return false;
    try {
      return window.sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (reduced) {
      setVisible(false);
      return;
    }

    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
        setVisible(false);
        return;
      }
    } catch {
      // Storage can be unavailable in private browsing; show the curtain once.
    }

    document.documentElement.classList.add('is-preloading');

    let hidden = false;
    let releaseTimer: number | undefined;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      setVisible(false);
      document.documentElement.classList.remove('is-preloading');
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Non-fatal.
      }
    };

    // Hold the curtain just long enough to hide the font swap, then release as
    // soon as the fonts are ready. The hard cap keeps a slow font request from
    // turning the preloader into the page's largest paint.
    const capTimer = window.setTimeout(hide, 700);
    void document.fonts?.ready
      .then(() => {
        releaseTimer = window.setTimeout(hide, 400);
      })
      .catch(() => hide());

    return () => {
      window.clearTimeout(capTimer);
      if (releaseTimer) window.clearTimeout(releaseTimer);
      document.documentElement.classList.remove('is-preloading');
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-espresso text-gold"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label="Preparing the studio"
        >
          <p className="font-heading text-3xl tracking-[0.18em] sm:text-4xl">Kadamba</p>
          <span className="relative block h-px w-32 overflow-hidden bg-gold/25">
            <motion.span
              className="absolute inset-y-0 left-0 bg-gold"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.32em] text-ink-inverse/55">
            Kurnool atelier
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
