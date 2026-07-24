import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '@/components/ui';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { portalApi } from '@/services/portal/portalService';
import { PageMeta } from '@/seo';

export default function PortalActivatePage() {
  const { isAuthenticated, completeActivation } = usePortalAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();

  const [step, setStep] = useState<'verify' | 'password'>('verify');
  const [referenceId, setReferenceId] = useState(params.get('ref') || '');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [activationToken, setActivationToken] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refHint = useMemo(() => 'Format: KDS-YYYY-####', []);

  if (isAuthenticated) return <Navigate to="/portal/dashboard" replace />;

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await portalApi.verifyActivate({
        referenceId: referenceId.trim().toUpperCase(),
        emailOrMobile: emailOrMobile.trim(),
      });
      setActivationToken(data.activationToken);
      setCustomerName(data.customerName);
      setStep('password');
      toast({ tone: 'success', title: 'Verified', description: `Welcome, ${data.customerName}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onSetPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await portalApi.setPassword({
        activationToken,
        password,
        confirmPassword,
      });
      completeActivation(data.user, data.token);
      toast({ tone: 'success', title: 'Portal activated', description: 'You can track your orders now.' });
      navigate('/portal/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activation failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Activate Portal" description="Activate your Kadamba customer account with your Reference ID." path="/portal/activate" />
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a08] px-4 py-16">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md border border-gold/20 bg-black/50 p-8 backdrop-blur"
        >
          <p className="text-[0.62rem] uppercase tracking-[0.4em] text-gold/80">Activate account</p>
          <h1 className="mt-3 font-heading text-3xl text-cream">
            {step === 'verify' ? 'Reference ID' : 'Set password'}
          </h1>
          <p className="mt-2 text-sm text-cream/60">
            {step === 'verify'
              ? 'Enter the Reference ID from your confirmation email, plus your registered email or mobile.'
              : `Hi ${customerName} — choose a password to open your portal.`}
          </p>

          {step === 'verify' ? (
            <form onSubmit={onVerify} className="mt-8 space-y-4">
              <Input
                label="Reference ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                placeholder="KDS-2026-0001"
                required
              />
              <p className="text-[0.7rem] text-cream/40">{refHint}</p>
              <Input
                label="Email or mobile"
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                required
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Checking…' : 'Verify'}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSetPassword} className="mt-8 space-y-4">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-[0.7rem] text-cream/40">
                At least 8 characters, with a letter and a number.
              </p>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Activating…' : 'Activate portal'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-cream/55">
            Already activated?{' '}
            <Link to="/portal/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
