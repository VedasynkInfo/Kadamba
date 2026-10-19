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
      className="rounded-2xl border p-6 shadow-sm transition-colors text-xs"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
    >
      <div className="border-b pb-4 mb-5" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
        <h3 className="font-heading text-base font-bold tracking-wide">
          Account Identification
        </h3>
        <p className="text-[11px] opacity-60 mt-0.5">
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
            className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
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
              className="w-full rounded-xl border py-2.5 px-3 text-xs opacity-65 cursor-not-allowed font-mono"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.08)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))',
                color: 'inherit',
              }}
            />
            <span className="text-[10px] opacity-50 block mt-0.5">
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
              className="w-full rounded-xl border py-2.5 px-3 text-xs opacity-65 cursor-not-allowed font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.08)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))',
                color: 'inherit',
              }}
            />
            <span className="text-[10px] opacity-50 block mt-0.5">
              Role permissions managed by Master Superadmin
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
