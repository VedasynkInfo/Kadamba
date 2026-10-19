import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui';
import { authApi } from '@/services/auth/authService';

interface Session {
  id: string;
  familyId: string;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string;
  ip?: string;
  expiresAt: string;
}

/** Compact "browser · OS" label from a user-agent string. */
function describeAgent(userAgent?: string): string {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

/**
 * Active sessions: lets an admin see every device holding a refresh token and
 * revoke any of them. Revoking kills the refresh chain; the other device's
 * short-lived access token dies within its 15-minute TTL.
 */
export function ProfileSessionsCard() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authApi.sessions();
      setSessions(response.data?.items ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(familyId: string) {
    setBusy(familyId);
    try {
      await authApi.revokeSession(familyId);
      toast({ tone: 'success', title: 'Device signed out' });
      await load();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not revoke session',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  async function revokeAll() {
    setBusy('all');
    try {
      await authApi.revokeAllSessions();
      window.location.assign('/admin/login');
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not sign out everywhere',
        description: err instanceof Error ? err.message : undefined,
      });
      setBusy(null);
    }
  }

  return (
    <div
      className="rounded-2xl border p-6 shadow-sm text-xs"
      style={{
        backgroundColor: 'var(--admin-card)',
        borderColor: 'var(--admin-border)',
        color: 'var(--admin-card-text, var(--admin-text))',
      }}
    >
      <div
        className="border-b pb-4 mb-5 flex items-start justify-between gap-4"
        style={{ borderColor: 'var(--admin-border)' }}
      >
        <div>
          <h3 className="font-heading text-base font-bold tracking-wide">Active Devices</h3>
          <p className="text-[11px] opacity-60 mt-0.5">
            Every browser currently signed in to your account
          </p>
        </div>
        <button
          type="button"
          onClick={() => void revokeAll()}
          disabled={busy === 'all'}
          className="rounded-xl border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          {busy === 'all' ? 'Signing out…' : 'Sign out everywhere'}
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center opacity-55">Loading devices…</p>
      ) : sessions.length === 0 ? (
        <p className="py-6 text-center opacity-55">No active sessions.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-2 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {describeAgent(session.userAgent)}
                  {session.current ? (
                    <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                      This device
                    </span>
                  ) : null}
                </p>
                <p className="opacity-55">
                  Last used {new Date(session.lastUsedAt).toLocaleString()}
                  {session.ip ? ` · ${session.ip}` : ''}
                </p>
              </div>
              {session.current ? (
                <span className="text-[11px] opacity-45">Current session</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void revoke(session.familyId)}
                  disabled={busy === session.familyId}
                  className="shrink-0 rounded-lg border px-3 py-1.5 text-[11px] transition hover:bg-white/5 disabled:opacity-50"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  {busy === session.familyId ? 'Revoking…' : 'Sign out'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
