import { useCallback, useEffect, useState } from 'react';
import { Spinner, useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { auditApi, type AuditEntry } from '@/services/users/auditService';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.password_changed': 'Password changed',
  'auth.password_reset_requested': 'Password reset requested',
  'auth.password_reset_completed': 'Password reset completed',
  'auth.mfa_enabled': '2FA enabled',
  'auth.mfa_disabled': '2FA disabled',
  'auth.sessions_revoked': 'Sessions revoked',
  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.disabled': 'User disabled',
  'user.enabled': 'User enabled',
  'user.permissions_changed': 'Permissions changed',
  'staff.created': 'Staff created',
  'payment.recorded': 'Payment recorded',
  'payment.overpayment_override': 'Overpayment override',
  'order.status_changed': 'Order status changed',
};

export default function AuditAdminPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditApi.list({
        page,
        limit: PAGE_SIZE,
        q: query || undefined,
        action: action || undefined,
        outcome: outcome || undefined,
      });
      setEntries(result.items);
      setTotal(result.pagination.total);
      setPages(result.pagination.pages);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not load the audit log',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, query, action, outcome, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function verify() {
    setVerifying(true);
    try {
      const result = await auditApi.verify();
      toast({
        tone: result.valid ? 'success' : 'error',
        title: result.valid ? 'Audit chain intact' : 'Audit chain broken',
        description: result.valid
          ? `${result.checked} entries verified.`
          : `Tampering detected at entry ${result.brokenAt}.`,
      });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Verification failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/audit" title="Audit Log" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl text-ink"
            >
              Audit Log
            </h1>
            <p className="text-xs opacity-60">
              Every privileged action, in order, hash-chained so tampering is detectable.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void verify()}
            disabled={verifying}
            className="rounded-xl border px-4 py-2 text-[11px] uppercase tracking-wider transition hover:bg-white/5 disabled:opacity-50 border-line"
          >
            {verifying ? 'Verifying…' : 'Verify integrity'}
          </button>
        </header>

        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search summary, name or email"
            className="rounded-xl border px-3 py-2 text-xs bg-surface-sunken border-line"
          />
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="rounded-xl border px-3 py-2 text-xs bg-surface-sunken border-line"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={outcome}
            onChange={(e) => {
              setPage(1);
              setOutcome(e.target.value);
            }}
            className="rounded-xl border px-3 py-2 text-xs bg-surface-sunken border-line"
          >
            <option value="">All outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border bg-surface-raised border-line"
          >
            <ul className="divide-y border-line">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                      {entry.outcome === 'failure' ? (
                        <span className="ml-2 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-400">
                          failed
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate opacity-65">{entry.summary}</p>
                    <p className="opacity-40">
                      {entry.actorEmail || entry.actorName || 'system'}
                      {entry.ip ? ` · ${entry.ip}` : ''}
                    </p>
                  </div>
                  <time className="shrink-0 opacity-50" dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
              {entries.length === 0 ? (
                <li className="px-4 py-12 text-center text-xs opacity-55">
                  No audit entries match these filters.
                </li>
              ) : null}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <p className="opacity-55">
            {total} {total === 1 ? 'entry' : 'entries'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                'rounded-lg border px-3 py-1.5 transition hover:bg-white/5',
                page <= 1 && 'opacity-40', 'border-line'
              )}
            >
              Previous
            </button>
            <span className="opacity-60">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className={cn(
                'rounded-lg border px-3 py-1.5 transition hover:bg-white/5',
                page >= pages && 'opacity-40', 'border-line'
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
