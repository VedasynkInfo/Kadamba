import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import type { BlogCategory, BlogPost } from '@/pages/blogs/data';
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

const categories: BlogCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Studio Notes'];
const SKELETON_ROWS = 7;

function blankPost(): BlogPost {
  return {
    id: uid('blog'),
    slug: '',
    title: '',
    excerpt: '',
    content: [''],
    category: 'Studio Notes',
    tags: [],
    coverImage: '',
    coverAlt: '',
    date: new Date().toISOString().slice(0, 10),
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
    featured: false,
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

export default function BlogsAdminPage() {
  const { blogs, upsertBlog, removeBlog, loading, settings } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BlogPost>(blankPost());
  const [isNew, setIsNew] = useState(true);
  const [bodyText, setBodyText] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs.filter((p) => {
      if (!q) return true;
      return [p.title, p.category, p.excerpt, p.slug].join(' ').toLowerCase().includes(q);
    });
  }, [blogs, query]);

  function syncSeo(next: BlogPost) {
    const pack = buildSeoPack(next.title, next.excerpt, next.coverImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, 'coverAlt');
  }

  function openCreate() {
    setIsNew(true);
    const next = blankPost();
    setForm(next);
    setBodyText('');
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setOpen(true);
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
    setOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => syncSeo({ ...f, title }));
  }

  function handleExcerptChange(excerpt: string) {
    setForm((f) => syncSeo({ ...f, excerpt }));
  }

  function handleCoverChange(url: string) {
    setForm((f) => syncSeo({ ...f, coverImage: url }));
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
      toast({ tone: 'error', title: 'Missing fields', description: 'Title and excerpt are required.' });
      return;
    }
    if (!form.coverImage.trim()) {
      toast({ tone: 'error', title: 'Cover image required', description: 'Upload a cover image.' });
      return;
    }
    const content = bodyText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    try {
      await upsertBlog({
        ...form,
        slug: form.slug.trim() || buildSeoPack(form.title, form.excerpt, form.coverImage, siteSeo).slug,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        coverAlt: form.coverAlt || form.title,
        content: content.length ? content : [form.excerpt.trim()],
        readMinutes: Number(form.readMinutes) || 4,
      });
      toast({ tone: 'success', title: isNew ? 'Post added' : 'Post updated' });
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
      await removeBlog(deleteTarget.id);
      toast({ tone: 'info', title: 'Post removed' });
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
        title={adminBanners.blogs.title}
        copy={adminBanners.blogs.copy}
        actionLabel={adminBanners.blogs.actionLabel}
        onAction={openCreate}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <Input
          label="Search journal"
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
              title="No journal posts yet"
              description="Draft studio notes on bridal prep, fabric choices, and fitting care."
              actionLabel={adminBanners.blogs.actionLabel}
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                    <th className="py-3 pr-4 font-medium">Post</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-black/8">
                      <td className="py-3 pr-4">
                        <p className="font-heading text-base">
                          {item.title}
                          {item.featured ? (
                            <span className="ml-2 text-[0.65rem] uppercase tracking-wider text-black/40">
                              Featured
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 max-w-md text-xs text-black/50 line-clamp-1">
                          {item.excerpt}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-black/60">{item.category}</td>
                      <td className="py-3 pr-4">
                        {item.published === false ? 'Draft' : 'Published'}
                      </td>
                      <td className="py-3 pr-4">{item.date}</td>
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
        title={isNew ? 'New post' : 'Edit post'}
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
            collection="blogs"
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
              setForm((f) => ({ ...f, category: e.target.value as BlogCategory }))
            }
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Textarea
            label="Excerpt"
            required
            rows={2}
            value={form.excerpt}
            onChange={(e) => handleExcerptChange(e.target.value)}
          />
          <Textarea
            label="Body (paragraphs separated by blank line)"
            rows={8}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
            <MediaUpload
              label="Cover image"
              required
              folder="blogs"
              value={form.coverImage}
              onChange={handleCoverChange}
              hint="Upload from your device"
            />
            <BannerSizeGuide context="cover" />
          </div>
          <Input
            label="Cover alt text"
            value={form.coverAlt}
            onChange={(e) => {
              setSeoAuto((a) => ({ ...a, imageAlt: false }));
              setForm((f) => ({ ...f, coverAlt: e.target.value }));
            }}
          />
          <TagsInput
            label="Tags"
            labels={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Input
            label="Read minutes"
            type="number"
            min={1}
            value={form.readMinutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, readMinutes: Number(e.target.value) || 1 }))
            }
          />
          <Select
            label="Featured"
            value={form.featured ? 'yes' : 'no'}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.value === 'yes' }))}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
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
        title="Delete post?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from the journal.`
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
