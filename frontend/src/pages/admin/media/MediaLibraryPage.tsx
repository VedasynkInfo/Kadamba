import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Spinner, useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { useAuth } from '@/hooks/useAuth';
import {
  mediaApi,
  mediaErrorMessage,
  isInUseConflict,
  type MediaAsset,
  type MediaUsage,
} from '@/services/media/mediaLibraryService';
import { clearAssetCache } from '@/services/media/assetResolver';
import { cn } from '@/utils/cn';
import { Select } from '@/components/ui';

const PAGE_SIZE = 24;

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

/**
 * Media library.
 *
 * Every file the studio has uploaded, with the two things that actually matter
 * once a library grows: what it is (dimensions, weight, variant coverage) and
 * whether anything still points at it. Deletion is orphan-safe — the API refuses
 * to remove a referenced file and hands back the exact list of references, so
 * the force option here is an informed choice rather than a leap of faith.
 */
export default function MediaLibraryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || (user?.permissions ?? []).includes('media:write');

  const [items, setItems] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('');
  const [kind, setKind] = useState<'' | 'image' | 'video'>('');
  const [unusedOnly, setUnusedOnly] = useState(false);

  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [altDraft, setAltDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [blockedBy, setBlockedBy] = useState<MediaUsage[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, folderList] = await Promise.all([
        mediaApi.list({
          page,
          limit: PAGE_SIZE,
          q: query || undefined,
          folder: folder || undefined,
          kind: kind || undefined,
          unusedOnly: unusedOnly || undefined,
        }),
        mediaApi.folders(),
      ]);
      setItems(list.items);
      setPages(list.pagination.pages);
      setTotal(list.pagination.total);
      setFolders(folderList);
    } catch (error) {
      toast({ tone: 'error', title: 'Could not load media', description: mediaErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [page, query, folder, kind, unusedOnly, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [query, folder, kind, unusedOnly]);

  const totalVariantBytes = useMemo(
    () => items.reduce((sum, item) => sum + item.variants.reduce((s, v) => s + v.bytes, 0), 0),
    [items],
  );

  function openDetail(asset: MediaAsset) {
    setSelected(asset);
    setAltDraft(asset.alt ?? '');
    setBlockedBy(null);
  }

  async function copyUrl(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(asset.originalUrl);
      toast({ tone: 'success', title: 'URL copied' });
    } catch {
      toast({ tone: 'error', title: 'Could not copy to the clipboard' });
    }
  }

  async function saveAlt() {
    if (!selected) return;
    setBusyId(selected._id);
    try {
      const updated = await mediaApi.setAlt(selected._id, altDraft);
      setSelected(updated);
      toast({ tone: 'success', title: 'Alt text saved' });
      await load();
    } catch (error) {
      toast({ tone: 'error', title: 'Could not save', description: mediaErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function regenerate() {
    if (!selected) return;
    setBusyId(selected._id);
    try {
      const updated = await mediaApi.regenerate(selected._id);
      setSelected({ ...updated, usage: selected.usage });
      clearAssetCache();
      toast({
        tone: 'success',
        title: 'Variants rebuilt',
        description: `${updated.variants.length} file(s) generated.`,
      });
      await load();
    } catch (error) {
      toast({ tone: 'error', title: 'Rebuild failed', description: mediaErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(force = false) {
    if (!selected) return;
    setBusyId(selected._id);
    try {
      const result = await mediaApi.remove(selected._id, force);
      toast({
        tone: 'success',
        title: 'Media deleted',
        description: `${result.removedFiles} file(s) removed.`,
      });
      setSelected(null);
      setBlockedBy(null);
      await load();
    } catch (error) {
      const usage = isInUseConflict(error);
      if (usage) {
        // The file is referenced — show exactly where, then let the operator
        // decide whether to force it.
        setBlockedBy(usage);
        return;
      }
      toast({ tone: 'error', title: 'Delete failed', description: mediaErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/media" title="Media Library" />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl text-ink"
            >
              Media Library
            </h1>
            <p className="text-xs opacity-60">
              {total} asset{total === 1 ? '' : 's'} · {formatBytes(totalVariantBytes)} of responsive
              variants on this page
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, alt text or hash"
              className="w-full rounded-xl border px-3 py-2 text-xs sm:w-56 bg-surface-sunken border-line"
            />
            <Select
              value={folder}
              onChange={(value) => setFolder(value)}
              options={[{ value: '', label: 'All folders' }, ...folders.map((name) => ({ value: name, label: name }))]}
            />
            <Select
              value={kind}
              onChange={(value) => setKind(value as '' | 'image' | 'video')}
              options={[{ value: '', label: 'Images &amp; video' }, { value: 'image', label: 'Images' }, { value: 'video', label: 'Video' }]}
            />
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[11px] border-line"
            >
              <input
                type="checkbox"
                checked={unusedOnly}
                onChange={(event) => setUnusedOnly(event.target.checked)}
                className="accent-current"
              />
              Unused only
            </label>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-16 text-center text-xs opacity-60 bg-surface-raised border-line"
          >
            No media matches these filters.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((asset) => {
              const usageCount = asset.usage?.length ?? 0;
              return (
                <li key={asset._id}>
                  <button
                    type="button"
                    onClick={() => openDetail(asset)}
                    className="group w-full overflow-hidden rounded-2xl border text-left transition hover:border-gold/50 bg-surface-raised border-line"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                      {asset.kind === 'video' ? (
                        <span className="flex h-full w-full items-center justify-center text-2xl">
                          <Icon name="play" size={28} />
                        </span>
                      ) : (
                        <OptimizedImage
                          src={asset.originalUrl}
                          alt={asset.alt || asset.originalName || 'Media asset'}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {asset.kind === 'video' ? (
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Video
                        </span>
                      ) : null}
                      {usageCount === 0 ? (
                        <span className="absolute right-2 top-2 rounded-full bg-amber-500/85 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink">
                          Unused
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1 p-3">
                      <p className="truncate text-[11px] font-semibold" title={asset.originalName}>
                        {asset.originalName || asset.hash.slice(0, 12)}
                      </p>
                      <p className="text-[10px] opacity-55">
                        {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ''}
                        {formatBytes(asset.bytes)} · {asset.variants.length} variant
                        {asset.variants.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-[10px] opacity-55">
                        {usageCount === 0
                          ? 'Not referenced'
                          : `Used in ${usageCount} place${usageCount === 1 ? '' : 's'}`}
                        {asset.folder ? ` · ${asset.folder}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40 border-line"
            >
              Previous
            </button>
            <span className="opacity-60">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40 border-line"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-6 bg-surface-raised border-line text-ink-raised"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold">Asset detail</h2>
                <p className="text-xs opacity-60">{selected.originalName || selected.hash}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setBlockedBy(null);
                }}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div
                className="overflow-hidden rounded-xl border bg-black/20 border-line"
              >
                {selected.kind === 'video' ? (
                  <video
                    src={selected.originalUrl}
                    poster={selected.posterUrl}
                    className="max-h-72 w-full object-contain"
                    controls
                    muted
                    preload="metadata"
                  />
                ) : (
                  <OptimizedImage
                    src={selected.originalUrl}
                    alt={selected.alt || selected.originalName || ''}
                    sizes="(max-width: 640px) 90vw, 360px"
                    className="max-h-72 w-full object-contain"
                  />
                )}
              </div>

              <dl className="space-y-2 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Dimensions</dt>
                  <dd>
                    {selected.width && selected.height
                      ? `${selected.width} × ${selected.height}`
                      : 'unknown'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Original size</dt>
                  <dd>{formatBytes(selected.bytes)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Format</dt>
                  <dd className="uppercase">{selected.format ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Uploaded</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Variants</dt>
                  <dd>{selected.variants.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="opacity-55">Content hash</dt>
                  <dd className="font-mono">{selected.hash.slice(0, 16)}…</dd>
                </div>
              </dl>
            </div>

            <div className="mt-5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Alt text
              </label>
              <textarea
                value={altDraft}
                onChange={(event) => setAltDraft(event.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Describe the image for screen readers and search engines."
                className="mt-2 w-full rounded-xl border px-3 py-2 text-xs bg-surface-sunken border-line"
              />
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Used in {selected.usage?.length ?? 0} place
                {(selected.usage?.length ?? 0) === 1 ? '' : 's'}
              </p>
              {selected.usage && selected.usage.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px]">
                  {selected.usage.map((usage) => (
                    <li key={`${usage.entityType}-${usage.entityId}-${usage.field}`} className="opacity-75">
                      <span className="font-semibold">{usage.label}</span> · {usage.title}{' '}
                      <span className="opacity-60">({usage.field})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] opacity-55">
                  Nothing references this file — it is safe to remove.
                </p>
              )}
            </div>

            {blockedBy ? (
              <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px]">
                <p className="font-semibold">This file is still in use.</p>
                <ul className="mt-1 space-y-0.5 opacity-80">
                  {blockedBy.map((usage) => (
                    <li key={`${usage.entityType}-${usage.entityId}-${usage.field}`}>
                      {usage.label} · {usage.title} ({usage.field})
                    </li>
                  ))}
                </ul>
                <p className="mt-2 opacity-80">
                  Removing it will leave those records with a broken image.
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyUrl(selected)}
                  className="rounded-xl border px-3 py-2 text-[11px] border-line"
                >
                  Copy URL
                </button>
                <a
                  href={selected.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-3 py-2 text-[11px] border-line"
                >
                  Open original
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void regenerate()}
                      disabled={busyId === selected._id || selected.kind === 'video'}
                      className="rounded-xl border px-3 py-2 text-[11px] disabled:opacity-50 border-line"
                    >
                      Rebuild variants
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveAlt()}
                      disabled={busyId === selected._id}
                      className="rounded-xl bg-gold px-3 py-2 text-[11px] font-bold text-ink disabled:opacity-50"
                    >
                      {busyId === selected._id ? 'Saving…' : 'Save alt text'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(Boolean(blockedBy))}
                      disabled={busyId === selected._id}
                      className={cn(
                        'rounded-xl px-3 py-2 text-[11px] font-bold disabled:opacity-50',
                        blockedBy
                          ? 'bg-rose-600 text-white'
                          : 'border text-rose-400',
                      )}
                      style={blockedBy ? undefined : { borderColor: 'var(--admin-border)' }}
                    >
                      {blockedBy ? 'Delete anyway' : 'Delete'}
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] opacity-55">
                    You need media:write to edit or delete.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
