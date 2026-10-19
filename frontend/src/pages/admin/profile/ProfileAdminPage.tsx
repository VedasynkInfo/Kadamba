import { useAuth } from '@/hooks/useAuth';
import { PageMeta, staticPageMeta } from '@/seo';
import { ProfileHeroCard } from './ProfileHeroCard';
import { ProfileDetailsCard } from './ProfileDetailsCard';
import { ProfileSecurityCard } from './ProfileSecurityCard';
import { ProfileMfaCard } from './ProfileMfaCard';
import { ProfileSessionsCard } from './ProfileSessionsCard';

export default function ProfileAdminPage() {
  const { user, updateProfile } = useAuth();

  const handleSaveName = async (name: string) => {
    await updateProfile({ name });
  };

  const handleUpdatePassword = async (currentPassword: string, nextPassword: string) => {
    await updateProfile({
      currentPassword,
      newPassword: nextPassword,
    });
  };

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/profile" title="Administrator Profile" />

      <div className="max-w-4xl space-y-6 mx-auto">
        {/* Compact Modern Header */}
        <div className="flex flex-col gap-1">
          <h1
            className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: 'var(--admin-text, #f3f4f6)' }}
          >
            Administrator Profile & Security
          </h1>
          <p className="text-xs opacity-60">
            Manage your personal studio access identity, verified email, and master credentials
          </p>
        </div>

        {/* Hero Identity Banner Card */}
        <ProfileHeroCard
          name={user?.name || ''}
          email={user?.email || ''}
          role={user?.role || 'admin'}
        />

        {/* Account Details */}
        <ProfileDetailsCard
          initialName={user?.name || ''}
          email={user?.email || ''}
          role={user?.role || 'admin'}
          onSave={handleSaveName}
        />

        {/* Security / Password */}
        <ProfileSecurityCard onUpdatePassword={handleUpdatePassword} />

        {/* Two-factor authentication */}
        <ProfileMfaCard />

        {/* Active devices */}
        <ProfileSessionsCard />
      </div>
    </>
  );
}
