import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, useToast } from '@/components/ui';
import type { GalleryCategory, GalleryItem, GalleryMediaType } from '@/pages/gallery/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { MediaUpload } from '../components/MediaUpload';
import { adminBanners } from '../data';
import { uid } from '../hooks/useLocalCollection';

const categories: GalleryCategory[] = [
  'Bridal',
  'Traditional',
  'Festive',
  'Tailoring',
  'Details',
];

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
});

export default function GalleryAdminPage() {
  const { gallery, upsertGallery, removeGallery } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gallery
      .filter((item) => {
        if (!q) return true;
        return [item.title, item.category, item.slug, item.alt].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [gallery, query]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm(), sortOrder: gallery.length + 1 });
    setDrawerOpen(true);
  }

  function openEdit(item: GalleryItem) {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm(rest);
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.src.trim()) {
      toast({ tone: 'error', title: 'Missing fields', description: 'Title and media file are required.' });
      return;
    }
    const slug =
      form.slug.trim() ||
      form.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    try {
      await upsertGallery({
        id: editingId ?? uid('g'),
        ...form,
        slug,
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
          <p className="pb-2 text-sm text-black/45">{filtered.length} items</p>
        </div>

        <div className="mt-8 overflow-x-auto">
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
                          onClick={() => {
                            void removeGallery(item.id)
                              .then(() => toast({ tone: 'info', title: 'Removed from gallery' }))
                              .catch((err) =>
                                toast({
                                  tone: 'error',
                                  title: 'Remove failed',
                                  description: err instanceof Error ? err.message : undefined,
                                }),
                              );
                          }}
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
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            hint="Leave blank to auto-generate"
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
          <MediaUpload
            label="Media file"
            required
            folder="gallery"
            allowVideo
            accept="image/jpeg,image/png,image/webp,image/gif"
            value={form.src}
            onChange={(url) =>
              setForm((f) => ({
                ...f,
                src: url,
                mediaType:
                  url && /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : f.mediaType,
              }))
            }
            hint="Upload an image or video from your device"
          />
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
            onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
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
          <Button variant="primary" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Drawer>
    </>
  );
}
