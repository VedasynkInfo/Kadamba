import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, useToast } from '@/components/ui';
import type { GalleryCategory, GalleryItem, GalleryMediaType } from '@/pages/gallery/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { Skeleton } from '../components/Skeleton';
import { SlugField } from '../components/SlugField';
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

const categories: GalleryCategory[] = [
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
];
const SKELETON_ROWS = 7;

const emptyForm = (): Omit<GalleryItem, 'id'> => ({
  slug: '',
  title: '',
  category: 'Bridal',
  alt: '',
  mediaType: 'image',
  src: '',
  width: 1200,
  height: 1500,
  published: true,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
});

export default function GalleryAdminPage() {
  const { gallery, upsertGallery, removeGallery, loading, settings } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gallery
      .filter((item) => {
        if (!q) return true;
        return [item.title, item.category, item.slug, item.alt].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [gallery, query]);

  function syncSeo(next: Omit<GalleryItem, 'id'>) {
    const pack = buildSeoPack(next.title, next.title, next.src, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, 'alt');
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm(), sortOrder: gallery.length + 1 });
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setDrawerOpen(true);
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
    setDrawerOpen(true);
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
      toast({ tone: 'error', title: 'Missing fields', description: 'Title and media file are required.' });
      return;
    }
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
        title: editingId ? 'Media updated' : 'Media added',
      });
      setDrawerOpen(false);
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
      await removeGallery(deleteTarget.id);
      toast({ tone: 'info', title: 'Removed from gallery' });
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
        title={adminBanners.gallery.title}
        copy={adminBanners.gallery.copy}
        actionLabel={adminBanners.gallery.actionLabel}
        onAction={openCreate}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Search gallery"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, category…"
            className="max-w-sm"
          />
          {!loading ? (
            <p className="pb-2 text-sm text-black/45">{filtered.length} items</p>
          ) : null}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <Skeleton key={i} variant="table" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No gallery items yet"
              description="Publish bridal, traditional, and atelier frames for the lookbook."
              actionLabel={adminBanners.gallery.actionLabel}
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                    <th className="py-3 pr-4 font-medium">Preview</th>
                    <th className="py-3 pr-4 font-medium">Title</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-black/8">
                      <td className="py-3 pr-4">
                        <img
                          src={item.mediaType === 'video' ? item.poster || item.src : item.src}
                          alt=""
                          className="h-14 w-12 object-cover"
                        />
                      </td>
                      <td className="py-3 pr-4 font-heading text-base text-black">{item.title}</td>
                      <td className="py-3 pr-4 text-black/60">{item.category}</td>
                      <td className="py-3 pr-4">
                        {item.published ? 'Published' : 'Draft'}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
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
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Edit media' : 'Add media'}
        className="!max-w-md !bg-cream !text-black"
      >
        <div className="space-y-4 [&_h2]:!text-black">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <SlugField
            collection="gallery"
            value={form.slug}
            excludeId={editingId ?? undefined}
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
              setForm((f) => ({ ...f, category: e.target.value as GalleryCategory }))
            }
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Media type"
            value={form.mediaType}
            onChange={(e) =>
              setForm((f) => ({ ...f, mediaType: e.target.value as GalleryMediaType }))
            }
            options={[
              { value: 'image', label: 'Image' },
              { value: 'video', label: 'Video' },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
            <MediaUpload
              label="Media file"
              required
              folder="gallery"
              allowVideo
              accept="image/jpeg,image/png,image/webp,image/gif"
              value={form.src}
              onChange={handleSrcChange}
              hint="Upload an image or video from your device"
            />
            <BannerSizeGuide context="gallery" />
          </div>
          {form.mediaType === 'video' ? (
            <MediaUpload
              label="Poster image"
              folder="gallery"
              value={form.poster || ''}
              onChange={(url) => setForm((f) => ({ ...f, poster: url }))}
              hint="Thumbnail shown before video plays"
            />
          ) : null}
          <Input
            label="Alt text"
            value={form.alt}
            onChange={(e) => {
              setSeoAuto((a) => ({ ...a, imageAlt: false }));
              setForm((f) => ({ ...f, alt: e.target.value }));
            }}
          />
          <Select
            label="Published"
            value={form.published ? 'yes' : 'no'}
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
    </>
  );
}
