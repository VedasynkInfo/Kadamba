import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui';
import { authApi } from '@/services/auth/authService';
import { useAuth } from '@/hooks/useAuth';

interface EnrolmentState {
  secret: string;
  otpauthUri: string;
}

/**
 * Two-factor authentication card.
 *
 * Enrolment is a two-step handshake: the server stores a pending secret, then
 * only enables MFA once the user proves their authenticator app works. Recovery
 * codes are shown exactly once.
 */
export function ProfileMfaCard() {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [enrolment, setEnrolment] = useState<EnrolmentState | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);
  /**
   * Distinguishes "regenerate" (ask for the password first) from the
   * newly-issued codes panel. Using `backupCodes` for both was ambiguous —
   * an empty array reads as truthy, which showed a blank codes list.
   */
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await authApi.mfaStatus();
      setEnabled(Boolean(response.data?.enabled));
    } catch {
      setEnabled(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startEnrolment() {
    setBusy(true);
    try {
      const response = await authApi.mfaEnrollStart();
      if (!response.data) throw new Error(response.message || 'Could not start enrolment');
      setEnrolment(response.data);
      setBackupCodes(null);
      setRegenerating(false);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not start enrolment',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrolment() {
    setBusy(true);
    try {
      const response = await authApi.mfaEnrollConfirm(code.trim());
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Verification failed');
      }
      setBackupCodes(response.data.backupCodes);
      setEnrolment(null);
      setCode('');
      setEnabled(true);
      await refreshUser();
      toast({ tone: 'success', title: 'Two-factor authentication enabled' });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not enable 2FA',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await authApi.mfaDisable({ password, code: code.trim() });
      setDisabling(false);
      setPassword('');
      setCode('');
      setEnabled(false);
      toast({
        tone: 'success',
        title: 'Two-factor authentication disabled',
        description: 'Please sign in again.',
      });
      // Every session is revoked server-side; send the user to the login page.
      window.location.assign('/admin/login');
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not disable 2FA',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      const response = await authApi.mfaBackupCodes(password);
      setBackupCodes(response.data?.backupCodes ?? []);
      setRegenerating(false);
      setPassword('');
      toast({ tone: 'success', title: 'New recovery codes generated' });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not regenerate codes',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  const cardStyle = {
    backgroundColor: 'var(--admin-card)',
    borderColor: 'var(--admin-border)',
    color: 'var(--admin-card-text)',
  };

  return (
    <div className="rounded-2xl border p-6 shadow-sm text-xs" style={cardStyle}>
      <div
        className="border-b pb-4 mb-5 border-line"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-base font-bold tracking-wide">
              Two-Factor Authentication
            </h3>
            <p className="text-[11px] opacity-70 mt-0.5">
              Protect the ledger and customer data with an authenticator app
            </p>
          </div>
          {enabled !== null ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                enabled
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {enabled ? 'Enabled' : 'Not enabled'}
            </span>
          ) : null}
        </div>
      </div>

      {backupCodes && backupCodes.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
            Save these recovery codes now
          </p>
          <p className="text-[11px] opacity-65">
            Each code works once if you lose your phone. They will not be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-4">
            {backupCodes.map((backupCode) => (
              <span
                key={backupCode}
                className="rounded-lg border px-2 py-1.5 text-center border-line"
              >
                {backupCode}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setBackupCodes(null)}
            className="rounded-xl border px-4 py-2 text-xs font-semibold border-line"
          >
            I have saved them
          </button>
        </div>
      ) : enrolment ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-4 text-[11px] opacity-75">
            <li>Open your authenticator app (Google Authenticator, 1Password, Authy…).</li>
            <li>Add an account and enter this setup key, or paste the URI.</li>
            <li>Enter the 6-digit code below to confirm.</li>
          </ol>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider opacity-70">Setup key</p>
            <code className="block break-all rounded-lg border px-3 py-2 font-mono text-[11px] border-line">
              {enrolment.secret}
            </code>
            <code className="block break-all text-[10px] opacity-45">{enrolment.otpauthUri}</code>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="123456"
            className="w-full rounded-xl border px-3 py-2.5 text-xs bg-surface-sunken border-line"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void confirmEnrolment()}
              disabled={busy || code.trim().length < 6}
              className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink disabled:opacity-70"
            >
              {busy ? 'Verifying…' : 'Enable 2FA'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEnrolment(null);
                setCode('');
              }}
              className="rounded-xl border px-4 py-2 text-xs border-line"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : disabling ? (
        <div className="space-y-3">
          <p className="text-[11px] opacity-70">
            Confirm your password and a current code to turn off two-factor authentication.
            All sessions will be signed out.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl border px-3 py-2.5 text-xs bg-surface-sunken border-line"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="123456"
            className="w-full rounded-xl border px-3 py-2.5 text-xs bg-surface-sunken border-line"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void disable()}
              disabled={busy || !password || code.trim().length < 6}
              className="rounded-xl border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-70"
            >
              {busy ? 'Disabling…' : 'Disable 2FA'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDisabling(false);
                setPassword('');
                setCode('');
              }}
              className="rounded-xl border px-4 py-2 text-xs border-line"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <p className="text-[11px] opacity-70">
            Two-factor authentication is active. Your account requires a code from your
            authenticator app at every sign-in.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDisabling(true)}
              className="rounded-xl border px-4 py-2 text-xs font-semibold border-line"
            >
              Disable 2FA
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setRegenerating(true);
              }}
              className="rounded-xl border px-4 py-2 text-xs border-line"
            >
              Regenerate recovery codes
            </button>
          </div>
          {regenerating ? (
            <div className="space-y-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password to confirm"
                autoComplete="current-password"
                className="w-full rounded-xl border px-3 py-2.5 text-xs bg-surface-sunken border-line"
              />
              <button
                type="button"
                onClick={() => void regenerate()}
                disabled={busy || !password}
                className="rounded-xl border px-4 py-2 text-xs font-semibold disabled:opacity-70 border-line"
              >
                {busy ? 'Generating…' : 'Generate new codes'}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] opacity-70">
            Add a second step at sign-in. Recommended for every admin account.
          </p>
          <button
            type="button"
            onClick={() => void startEnrolment()}
            disabled={busy}
            className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink disabled:opacity-70"
          >
            {busy ? 'Preparing…' : 'Set up two-factor authentication'}
          </button>
        </div>
      )}
    </div>
  );
}
