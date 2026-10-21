import { useState } from 'react';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/ui';

interface ProfileSecurityCardProps {
  onUpdatePassword: (current: string, next: string) => Promise<void>;
}

export function ProfileSecurityCard({ onUpdatePassword }: ProfileSecurityCardProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !nextPassword) {
      toast({ title: 'Please fill in all password fields', tone: 'error' });
      return;
    }
    if (nextPassword !== confirm) {
      toast({ title: 'New passwords do not match', tone: 'error' });
      return;
    }
    if (nextPassword.length < 8) {
      toast({ title: 'New password must be at least 8 characters long', tone: 'error' });
      return;
    }

    setSaving(true);
    try {
      await onUpdatePassword(currentPassword, nextPassword);
      toast({ title: 'Security credentials updated successfully', tone: 'success' });
      setCurrentPassword('');
      setNextPassword('');
      setConfirm('');
    } catch (err: any) {
      toast({
        title: 'Failed to update password',
        description: err?.message || 'Check your current password and try again',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-2xl border p-6 shadow-sm transition-colors text-xs bg-surface-raised border-line text-ink-raised"
    >
      <div className="border-b pb-4 mb-5 border-line">
        <h3 className="font-heading text-base font-bold tracking-wide">
          Security & Access Key
        </h3>
        <p className="text-[11px] opacity-60 mt-0.5">
          Rotate your administrator studio password to safeguard customer and financial ledgers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Current Password *
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition bg-surface-sunken border-line"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              New Password *
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={nextPassword}
              onChange={(e) => setNextPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition bg-surface-sunken border-line"
            />
          </div>
        </div>

        {/* Security Checklist */}
        <div
          className="rounded-xl border p-3.5 space-y-1.5 border-line bg-surface-sunken"
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
            Password Policy Requirements:
          </span>
          <div className="flex flex-wrap gap-4 text-[11px] opacity-70">
            <span className={nextPassword.length >= 8 ? 'text-emerald-400 font-semibold' : ''}>
              <Icon name="check" size={12} className="mr-1 inline align-middle" />
              Minimum 8 characters
            </span>
            <span
              className={
                nextPassword && nextPassword === confirm ? 'text-emerald-400 font-semibold' : ''
              }
            >
              <Icon name="check" size={12} className="mr-1 inline align-middle" />
              Passwords must match
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-xs font-bold border hover:bg-current/[0.05] transition disabled:opacity-50 cursor-pointer border-line"
          >
            {saving ? 'Updating Credentials...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
