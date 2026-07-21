import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import type { PortfolioCategory, PortfolioProject } from '@/pages/portfolio/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { MediaUpload } from '../components/MediaUpload';
import { adminBanners } from '../data';
import { uid } from '../hooks/useLocalCollection';

const categories: PortfolioCategory[] = [
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
];

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
  };
}

export default function PortfolioAdminPage() {
  const { portfolio, upsertProject, removeProject } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PortfolioProject>(blankProject());
  const [isNew, setIsNew] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return portfolio.filter((p) => {
      if (!q) return true;
      return [p.title, p.category, p.slug, p.summary].join(' ').toLowerCase().includes(q);
    });
  }, [portfolio, query]);

  function openCreate() {
    setIsNew(true);
    setForm(blankProject());
    setOpen(true);
  }

  function openEdit(item: PortfolioProject) {
    setIsNew(false);
    setForm(structuredClone(item));
    setOpen(true);
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
    const slug =
      form.slug.trim() ||
      form.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    try {
      await upsertProject({
        ...form,
        slug,
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
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                <th className="py-3 pr-4 font-medium">Project</th>
                <th className="py-3 pr-4 font-medium">Category</th>
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
                  <td className="py-3 pr-4">{item.year}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void removeProject(item.id)
                            .then(() => toast({ tone: 'info', title: 'Project removed' }))
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
        title={isNew ? 'Add project' : 'Edit project'}
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
              setForm((f) => ({ ...f, category: e.target.value as PortfolioCategory }))
            }
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Textarea
            label="Summary"
            required
            rows={3}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
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
          <MediaUpload
            label="Cover / banner image"
            required
            folder="portfolio"
            value={form.bannerImage}
            onChange={(url) =>
              setForm((f) => ({
                ...f,
                bannerImage: url,
                coverImage: url,
              }))
            }
            hint="Upload from your device"
          />
          <Input
            label="Tags (comma separated)"
            value={form.tags.join(', ')}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              }))
            }
          />
          <Button variant="primary" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Drawer>
    </>
  );
}
