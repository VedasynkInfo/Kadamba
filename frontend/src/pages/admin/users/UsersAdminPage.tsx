import { useCallback, useEffect, useState } from 'react';
import { Spinner, useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import {
  usersApi,
  type PermissionGroup,
  type PermissionKey,
  type ConsoleUser,
} from '@/services/users/usersService';
import { cn } from '@/utils/cn';

/**
 * Users & Roles desk: who can sign in, what they can do, and whether their
 * account is active. Permission changes take effect on the user's next request
 * because the server re-reads capabilities per call.
 */
export default function UsersAdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ConsoleUser[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [defaults, setDefaults] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ConsoleUser | null>(null);
  const [draft, setDraft] = useState<Set<PermissionKey>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, catalog] = await Promise.all([
        usersApi.list({ q: query || undefined, limit: 100 }),
        usersApi.permissions(),
      ]);
      setUsers(list.items);
      setGroups(catalog.groups);
      setDefaults([...catalog.staffDefaults]);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not load users',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openPermissions(user: ConsoleUser) {
    setEditing(user);
    setDraft(new Set(user.permissions));
  }

  function toggle(permission: PermissionKey) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  async function savePermissions() {
    if (!editing) return;
    setSavingId(editing.id);
    try {
      await usersApi.setPermissions(editing.id, [...draft]);
      toast({ tone: 'success', title: 'Permissions updated', description: editing.email });
      setEditing(null);
      await load();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingId(null);
    }
  }

  async function toggleStatus(user: ConsoleUser) {
    const next = user.status === 'active' ? 'disabled' : 'active';
    setSavingId(user.id);
    try {
      await usersApi.setStatus(user.id, next);
      toast({
        tone: 'success',
        title: next === 'disabled' ? 'Account disabled' : 'Account enabled',
        description:
          next === 'disabled'
            ? `${user.email} has been signed out everywhere.`
            : `${user.email} can sign in again.`,
      });
      await load();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingId(null);
    }
  }

  async function changeRole(user: ConsoleUser, role: 'admin' | 'staff' | 'user') {
    setSavingId(user.id);
    try {
      await usersApi.setRole(user.id, role);
      toast({
        tone: 'success',
        title: 'Role updated',
        description: `${user.email} must sign in again.`,
      });
      await load();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/users" title="Users & Roles" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl text-ink"
            >
              Users & Roles
            </h1>
            <p className="text-xs opacity-60">
              Control who can sign in and exactly what each person can reach.
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="w-full rounded-xl border px-3 py-2 text-xs sm:w-64 bg-surface-sunken border-line"
          />
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border bg-surface-raised border-line"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b text-[10px] uppercase tracking-wider opacity-60 border-line">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">2FA</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 border-line"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{user.name}</p>
                        <p className="opacity-55">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            void changeRole(user, e.target.value as 'admin' | 'staff' | 'user')
                          }
                          disabled={savingId === user.id}
                          className="rounded-lg border px-2 py-1 text-[11px] capitalize border-line bg-current/[0.06]"
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                          <option value="user">User</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            user.mfaEnabled
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400',
                          )}
                        >
                          {user.mfaEnabled ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            user.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400',
                          )}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          {user.role !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => openPermissions(user)}
                              className="rounded-lg border px-2.5 py-1 text-[11px] transition hover:bg-white/5 border-line"
                            >
                              Permissions
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void toggleStatus(user)}
                            disabled={savingId === user.id}
                            className="rounded-lg border px-2.5 py-1 text-[11px] transition hover:bg-white/5 disabled:opacity-50 border-line"
                          >
                            {user.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center opacity-55">
                        No console users found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 bg-surface-raised border-line text-ink-raised"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold">Permissions</h2>
                <p className="text-xs opacity-60">{editing.name} · {editing.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {groups.map((group) => (
                <fieldset key={group.group}>
                  <legend className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {group.group}
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[11px] border-line"
                      >
                        <input
                          type="checkbox"
                          checked={draft.has(permission.key)}
                          onChange={() => toggle(permission.key)}
                          className="accent-current"
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDraft(new Set(defaults))}
                className="text-[11px] uppercase tracking-wider text-gold/80 hover:text-gold"
              >
                Reset to staff defaults
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border px-4 py-2 text-xs border-line"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void savePermissions()}
                  disabled={savingId === editing.id}
                  className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink disabled:opacity-50"
                >
                  {savingId === editing.id ? 'Saving…' : 'Save permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
