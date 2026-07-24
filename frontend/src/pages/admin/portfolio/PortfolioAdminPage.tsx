import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import type { PortfolioCategory, PortfolioProject } from '@/pages/portfolio/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { Skeleton } from '../components/Skeleton';
import { SlugField } from '../components/SlugField';
import { TagsInput } from '../components/TagsInput';
import { adminBanners } from '../data';
import {
  applySeoPack,
  buildSeoPack,
  defaultSeoAutoFlags,
  getSiteSeoDefaults,
  inferSeoAutoFlags,
} from '../hooks/cmsSeoHelpers';
import { uid } from '../hooks/useLocalCollection';
import type { SeoAutoFlags } from '@/seo/generateSeo';

const categories: PortfolioCategory[] = [
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
];
const SKELETON_ROWS = 7;

function blankProject(): PortfolioProject {
  return {
    id: uid('pf'),
    slug: '',
    title: '',
    category: 'Bridal',
    summary: '',
    story: [''],
    year: String(new Date().getFullYear()),
    location: 'Kurnool',
    bannerImage: '',
    bannerAlt: '',
    coverImage: '',
    coverAlt: '',
    gallery: [],
    tags: [],
    ctaLabel: 'Request similar look',
    published: true,
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  };
}

export default function PortfolioAdminPage() {
  const { portfolio, upsertProject, removeProject, loading, settings } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PortfolioProject>(blankProject());
  const [isNew, setIsNew] = useState(true);
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return portfolio.filter((p) => {
      if (!q) return true;
      return [p.title, p.category, p.slug, p.summary].join(' ').toLowerCase().includes(q);
    });
  }, [portfolio, query]);

  function syncSeo(next: PortfolioProject) {
    const pack = buildSeoPack(next.title, next.summary, next.bannerImage || next.coverImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, ['bannerAlt', 'coverAlt']);
  }

  function openCreate() {
    setIsNew(true);
    setForm(blankProject());
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setOpen(true);
  }

  function openEdit(item: PortfolioProject) {
    setIsNew(false);
    const cloned = structuredClone(item);
    setForm(cloned);
    const inferred = inferSeoAutoFlags(
      {
        slug: cloned.slug,
        title: cloned.title,
        summary: cloned.summary,
        imageUrl: cloned.bannerImage || cloned.coverImage,
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
    setOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => syncSeo({ ...f, title }));
  }

  function handleSummaryChange(summary: string) {
    setForm((f) => syncSeo({ ...f, summary }));
  }

  function handleBannerChange(url: string) {
    setForm((f) => syncSeo({ ...f, bannerImage: url, coverImage: url }));
  }

  function regenerateSeo() {
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setForm((f) => {
      const pack = buildSeoPack(f.title, f.summary, f.bannerImage || f.coverImage, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, ['bannerAlt', 'coverAlt']);
    });
  }

  async function save() {
    if (!form.title.trim() || !form.summary.trim()) {
      toast({ tone: 'error', title: 'Missing fields', description: 'Title and summary are required.' });
      return;
    }
    if (!form.bannerImage.trim()) {
      toast({ tone: 'error', title: 'Image required', description: 'Upload a cover / banner image.' });
      return;
    }
    try {
      await upsertProject({
        ...form,
        slug:
          form.slug.trim() ||
          buildSeoPack(form.title, form.summary, form.bannerImage, siteSeo).slug,
        title: form.title.trim(),
        summary: form.summary.trim(),
        bannerAlt: form.bannerAlt || form.title,
        coverAlt: form.coverAlt || form.title,
        coverImage: form.coverImage || form.bannerImage,
        story: form.story.filter(Boolean).length ? form.story : [form.summary.trim()],
      });
      toast({ tone: 'success', title: isNew ? 'Project added' : 'Project updated' });
      setOpen(false);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Save failed',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeProject(deleteTarget.id);
      toast({ tone: 'info', title: 'Project removed' });
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

  return (
    <>
      <AdminHorizonBanner
        title={adminBanners.portfolio.title}
        copy={adminBanners.portfolio.copy}
        actionLabel={adminBanners.portfolio.actionLabel}
        onAction={openCreate}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <Input
          label="Search portfolio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <Skeleton key={i} variant="table" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No portfolio projects yet"
              description="Archive fittings, before/after stories, and client celebrations."
              actionLabel={adminBanners.portfolio.actionLabel}
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                    <th className="py-3 pr-4 font-medium">Project</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Year</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-black/8">
                      <td className="py-3 pr-4">
                        <p className="font-heading text-base">{item.title}</p>
                        <p className="mt-1 max-w-md text-xs text-black/50 line-clamp-1">
                          {item.summary}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-black/60">{item.category}</td>
                      <td className="py-3 pr-4">
                        {item.published === false ? 'Draft' : 'Published'}
                      </td>
                      <td className="py-3 pr-4">{item.year}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={isNew ? 'Add project' : 'Edit project'}
        className="!max-w-md !bg-cream !text-black [&_h2]:!text-black"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <SlugField
            collection="portfolio"
            value={form.slug}
            excludeId={isNew ? undefined : form.id}
            autoManaged={slugAuto}
            titleForAuto={form.title}
            onChange={(slug, opts) => {
              if (opts?.locked) setSlugAuto(false);
              setForm((f) => ({ ...f, slug }));
            }}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value as PortfolioCategory }))
            }
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Textarea
            label="Summary"
            required
            rows={3}
            value={form.summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
          />
          <Input
            label="Year"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
            <MediaUpload
              label="Cover / banner image"
              required
              folder="portfolio"
              value={form.bannerImage}
              onChange={handleBannerChange}
              hint="Upload from your device"
            />
            <BannerSizeGuide context="hero" />
          </div>
          <Input
            label="Banner alt text"
            value={form.bannerAlt}
            onChange={(e) => {
              setSeoAuto((a) => ({ ...a, imageAlt: false }));
              setForm((f) => ({ ...f, bannerAlt: e.target.value, coverAlt: e.target.value }));
            }}
          />
          <TagsInput
            label="Tags"
            labels={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          />
          <Select
            label="Published"
            value={form.published !== false ? 'yes' : 'no'}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'yes' }))}
            options={[
              { value: 'yes', label: 'Published' },
              { value: 'no', label: 'Draft' },
            ]}
          />
          <SeoFields
            value={{
              metaTitle: form.metaTitle ?? '',
              metaDescription: form.metaDescription ?? '',
              ogTitle: form.ogTitle,
              ogDescription: form.ogDescription,
              ogImage: form.ogImage,
              twitterTitle: form.twitterTitle,
              twitterDescription: form.twitterDescription,
              twitterImage: form.twitterImage,
            }}
            onChange={(next, lockedField) => {
              if (lockedField) setSeoAuto((a) => ({ ...a, [lockedField]: false }));
              setForm((f) => ({ ...f, ...next }));
            }}
            onRegenerate={regenerateSeo}
          />
          <Button variant="primary" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete project?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from the portfolio.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </>
  );
}
