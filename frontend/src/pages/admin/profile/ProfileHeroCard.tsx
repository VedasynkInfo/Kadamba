interface ProfileHeroCardProps {
  name: string;
  email: string;
  role: string;
}

export function ProfileHeroCard({ name, email, role }: ProfileHeroCardProps) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('')
    : 'AD';

  return (
    <div
      className="rounded-2xl border p-6 shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-heading text-2xl font-bold shadow-md"
          style={{
            backgroundColor: 'var(--admin-primary, #b59410)',
            color: 'var(--admin-primary-text, #ffffff)',
          }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              {name || 'Atelier Administrator'}
            </h2>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
              style={{
                backgroundColor: 'rgba(181, 148, 16, 0.15)',
                borderColor: 'var(--admin-primary, #b59410)',
                color: 'var(--admin-primary, #b59410)',
              }}
            >
              👑 {role || 'ADMIN'}
            </span>
          </div>
          <p className="text-xs opacity-65 font-mono">{email}</p>
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] opacity-60">
            <span>🏛️ Kadamba&apos;s Designer Studio</span>
            <span>•</span>
            <span>📍 Jubilee Hills / Banjara Hills Atelier</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">● Active Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
