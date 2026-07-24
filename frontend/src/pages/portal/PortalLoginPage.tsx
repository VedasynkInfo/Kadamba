import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '@/components/ui';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { brand } from '@/pages/home/data';
import { PageMeta } from '@/seo';

export default function PortalLoginPage() {
  const { login, isAuthenticated } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from =
    (location.state as { from?: string } | null)?.from?.startsWith('/portal')
      ? (location.state as { from: string }).from
      : '/portal/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast({ tone: 'success', title: 'Welcome back', description: 'Your portal is ready.' });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
      toast({ tone: 'error', title: 'Sign-in failed', description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Portal Login" description="Sign in to your Kadamba customer portal." path="/portal/login" />
      <div className="grid min-h-screen bg-[#0c0a08] lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="relative hidden overflow-hidden lg:block"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(12,10,8,0.55), rgba(12,10,8,0.85)), url(https://images.unsplash.com/photo-1594552072238-8dcd8a33f848?auto=format&fit=crop&w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="font-heading text-3xl text-gold">{brand.name}</p>
            <p className="mt-2 max-w-sm text-sm text-cream/70">{brand.tagline}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-16 sm:px-12">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-md"
          >
            <p className="text-[0.62rem] uppercase tracking-[0.4em] text-gold/80">Customer portal</p>
            <h1 className="mt-3 font-heading text-3xl text-cream">Sign in</h1>
            <p className="mt-2 text-sm text-cream/60">
              After your order is confirmed, activate with your Reference ID, then sign in here.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-cream/55">
              First time?{' '}
              <Link to="/portal/activate" className="text-gold hover:underline">
                Activate with Reference ID
              </Link>
            </p>
            <p className="mt-3 text-sm text-cream/45">
              Need help ordering?{' '}
              <Link to="/request-service" className="text-cream/80 hover:underline">
                Enquire without login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
