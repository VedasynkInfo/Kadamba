import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';

interface ProfileDetailsCardProps {
  initialName: string;
  email: string;
  role: string;
  onSave: (name: string) => Promise<void>;
}

export function ProfileDetailsCard({
  initialName,
  email,
  role,
  onSave,
}: ProfileDetailsCardProps) {
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Full name cannot be blank', tone: 'error' });
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim());
      toast({ title: 'Profile details updated', tone: 'success' });
    } catch (err: any) {
      toast({
        title: 'Could not update profile',
        description: err?.message || 'Server error',
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
          Account Identification
        </h3>
        <p className="text-[11px] opacity-70 mt-0.5">
          Your public administrator name and studio communication credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Display Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition bg-surface-sunken border-line"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Work Email Address
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border py-2.5 px-3 text-xs opacity-65 cursor-not-allowed font-mono bg-surface-sunken border-line"
            />
            <span className="text-[10px] opacity-70 block mt-0.5">
              Verified administrative email (fixed)
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Access Role Level
            </label>
            <input
              type="text"
              disabled
              value={role.toUpperCase()}
              className="w-full rounded-xl border py-2.5 px-3 text-xs opacity-65 cursor-not-allowed font-semibold uppercase tracking-wider bg-surface-sunken border-line"
            />
            <span className="text-[10px] opacity-70 block mt-0.5">
              Role permissions managed by Master Superadmin
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-70 cursor-pointer bg-brand text-ink-on-brand"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
