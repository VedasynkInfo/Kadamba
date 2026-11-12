import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The public site's global chrome.
 *
 * A thin reading-progress rule, a desktop cursor that reacts to interactive
 * elements, a grain layer that keeps the large colour fields from looking
 * digital-flat, and a back-to-top control. All of it is decorative and
 * pointer-events-free; reduced-motion visitors get the progress rule only.
 */
export function GlobalChrome() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const reduced = usePrefersReducedMotion();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-[95] h-[2px] origin-left bg-gold"
        style={{ scaleX: progress }}
        aria-hidden
      />
      <div className="grain-overlay" aria-hidden />
      {!reduced ? <Cursor /> : null}

      <AnimatePresence>
        {showTop ? (
          <motion.button
            key="top"
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
            className="fixed bottom-6 right-6 z-[85] flex size-11 items-center justify-center border border-line-strong bg-surface-raised/90 text-ink shadow-soft backdrop-blur-md transition-colors hover:border-gold hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Back to top"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
              <path
                d="M12 19V5m0 0-6 6m6-6 6 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let ringX = x;
    let ringY = y;
    let frame = 0;
    let active = false;

    const move = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      const target = event.target as Element | null;
      const isInteractive = Boolean(target?.closest('a, button, [data-cursor="view"]'));
      if (isInteractive !== active) {
        active = isInteractive;
        ring.dataset.active = String(active);
      }
    };

    const animate = () => {
      ringX += (x - ringX) * 0.16;
      ringY += (y - ringY) * 0.16;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = window.requestAnimationFrame(animate);
    };

    const leave = () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };
    const enter = () => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
    </>
  );
}
