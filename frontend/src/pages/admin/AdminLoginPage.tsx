import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { Button, Input, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { PageMeta, staticPageMeta } from '@/seo';
import { adminHorizonMedia, loginCopy } from './data';

/**
 * Console sign-in: password step, then a second factor step when the account
 * has TOTP enabled.
 */
export default function AdminLoginPage() {
  const { login, isAuthenticated, user, mfaChallenge, completeMfa, cancelMfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from: string }).from.startsWith('/admin')
      ? (location.state as { from: string }).from
      : '/admin';

  if (isAuthenticated && user && (user.role === 'admin' || user.role === 'staff')) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      if (!mfaChallenge) {
        toast({
          tone: 'success',
          title: 'Welcome back',
          description: 'Studio console unlocked.',
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
      toast({ tone: 'error', title: 'Sign-in failed', description: message });
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeMfa(code);
      toast({ tone: 'success', title: 'Verified', description: 'Studio console unlocked.' });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/login" title="Admin Login" />
      <div className="admin-shell grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="relative hidden overflow-hidden lg:block">
          <motion.img
            src={adminHorizonMedia.image}
            alt={adminHorizonMedia.alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={reduced ? false : { scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduced ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/40 via-transparent to-surface" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>

        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-md"
          >
            <p className="font-heading text-[0.62rem] uppercase tracking-[0.42em] text-gold/85">
              {loginCopy.locationLine}
            </p>
            <p className="mt-4 font-heading text-4xl tracking-[0.06em] text-gold">
              {loginCopy.brandName}
            </p>

            {mfaChallenge ? (
              <>
                <h1 className="mt-5 font-heading text-2xl text-ink-inverse sm:text-3xl">
                  Two-step verification
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-ink-inverse/65">
                  Enter the 6-digit code from your authenticator app. You can also use one of
                  your recovery codes.
                </p>

                <form onSubmit={onVerify} className="mt-10 space-y-5" noValidate>
                  <div className="[&_label]:text-ink-inverse/80">
                    <Input
                      label="Verification code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456 or recovery code"
                    />
                  </div>
                  {error ? (
                    <p className="text-sm text-gold" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full"
                  >
                    Verify & continue
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      cancelMfa();
                      setCode('');
                      setError('');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1 text-[0.65rem] uppercase tracking-[0.22em] text-ink-inverse/45 transition hover:text-gold"
                  >
                    <Icon name="arrowLeft" size={14} />
                    Back to sign in
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="mt-5 font-heading text-2xl text-ink-inverse sm:text-3xl">
                  {loginCopy.headline}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-ink-inverse/65">{loginCopy.copy}</p>

                <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
                  <div className="[&_label]:text-ink-inverse/80">
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="[&_label]:text-ink-inverse/80">
                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error ? (
                    <p className="text-sm text-gold" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full"
                  >
                    Sign in
                  </Button>
                </form>

                <a
                  href="/admin/forgot-password"
                  className="mt-6 inline-block text-[0.65rem] uppercase tracking-[0.22em] text-ink-inverse/45 transition hover:text-gold"
                >
                  Forgot password?
                </a>
              </>
            )}

            <a
              href="/"
              className="mt-10 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.22em] text-ink-inverse/40 transition hover:text-gold"
            >
              <Icon name="arrowLeft" size={14} />
              Public site
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
}
