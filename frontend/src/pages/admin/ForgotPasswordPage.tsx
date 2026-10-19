import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, useToast } from '@/components/ui';
import { authApi } from '@/services/auth/authService';
import { PageMeta, staticPageMeta } from '@/seo';

/**
 * Request a password reset link. The response is deliberately identical for
 * known and unknown emails, so this page must not imply that an address exists.
 */
export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setSent(true);
      const token = (response.data as { devToken?: string } | undefined)?.devToken;
      if (token) setDevToken(token);
      toast({
        tone: 'success',
        title: 'Check your inbox',
        description: 'If that email is registered, a reset link is on its way.',
      });
    } catch {
      // Even a transport failure must not disclose whether the account exists.
      setSent(true);
      toast({
        tone: 'info',
        title: 'Check your inbox',
        description: 'If that email is registered, a reset link is on its way.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/forgot-password" title="Reset Password" />
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)] px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-heading text-[0.62rem] uppercase tracking-[0.42em] text-gold/85">
            Kadamba Studio · Kurnool
          </p>
          <h1 className="mt-4 font-heading text-3xl text-gold">Reset your password</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/60">
            Enter the email address on your studio account. We will send a single-use link that
            expires in 30 minutes.
          </p>

          {sent ? (
            <div className="mt-8 space-y-4">
              <p className="rounded-sm border border-gold/25 bg-gold/5 p-4 text-sm text-cream/80">
                If that email is registered, a reset link has been sent. Check your inbox and spam
                folder.
              </p>
              {devToken ? (
                <div className="rounded-sm border border-cream/15 p-4 text-xs text-cream/60">
                  <p className="font-semibold uppercase tracking-[0.16em] text-gold/80">
                    Development link
                  </p>
                  <p className="mt-2 break-all">
                    <Link
                      className="text-gold underline"
                      to={`/admin/reset-password?token=${encodeURIComponent(devToken)}`}
                    >
                      Open reset form
                    </Link>
                  </p>
                  <p className="mt-2 opacity-70">
                    SMTP is not configured, so the link is shown here instead of emailed.
                  </p>
                </div>
              ) : null}
              <Link
                to="/admin/login"
                className="inline-block text-[0.65rem] uppercase tracking-[0.22em] text-cream/45 transition hover:text-gold"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              <div className="[&_label]:text-cream/80">
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
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Send reset link
              </Button>
              <Link
                to="/admin/login"
                className="block text-center text-[0.65rem] uppercase tracking-[0.22em] text-cream/45 transition hover:text-gold"
              >
                ← Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
