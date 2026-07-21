import { useState, type FormEvent } from 'react';
import { Button, Input, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';

/**
 * Profile desk — account name + password via Auth API.
 */
export default function ProfileAdminPage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ tone: 'error', title: 'Name required' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast({ tone: 'success', title: 'Profile updated' });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not update profile',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword || !nextPassword) {
      toast({ tone: 'error', title: 'Fill all password fields' });
      return;
    }
    if (nextPassword !== confirm) {
      toast({ tone: 'error', title: 'Passwords do not match' });
      return;
    }
    if (nextPassword.length < 8) {
      toast({ tone: 'error', title: 'Use at least 8 characters' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        currentPassword,
        newPassword: nextPassword,
      });
      toast({ tone: 'success', title: 'Password updated' });
      setCurrentPassword('');
      setNextPassword('');
      setConfirm('');
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not update password',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHorizonBanner
        title={adminBanners.profile.title}
        copy={adminBanners.profile.copy}
        actionLabel={adminBanners.profile.actionLabel}
        onAction={() => document.getElementById('profile-form')?.scrollIntoView({ behavior: 'smooth' })}
      />

      <section className="mx-auto max-w-xl space-y-12 px-4 py-10 sm:px-6 md:px-10">
        <form id="profile-form" onSubmit={onSaveProfile} className="space-y-4">
          <p className="font-heading text-[0.65rem] uppercase tracking-[0.28em] text-black/45">
            Account
          </p>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Input label="Role" value={user?.role ?? ''} disabled />
          <Button type="submit" variant="primary" disabled={saving}>
            Save profile
          </Button>
        </form>

        <form onSubmit={onPassword} className="space-y-4 border-t border-black/10 pt-10">
          <p className="font-heading text-[0.65rem] uppercase tracking-[0.28em] text-black/45">
            Password
          </p>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" variant="luxury" disabled={saving}>
            Update password
          </Button>
        </form>
      </section>
    </>
  );
}
