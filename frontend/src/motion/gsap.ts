import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * One registration point for GSAP.
 *
 * Importing `ScrollTrigger` registers a plugin with the global GSAP instance;
 * doing that from a section component means the plugin is re-evaluated every
 * time that chunk loads. Keeping it here also gives every scroll story the same
 * configuration and a single place to add a plugin later.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
