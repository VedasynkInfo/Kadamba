import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import type { GalleryItem } from '@/pages/gallery/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  applySeoPack,
  buildSeoPack,
  defaultSeoAutoFlags,
  getSiteSeoDefaults,
  inferSeoAutoFlags,
} from '../hooks/cmsSeoHelpers';
import { uid } from '../hooks/useLocalCollection';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { GalleryMetrics } from './GalleryMetrics';
import { GalleryModalForm } from './GalleryModalForm';
import { GalleryPreviewModal } from './GalleryPreviewModal';
import { GalleryTable } from './GalleryTable';
import { GalleryToolbar } from './GalleryToolbar';
import { createEmptyGalleryForm, type GalleryFormData } from './types';

export default function GalleryAdminPage() {
  const { gallery, upsertGallery, removeGallery, loading, settings } = useAdminContent();
  const { toast } = useToast();

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'titleAsc' | 'titleDesc'>('sortOrder');

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState<GalleryFormData>(createEmptyGalleryForm());
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gallery
      .filter((item) => {
        if (q) {
          const match = [item.title, item.category, item.slug, item.alt].join(' ').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        if (selectedStatus === 'Published' && !item.published) return false;
        if (selectedStatus === 'Draft' && item.published) return false;
        if (selectedMediaType !== 'All' && item.mediaType !== selectedMediaType) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sortOrder') return a.sortOrder - b.sortOrder;
        if (sortBy === 'titleAsc') return a.title.localeCompare(a.title);
        if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
        return 0;
      });
  }, [gallery, query, selectedCategory, selectedStatus, selectedMediaType, sortBy]);

  const metrics = useMemo(() => {
    const total = gallery.length;
    const published = gallery.filter((g) => g.published).length;
    const drafts = total - published;
    const videos = gallery.filter((g) => g.mediaType === 'video').length;
    return { total, published, drafts, videos };
  }, [gallery]);

  const hasActiveFilters =
    query || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedMediaType !== 'All';

  function resetFilters() {
    setQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedMediaType('All');
    setSortBy('sortOrder');
  }

  function syncSeo(next: GalleryFormData) {
    const pack = buildSeoPack(next.title, next.title, next.src, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, 'alt');
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...createEmptyGalleryForm(), sortOrder: gallery.length + 1 });
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setModalOpen(true);
  }

  function openEdit(item: GalleryItem) {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm(rest);
    const inferred = inferSeoAutoFlags(
      {
        slug: rest.slug,
        title: rest.title,
        summary: rest.title,
        imageUrl: rest.src,
        metaTitle: rest.metaTitle,
        metaDescription: rest.metaDescription,
        ogTitle: rest.ogTitle,
        ogDescription: rest.ogDescription,
        ogImage: rest.ogImage,
        twitterTitle: rest.twitterTitle,
        twitterDescription: rest.twitterDescription,
        twitterImage: rest.twitterImage,
        imageAlt: rest.alt,
      },
      siteSeo,
    );
    setSlugAuto(inferred.slugAuto);
    setSeoAuto(inferred.seoAuto);
    setModalOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => syncSeo({ ...f, title }));
  }

  function handleSrcChange(url: string) {
    setForm((f) =>
      syncSeo({
        ...f,
        src: url,
        mediaType: url && /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : f.mediaType,
      }),
    );
  }

  function regenerateSeo() {
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setForm((f) => {
      const pack = buildSeoPack(f.title, f.title, f.src, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, 'alt');
    });
  }

  async function save() {
    if (!form.title.trim() || !form.src.trim()) {
      toast({ tone: 'error', title: 'Missing required fields', description: 'Title and media file are required.' });
      return;
    }
    setSaving(true);
    try {
      await upsertGallery({
        id: editingId ?? uid('g'),
        ...form,
        slug: form.slug.trim() || buildSeoPack(form.title, form.title, form.src, siteSeo).slug,
        title: form.title.trim(),
        alt: form.alt.trim() || form.title.trim(),
        src: form.src.trim(),
      });
      toast({
        tone: 'success',
        title: editingId ? 'Media updated' : 'Media published to gallery',
      });
      setModalOpen(false);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Save failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: GalleryItem) {
    try {
      await upsertGallery({
        ...item,
        published: !item.published,
      });
      toast({
        tone: 'success',
        title: !item.published ? 'Published to gallery' : 'Moved to drafts',
        description: `"${item.title}" is now ${!item.published ? 'visible on public site' : 'hidden from public view'}.`,
      });
      if (previewItem && previewItem.id === item.id) {
        setPreviewItem({ ...previewItem, published: !item.published });
      }
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Status update failed',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeGallery(deleteTarget.id);
      toast({ tone: 'info', title: 'Removed from gallery' });
      if (previewItem?.id === deleteTarget.id) {
        setPreviewItem(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Remove failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  function copyMediaUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast({ tone: 'info', title: 'Media URL copied to clipboard' });
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Atelier Lookbook & Gallery"
        copy="Curate couture bridal collections, artisanal hand embroidery, and luxury studio exhibits."
        actionLabel="+ Add Media"
        onAction={openCreate}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <GalleryMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <GalleryToolbar
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedMediaType={selectedMediaType}
          onMediaTypeChange={setSelectedMediaType}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={gallery.length}
          onAddMedia={openCreate}
        />

        {/* Modern Compact Table Card */}
        <GalleryTable
          items={filtered}
          loading={loading}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          onAddMedia={openCreate}
          onPreview={setPreviewItem}
          onEdit={openEdit}
          onTogglePublished={togglePublished}
          onCopyUrl={copyMediaUrl}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Rich Interactive Preview Modal */}
      <GalleryPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={openEdit}
        onTogglePublished={togglePublished}
        onCopyUrl={copyMediaUrl}
      />

      {/* Modern Add / Edit Modal (Replaces Drawer) */}
      <GalleryModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        form={form}
        setForm={setForm}
        slugAuto={slugAuto}
        setSlugAuto={setSlugAuto}
        seoAuto={seoAuto}
        setSeoAuto={setSeoAuto}
        onTitleChange={handleTitleChange}
        onSrcChange={handleSrcChange}
        onRegenerateSeo={regenerateSeo}
        onSave={save}
        saving={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete gallery item?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from the lookbook.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
