import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import type { BlogPost } from '@/pages/blogs/data';
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
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { BlogsMetrics } from './BlogsMetrics';
import { BlogsModalForm } from './BlogsModalForm';
import { BlogsPreviewModal } from './BlogsPreviewModal';
import { BlogsTable } from './BlogsTable';
import { BlogsToolbar } from './BlogsToolbar';
import { createBlankBlog } from './types';

export default function BlogsAdminPage() {
  const { blogs, upsertBlog, removeBlog, loading, settings } = useAdminContent();
  const { toast } = useToast();

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedFeatured, setSelectedFeatured] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'titleAsc' | 'titleDesc'>('dateDesc');

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState<BlogPost>(createBlankBlog());
  const [bodyText, setBodyText] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [previewItem, setPreviewItem] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs
      .filter((p) => {
        if (q) {
          const match = [p.title, p.category, p.excerpt, p.slug].join(' ').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
        if (selectedStatus === 'Published' && !p.published) return false;
        if (selectedStatus === 'Draft' && p.published) return false;
        if (selectedFeatured === 'Featured' && !p.featured) return false;
        if (selectedFeatured === 'Standard' && p.featured) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'titleAsc') return a.title.localeCompare(b.title);
        if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
        if (sortBy === 'dateDesc') return (b.date || '').localeCompare(a.date || '');
        return 0;
      });
  }, [blogs, query, selectedCategory, selectedStatus, selectedFeatured, sortBy]);

  const metrics = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.published).length;
    const drafts = total - published;
    const featured = blogs.filter((b) => b.featured).length;
    return { total, published, drafts, featured };
  }, [blogs]);

  const hasActiveFilters =
    query || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedFeatured !== 'All';

  function resetFilters() {
    setQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedFeatured('All');
    setSortBy('dateDesc');
  }

  function syncSeo(next: BlogPost) {
    const pack = buildSeoPack(next.title, next.excerpt, next.coverImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, 'coverAlt');
  }

  function openCreate() {
    setIsNew(true);
    setForm(createBlankBlog());
    setBodyText('');
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setModalOpen(true);
  }

  function openEdit(item: BlogPost) {
    setIsNew(false);
    const cloned = structuredClone(item);
    setForm(cloned);
    setBodyText(item.content.join('\n\n'));
    const inferred = inferSeoAutoFlags(
      {
        slug: cloned.slug,
        title: cloned.title,
        summary: cloned.excerpt,
        imageUrl: cloned.coverImage,
        metaTitle: cloned.metaTitle,
        metaDescription: cloned.metaDescription,
        ogTitle: cloned.ogTitle,
        ogDescription: cloned.ogDescription,
        ogImage: cloned.ogImage,
        twitterTitle: cloned.twitterTitle,
        twitterDescription: cloned.twitterDescription,
        twitterImage: cloned.twitterImage,
        imageAlt: cloned.coverAlt,
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

  function regenerateSeo() {
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setForm((f) => {
      const pack = buildSeoPack(f.title, f.excerpt, f.coverImage, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, 'coverAlt');
    });
  }

  async function save() {
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast({ tone: 'error', title: 'Missing required fields', description: 'Title and excerpt are required.' });
      return;
    }
    setSaving(true);
    try {
      const paragraphs = bodyText
        .split('\n\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const fallbackPack = buildSeoPack(form.title, form.excerpt, form.coverImage, siteSeo);
      const toSave: BlogPost = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim() || fallbackPack.slug,
        excerpt: form.excerpt.trim(),
        content: paragraphs.length ? paragraphs : [form.excerpt.trim()],
        metaTitle: form.metaTitle || fallbackPack.metaTitle,
        metaDescription: form.metaDescription || fallbackPack.metaDescription,
        ogTitle: form.ogTitle || fallbackPack.ogTitle,
        ogDescription: form.ogDescription || fallbackPack.ogDescription,
        ogImage: form.ogImage || fallbackPack.ogImage,
        twitterTitle: form.twitterTitle || fallbackPack.twitterTitle,
        twitterDescription: form.twitterDescription || fallbackPack.twitterDescription,
        twitterImage: form.twitterImage || fallbackPack.twitterImage,
      };

      await upsertBlog(toSave);
      toast({ tone: 'success', title: isNew ? 'Article published to journal' : 'Article updated' });
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

  async function togglePublished(item: BlogPost) {
    try {
      await upsertBlog({ ...item, published: !item.published });
      toast({
        tone: 'success',
        title: !item.published ? 'Article published live' : 'Moved to drafts',
      });
      if (previewItem?.id === item.id) {
        setPreviewItem({ ...previewItem, published: !item.published });
      }
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Status change failed',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeBlog(deleteTarget.id);
      toast({ tone: 'info', title: 'Article removed from journal' });
      if (previewItem?.id === deleteTarget.id) setPreviewItem(null);
      setDeleteTarget(null);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  function copyPublicUrl(slug: string) {
    const url = `${window.location.origin}/blogs/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ tone: 'info', title: 'Public article link copied to clipboard' });
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Editorial Journal & Studio Notes"
        copy="Publish bridal styling tutorials, artisan couture craftsmanship articles, and studio news."
        actionLabel="+ Add Article"
        onAction={openCreate}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <BlogsMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <BlogsToolbar
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedFeatured={selectedFeatured}
          onFeaturedChange={setSelectedFeatured}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={blogs.length}
          onAddBlog={openCreate}
        />

        {/* Modern Compact Table Card */}
        <BlogsTable
          items={filtered}
          loading={loading}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          onAddBlog={openCreate}
          onPreview={setPreviewItem}
          onEdit={openEdit}
          onTogglePublished={togglePublished}
          onCopyUrl={copyPublicUrl}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Rich Interactive Preview Modal */}
      <BlogsPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={openEdit}
        onTogglePublished={togglePublished}
        onCopyUrl={copyPublicUrl}
      />

      {/* Modern Add / Edit Modal (Replaces Drawer) */}
      <BlogsModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isNew={isNew}
        form={form}
        setForm={setForm}
        slugAuto={slugAuto}
        setSlugAuto={setSlugAuto}
        seoAuto={seoAuto}
        setSeoAuto={setSeoAuto}
        bodyText={bodyText}
        setBodyText={setBodyText}
        onTitleChange={handleTitleChange}
        onRegenerateSeo={regenerateSeo}
        onSave={save}
        saving={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete editorial article?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from the public journal.`
            : ''
        }
        confirmLabel="Delete Article"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
