import type { Transition, Variants } from 'framer-motion';

/**
 * The console's motion.
 *
 * The public site's motion is slow and cinematic (a section drifts up as it
 * arrives). The console's is the opposite: it is a working surface, so motion
 * there is short, functional, and mostly used to say *this changed*.
 */

/** The console's spring: quick, with a little weight on the way in. */
export const adminSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

/** A group of panels arriving together, a beat apart. */
export const panelGroup: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

/** One panel in that group. */
export const panelItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

/** The tab indicator that slides from one tab to the next. */
export const tabIndicator: Variants = {
  hidden: { opacity: 0, scaleX: 0.6 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};
