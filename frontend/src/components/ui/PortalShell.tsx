import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Name of the shell the current view is rendered in, or `''` on the public site.
 *
 * The console and the portal are plain `<div>`s deep in the layout, so a
 * controlled dialog has no trigger element to walk up from. Detection is by
 * class for that reason, and because only one shell is ever mounted at a time.
 */
function activeShellClass(): string {
  if (typeof document === 'undefined') return '';
  if (document.querySelector('.admin-shell')) return 'admin-shell';
  if (document.querySelector('.portal-shell')) return 'portal-shell';
  return '';
}

/**
 * Keeps portalled content in the same colour shell as the page it came from.
 *
 * Radix portals render into `document.body`, which sits *outside* the
 * `.admin-shell` / `.portal-shell` wrapper that re-points the semantic colour
 * tokens (index.css). Left alone, a dialog opened from the console would resolve
 * `bg-surface-raised` against the light root values and turn white.
 *
 * Re-applying the shell class inside the portal restores the console/portal
 * palette for that subtree. `display: contents` keeps this wrapper box-less, so
 * the shell's own `background-color` cannot paint over the panel — only its
 * custom properties (and `color`) are inherited.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  return <div className={cn('contents', activeShellClass())}>{children}</div>;
}
