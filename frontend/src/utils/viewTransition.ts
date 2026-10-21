import { flushSync } from 'react-dom';

type ViewTransitionDocument = Omit<Document, 'startViewTransition'> & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Open an overlay with a shared-element transition where the browser can.
 *
 * The thumbnail is given the same `view-transition-name` as the overlay image
 * for the duration of the snapshot. It is cleared inside the update callback, so
 * the live DOM never has two elements with the same name. Reduced motion and
 * unsupported browsers simply run the state update.
 */
export function openWithSharedElement(
  element: HTMLElement | null,
  update: () => void,
  options: { name?: string; enabled?: boolean } = {},
) {
  const doc = document as ViewTransitionDocument;
  const name = options.name ?? 'lightbox-media';
  const enabled =
    options.enabled !== false &&
    Boolean(element) &&
    typeof doc.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!enabled || !element || !doc.startViewTransition) {
    update();
    return;
  }

  element.style.viewTransitionName = name;
  try {
    const transition = doc.startViewTransition(() => {
      flushSync(update);
      element.style.viewTransitionName = '';
    });

    void transition.finished.finally(() => {
      element.style.viewTransitionName = '';
    });
  } catch {
    // A browser can reject a transition while another one is running. The
    // overlay must still open, and the thumbnail must not keep the name.
    element.style.viewTransitionName = '';
    update();
  }
}
