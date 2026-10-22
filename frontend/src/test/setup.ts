/**
 * jsdom shims for the browser APIs the UI primitives assume.
 *
 * jsdom implements neither `ResizeObserver` nor `matchMedia`, and Radix's
 * dialog and cmdk's list both ask for one when they measure themselves. The
 * stubs are the smallest thing that satisfies them: they never fire, and
 * nothing in the suite depends on a real measurement.
 */
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// The suite does not run with `globals: true`, so Testing Library's automatic
// cleanup (which hooks the global `afterEach`) never registers. Without this,
// one test's rendered tree stays in the document and the next test finds two
// elements where it expected one.
afterEach(() => {
  cleanup();
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// cmdk scrolls the highlighted item into view; jsdom has no layout, so the
// call is a no-op here.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom's scrollTo exists but throws "not implemented"; `ScrollRestoration`
// calls it after navigation. Silence the noise without pretending to scroll.
window.scrollTo = () => {};

// framer-motion's `useInView` (used by CountUp) constructs one of these. The
// stub never reports an intersection: a test asserts text, not animation.
class IntersectionObserverStub {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
