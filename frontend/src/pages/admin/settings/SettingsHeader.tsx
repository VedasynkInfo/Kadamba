interface SettingsHeaderProps {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onResetOpen: () => void;
}

export function SettingsHeader({
  dirty,
  saving,
  onSave,
  onResetOpen,
}: SettingsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1
            className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: 'var(--admin-text, #f3f4f6)' }}
          >
            Studio & Website Settings
          </h1>
          {dirty ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved Changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Synced Live
            </span>
          )}
        </div>
        <p className="text-xs opacity-60 mt-0.5">
          Brand identity, SEO, contact channels, media rules, transactional email, and dynamic luxury theme
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onResetOpen}
          className="rounded-lg border px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
        >
          Reset Defaults
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 disabled:opacity-50 cursor-pointer"
          style={{
            backgroundColor: 'var(--admin-primary, #b59410)',
            color: 'var(--admin-primary-text, #ffffff)',
          }}
        >
          {saving ? (
            <>
              <span className="animate-spin text-sm">⏳</span>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
