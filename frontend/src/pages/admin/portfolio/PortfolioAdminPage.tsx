import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import type { PortfolioProject } from '@/pages/portfolio/data';
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
import { PortfolioMetrics } from './PortfolioMetrics';
import { PortfolioModalForm } from './PortfolioModalForm';
import { PortfolioPreviewModal } from './PortfolioPreviewModal';
import { PortfolioTable } from './PortfolioTable';
import { PortfolioToolbar } from './PortfolioToolbar';
import { createBlankPortfolio } from './types';

export default function PortfolioAdminPage() {
  const { portfolio, upsertProject, removeProject, loading, settings } = useAdminContent();
  const { toast } = useToast();

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'titleAsc' | 'titleDesc' | 'yearDesc'>('yearDesc');

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState<PortfolioProject>(createBlankPortfolio());
  const [storyText, setStoryText] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [previewItem, setPreviewItem] = useState<PortfolioProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return portfolio
      .filter((p) => {
        if (q) {
          const match = [p.title, p.category, p.slug, p.summary].join(' ').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
        if (selectedStatus === 'Published' && !p.published) return false;
        if (selectedStatus === 'Draft' && p.published) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'titleAsc') return a.title.localeCompare(b.title);
        if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
        if (sortBy === 'yearDesc') return (b.year || '').localeCompare(a.year || '');
        return 0;
      });
  }, [portfolio, query, selectedCategory, selectedStatus, sortBy]);

  const metrics = useMemo(() => {
    const total = portfolio.length;
    const published = portfolio.filter((p) => p.published).length;
    const drafts = total - published;
    const clientStories = portfolio.filter((p) => p.category === 'Client Stories').length;
    return { total, published, drafts, clientStories };
  }, [portfolio]);

  const hasActiveFilters = query || selectedCategory !== 'All' || selectedStatus !== 'All';

  function resetFilters() {
    setQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSortBy('yearDesc');
  }

  function syncSeo(next: PortfolioProject) {
    const pack = buildSeoPack(next.title, next.summary, next.coverImage || next.bannerImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, ['coverAlt', 'bannerAlt']);
  }

  function openCreate() {
    setIsNew(true);
    setForm(createBlankPortfolio());
    setStoryText('');
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setModalOpen(true);
  }

  function openEdit(item: PortfolioProject) {
    setIsNew(false);
    const cloned = structuredClone(item);
    setForm(cloned);
    setStoryText((cloned.story || []).join('\n\n'));
    const inferred = inferSeoAutoFlags(
      {
        slug: cloned.slug,
        title: cloned.title,
        summary: cloned.summary,
        imageUrl: cloned.coverImage || cloned.bannerImage,
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
      const pack = buildSeoPack(f.title, f.summary, f.coverImage || f.bannerImage, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, ['coverAlt', 'bannerAlt']);
    });
  }

  async function save() {
    if (!form.title.trim() || !form.summary.trim() || !form.coverImage.trim()) {
      toast({ tone: 'error', title: 'Missing required fields', description: 'Title, summary, and cover image are required.' });
      return;
    }
    setSaving(true);
    try {
      const storyParagraphs = storyText
        .split('\n\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const fallbackPack = buildSeoPack(form.title, form.summary, form.coverImage || form.bannerImage, siteSeo);
      const toSave: PortfolioProject = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim() || fallbackPack.slug,
        summary: form.summary.trim(),
        story: storyParagraphs.length ? storyParagraphs : [form.summary.trim()],
        coverAlt: form.coverAlt?.trim() || form.title.trim(),
        bannerAlt: form.bannerAlt?.trim() || form.title.trim(),
        metaTitle: form.metaTitle || fallbackPack.metaTitle,
        metaDescription: form.metaDescription || fallbackPack.metaDescription,
        ogTitle: form.ogTitle || fallbackPack.ogTitle,
        ogDescription: form.ogDescription || fallbackPack.ogDescription,
        ogImage: form.ogImage || fallbackPack.ogImage,
        twitterTitle: form.twitterTitle || fallbackPack.twitterTitle,
        twitterDescription: form.twitterDescription || fallbackPack.twitterDescription,
        twitterImage: form.twitterImage || fallbackPack.twitterImage,
      };

      await upsertProject(toSave);
      toast({ tone: 'success', title: isNew ? 'Project exhibit created' : 'Project updated' });
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

  async function togglePublished(item: PortfolioProject) {
    try {
      await upsertProject({ ...item, published: !item.published });
      toast({
        tone: 'success',
        title: !item.published ? 'Project published live' : 'Moved to drafts',
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
      await removeProject(deleteTarget.id);
      toast({ tone: 'info', title: 'Project removed from portfolio' });
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
    const url = `${window.location.origin}/portfolio/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ tone: 'info', title: 'Public project link copied to clipboard' });
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Atelier Lookbook & Portfolio"
        copy="Curate couture bridal exhibits, client transformations, and bespoke artisan creations."
        actionLabel="+ Add Project"
        onAction={openCreate}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <PortfolioMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <PortfolioToolbar
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={portfolio.length}
          onAddProject={openCreate}
        />

        {/* Modern Compact Table Card */}
        <PortfolioTable
          items={filtered}
          loading={loading}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          onAddProject={openCreate}
          onPreview={setPreviewItem}
          onEdit={openEdit}
          onTogglePublished={togglePublished}
          onCopyUrl={copyPublicUrl}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Rich Interactive Preview Modal */}
      <PortfolioPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={openEdit}
        onTogglePublished={togglePublished}
        onCopyUrl={copyPublicUrl}
      />

      {/* Modern Add / Edit Modal (Replaces Drawer) */}
      <PortfolioModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isNew={isNew}
        form={form}
        setForm={setForm}
        slugAuto={slugAuto}
        setSlugAuto={setSlugAuto}
        seoAuto={seoAuto}
        setSeoAuto={setSeoAuto}
        storyText={storyText}
        setStoryText={setStoryText}
        onTitleChange={handleTitleChange}
        onRegenerateSeo={regenerateSeo}
        onSave={save}
        saving={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete portfolio exhibit?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from the public atelier portfolio.`
            : ''
        }
        confirmLabel="Delete Project"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
