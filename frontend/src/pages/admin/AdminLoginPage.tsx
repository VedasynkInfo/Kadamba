import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { PageMeta, staticPageMeta } from '@/seo';
import { adminHorizonMedia, loginCopy } from './data';

/**
 * Console sign-in — ink panel + filmstrip, not a marketing hero.
 */
export default function AdminLoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from: string }).from.startsWith('/admin')
      ? (location.state as { from: string }).from
      : '/admin';

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast({ tone: 'success', title: 'Welcome back', description: 'Studio console unlocked.' });
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
      <PageMeta {...staticPageMeta.admin} path="/admin/login" title="Admin Login" />
      <div className="grid min-h-screen bg-[#070605] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img
          src={adminHorizonMedia.image}
          alt={adminHorizonMedia.alt}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduced ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070605]/40 via-transparent to-[#070605]" />
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
          <h1 className="mt-5 font-heading text-2xl text-cream sm:text-3xl">
            {loginCopy.headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/65">{loginCopy.copy}</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
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
            <div className="[&_label]:text-cream/80">
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
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <a
            href="/"
            className="mt-10 inline-block text-[0.65rem] uppercase tracking-[0.22em] text-cream/40 transition hover:text-gold"
          >
            ← Public site
          </a>
          {import.meta.env.DEV ? (
            <p className="mt-6 text-xs leading-relaxed text-cream/35">
              Dev unlock: admin@kadamba.local / kadamba123 (when API is offline)
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
    </>
  );
}
