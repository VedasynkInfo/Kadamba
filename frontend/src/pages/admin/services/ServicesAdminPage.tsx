import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import type { ServiceDetail } from '@/pages/services/data';
import { productApi, type ProductType } from '@/services/products/productService';
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
import { ServicesMetrics } from './ServicesMetrics';
import { ServicesModalForm } from './ServicesModalForm';
import { ServicesPreviewModal } from './ServicesPreviewModal';
import { ServicesTable } from './ServicesTable';
import { ServicesToolbar } from './ServicesToolbar';
import { createBlankService } from './types';

export default function ServicesAdminPage() {
  const { services, upsertService, removeService, loading, settings } = useAdminContent();
  const { toast } = useToast();

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedFulfillable, setSelectedFulfillable] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'titleAsc' | 'titleDesc' | 'category'>('titleAsc');

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState<ServiceDetail>(createBlankService());
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [previewItem, setPreviewItem] = useState<ServiceDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Catalog product types
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  useEffect(() => {
    productApi
      .listProductTypes({ active: 'true', limit: 200 })
      .then((res) => setProductTypes(res.items))
      .catch(() => {
        /* ignore if catalog is empty */
      });
  }, []);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => {
        if (q) {
          const match = [s.title, s.category, s.slug, s.summary].join(' ').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
        if (selectedStatus === 'Published' && !s.published) return false;
        if (selectedStatus === 'Draft' && s.published) return false;
        if (selectedFulfillable === 'Linked' && !s.isFulfillable) return false;
        if (selectedFulfillable === 'Bespoke' && s.isFulfillable) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'titleAsc') return a.title.localeCompare(b.title);
        if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [services, query, selectedCategory, selectedStatus, selectedFulfillable, sortBy]);

  const metrics = useMemo(() => {
    const total = services.length;
    const published = services.filter((s) => s.published).length;
    const drafts = total - published;
    const fulfillable = services.filter((s) => s.isFulfillable).length;
    return { total, published, drafts, fulfillable };
  }, [services]);

  const hasActiveFilters =
    query || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedFulfillable !== 'All';

  function resetFilters() {
    setQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedFulfillable('All');
    setSortBy('titleAsc');
  }

  function syncSeo(next: ServiceDetail) {
    const pack = buildSeoPack(next.title, next.summary, next.bannerImage || next.cardImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, ['bannerAlt']);
  }

  function openCreate() {
    setIsNew(true);
    setForm(createBlankService());
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setModalOpen(true);
  }

  function openEdit(item: ServiceDetail) {
    setIsNew(false);
    const cloned = structuredClone(item);
    setForm(cloned);
    const inferred = inferSeoAutoFlags(
      {
        slug: cloned.slug,
        title: cloned.title,
        summary: cloned.summary,
        imageUrl: cloned.bannerImage || cloned.cardImage,
        metaTitle: cloned.metaTitle,
        metaDescription: cloned.metaDescription,
        ogTitle: cloned.ogTitle,
        ogDescription: cloned.ogDescription,
        ogImage: cloned.ogImage,
        twitterTitle: cloned.twitterTitle,
        twitterDescription: cloned.twitterDescription,
        twitterImage: cloned.twitterImage,
        imageAlt: cloned.bannerAlt,
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
      const pack = buildSeoPack(f.title, f.summary, f.bannerImage || f.cardImage, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, ['bannerAlt']);
    });
  }

  async function save() {
    if (!form.title.trim() || !form.summary.trim()) {
      toast({ tone: 'error', title: 'Missing required fields', description: 'Title and summary are required.' });
      return;
    }
    setSaving(true);
    try {
      const fallbackPack = buildSeoPack(form.title, form.summary, form.bannerImage || form.cardImage, siteSeo);
      const toSave: ServiceDetail = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim() || fallbackPack.slug,
        summary: form.summary.trim(),
        metaTitle: form.metaTitle || fallbackPack.metaTitle,
        metaDescription: form.metaDescription || fallbackPack.metaDescription,
        ogTitle: form.ogTitle || fallbackPack.ogTitle,
        ogDescription: form.ogDescription || fallbackPack.ogDescription,
        ogImage: form.ogImage || fallbackPack.ogImage,
        twitterTitle: form.twitterTitle || fallbackPack.twitterTitle,
        twitterDescription: form.twitterDescription || fallbackPack.twitterDescription,
        twitterImage: form.twitterImage || fallbackPack.twitterImage,
      };
      await upsertService(toSave);
      toast({ tone: 'success', title: isNew ? 'Service created' : 'Service updated' });
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

  async function togglePublished(item: ServiceDetail) {
    try {
      await upsertService({ ...item, published: !item.published });
      toast({
        tone: 'success',
        title: !item.published ? 'Service published live' : 'Moved to drafts',
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
      await removeService(deleteTarget.id);
      toast({ tone: 'info', title: 'Service removed' });
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
    const url = `${window.location.origin}/services/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ tone: 'info', title: 'Public service link copied to clipboard' });
  }

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title="Atelier Services & Bespoke Couture"
        copy="Manage bridal couture consultations, luxury tailoring, bespoke embroidery, and production links."
        actionLabel="+ Add Service"
        onAction={openCreate}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        <ServicesMetrics metrics={metrics} />

        {/* Search, Filter & Action Toolbar */}
        <ServicesToolbar
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedFulfillable={selectedFulfillable}
          onFulfillableChange={setSelectedFulfillable}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={services.length}
          onAddService={openCreate}
        />

        {/* Modern Compact Table Card */}
        <ServicesTable
          items={filtered}
          loading={loading}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onResetFilters={resetFilters}
          onAddService={openCreate}
          onPreview={setPreviewItem}
          onEdit={openEdit}
          onTogglePublished={togglePublished}
          onCopyUrl={copyPublicUrl}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Rich Interactive Preview Modal */}
      <ServicesPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={openEdit}
        onTogglePublished={togglePublished}
        onCopyUrl={copyPublicUrl}
      />

      {/* Modern Add / Edit Modal (Replaces Drawer) */}
      <ServicesModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isNew={isNew}
        form={form}
        setForm={setForm}
        slugAuto={slugAuto}
        setSlugAuto={setSlugAuto}
        seoAuto={seoAuto}
        setSeoAuto={setSeoAuto}
        productTypes={productTypes}
        onTitleChange={handleTitleChange}
        onRegenerateSeo={regenerateSeo}
        onSave={save}
        saving={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete atelier service?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" and all its bespoke service associations will be removed.`
            : ''
        }
        confirmLabel="Delete Service"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
