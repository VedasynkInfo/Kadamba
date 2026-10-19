import { useOfflineState } from '@/hooks/useOfflineState';

/**
 * One bar, above every route, that tells the truth about the connection.
 *
 * Offline is the state users most often mistake for a broken app: forms keep
 * accepting input, the fetch layer quietly pauses, and nothing on screen changes.
 * Saying so — and saying *how much* is waiting — is the difference between "the
 * boutique's system is slow" and "I'll send these when I have signal".
 *
 * It renders inside `RouterShell`, so the public site, the admin console and the
 * customer portal all get it without any of them remembering to opt in. The
 * amber is chosen to read on both the cream public shell and the dark console.
 */
export function OfflineBanner() {
  const { online, queued } = useOfflineState();

  if (online && queued === 0) return null;

  const changes = queued === 1 ? '1 change' : `${queued} changes`;

  const message = !online
    ? queued > 0
      ? `You're offline. ${changes} will be sent when the connection returns.`
      : "You're offline. Showing the last content that loaded."
    : `Back online — sending ${changes}…`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-xs font-medium text-ink"
    >
      <span aria-hidden="true">{online ? '↑' : '⚠'}</span>
      <span>{message}</span>
    </div>
  );
}
