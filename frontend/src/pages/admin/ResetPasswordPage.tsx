import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, useToast } from '@/components/ui';
import { authApi } from '@/services/auth/authService';
import { PageMeta, staticPageMeta } from '@/seo';

/**
 * Complete a password reset (also used as the staff invitation landing page —
 * the invite token is a reset token with a longer expiry).
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checks = useMemo(
    () => ({
      length: password.length >= 10,
      letter: /[A-Za-z]/.test(password),
      number: /\d/.test(password),
      match: Boolean(password) && password === confirm,
    }),
    [password, confirm],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!checks.length || !checks.letter || !checks.number) {
      setError('Choose a stronger password that meets the requirements below.');
      return;
    }
    if (!checks.match) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({ token, password });
      if (!response.success) throw new Error(response.message || 'Reset failed');
      toast({
        tone: 'success',
        title: 'Password updated',
        description: 'Sign in with your new password.',
      });
      navigate('/admin/login', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-surface px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading text-2xl text-gold">Invalid reset link</h1>
          <p className="mt-3 text-sm text-ink-inverse/60">
            This link is missing its token. Request a new one to continue.
          </p>
          <Link
            to="/admin/forgot-password"
            className="mt-6 inline-block text-[0.65rem] uppercase tracking-[0.22em] text-gold/80 hover:text-gold"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/reset-password" title="Set New Password" />
      <div className="admin-shell flex min-h-screen items-center justify-center bg-surface px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-heading text-[0.62rem] uppercase tracking-[0.42em] text-gold/85">
            Kadamba Studio · Kurnool
          </p>
          <h1 className="mt-4 font-heading text-3xl text-gold">Set a new password</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-inverse/60">
            Choose a strong password. Signing in elsewhere will require the new password.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <div className="[&_label]:text-ink-inverse/80">
              <Input
                label="New password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="[&_label]:text-ink-inverse/80">
              <Input
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <ul className="space-y-1.5 text-xs text-ink-inverse/55">
              <li className={checks.length ? 'text-emerald-400' : ''}>
                {checks.length ? '✓' : '•'} At least 10 characters
              </li>
              <li className={checks.letter ? 'text-emerald-400' : ''}>
                {checks.letter ? '✓' : '•'} Contains a letter
              </li>
              <li className={checks.number ? 'text-emerald-400' : ''}>
                {checks.number ? '✓' : '•'} Contains a number
              </li>
              <li className={checks.match ? 'text-emerald-400' : ''}>
                {checks.match ? '✓' : '•'} Passwords match
              </li>
            </ul>

            {error ? (
              <p className="text-sm text-gold" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
