import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import type { BlogCategory, BlogPost } from '@/pages/blogs/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { MediaUpload } from '../components/MediaUpload';
import { adminBanners } from '../data';
import { uid } from '../hooks/useLocalCollection';

const categories: BlogCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Studio Notes'];

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
  };
}

export default function BlogsAdminPage() {
  const { blogs, upsertBlog, removeBlog } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BlogPost>(blankPost());
  const [isNew, setIsNew] = useState(true);
  const [bodyText, setBodyText] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs.filter((p) => {
      if (!q) return true;
      return [p.title, p.category, p.excerpt, p.slug].join(' ').toLowerCase().includes(q);
    });
  }, [blogs, query]);

  function openCreate() {
    setIsNew(true);
    const next = blankPost();
    setForm(next);
    setBodyText('');
    setOpen(true);
  }

  function openEdit(item: BlogPost) {
    setIsNew(false);
    setForm(structuredClone(item));
    setBodyText(item.content.join('\n\n'));
    setOpen(true);
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
    const slug =
      form.slug.trim() ||
      form.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const content = bodyText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    try {
      await upsertBlog({
        ...form,
        slug,
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
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                <th className="py-3 pr-4 font-medium">Post</th>
                <th className="py-3 pr-4 font-medium">Category</th>
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
                  <td className="py-3 pr-4">{item.date}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void removeBlog(item.id)
                            .then(() => toast({ tone: 'info', title: 'Post removed' }))
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
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
          <Textarea
            label="Body (paragraphs separated by blank line)"
            rows={8}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
          <MediaUpload
            label="Cover image"
            required
            folder="blogs"
            value={form.coverImage}
            onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
            hint="Upload from your device"
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
          <Button variant="primary" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Drawer>
    </>
  );
}
