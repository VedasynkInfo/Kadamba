import { useMemo, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import {
  type ServiceCategory,
  type ServiceDetail,
  type ServiceIcon,
} from '@/pages/services/data';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { MediaUpload } from '../components/MediaUpload';
import { adminBanners } from '../data';
import { uid } from '../hooks/useLocalCollection';

const categories: ServiceCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Boutique'];
const icons: ServiceIcon[] = ['bridal', 'traditional', 'tailoring', 'boutique'];

function blankService(): ServiceDetail {
  return {
    id: uid('svc'),
    slug: '',
    title: '',
    category: 'Bridal',
    summary: '',
    description: [''],
    bannerImage: '',
    bannerAlt: '',
    cardImage: '',
    icon: 'bridal',
    gallery: [],
    features: [],
    pricing: {
      note: 'Quoted after consultation.',
      startingFrom: '',
      tiers: [],
    },
    includes: [],
    durationNote: '',
    ctaLabel: 'Request consultation',
  };
}

export default function ServicesAdminPage() {
  const { services, upsertService, removeService } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceDetail>(blankService());
  const [isNew, setIsNew] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (!q) return true;
      return [s.title, s.category, s.slug, s.summary].join(' ').toLowerCase().includes(q);
    });
  }, [services, query]);

  function openCreate() {
    setIsNew(true);
    setForm(blankService());
    setOpen(true);
  }

  function openEdit(item: ServiceDetail) {
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
      toast({ tone: 'error', title: 'Banner image required', description: 'Upload a banner image.' });
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
      await upsertService({
        ...form,
        slug,
        title: form.title.trim(),
        summary: form.summary.trim(),
        bannerAlt: form.bannerAlt || form.title,
        description: form.description.filter(Boolean).length
          ? form.description
          : [form.summary.trim()],
      });
      toast({ tone: 'success', title: isNew ? 'Service added' : 'Service updated' });
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
        title={adminBanners.services.title}
        copy={adminBanners.services.copy}
        actionLabel={adminBanners.services.actionLabel}
        onAction={openCreate}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <Input
          label="Search services"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                <th className="py-3 pr-4 font-medium">Service</th>
                <th className="py-3 pr-4 font-medium">Category</th>
                <th className="py-3 pr-4 font-medium">From</th>
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
                  <td className="py-3 pr-4">{item.pricing.startingFrom || '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void removeService(item.id)
                            .then(() => toast({ tone: 'info', title: 'Service removed' }))
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
        title={isNew ? 'Add service' : 'Edit service'}
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
              setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))
            }
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Icon"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value as ServiceIcon }))}
            options={icons.map((c) => ({ value: c, label: c }))}
          />
          <Textarea
            label="Summary"
            required
            rows={3}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <MediaUpload
            label="Banner image"
            required
            folder="services"
            value={form.bannerImage}
            onChange={(url) =>
              setForm((f) => ({
                ...f,
                bannerImage: url,
                cardImage: f.cardImage || url,
              }))
            }
            hint="Upload from your device — used for banner and card"
          />
          <MediaUpload
            label="Card image"
            folder="services"
            value={form.cardImage}
            onChange={(url) => setForm((f) => ({ ...f, cardImage: url }))}
            hint="Optional — defaults to banner if empty"
          />
          <Input
            label="Starting from"
            value={form.pricing.startingFrom}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                pricing: { ...f.pricing, startingFrom: e.target.value },
              }))
            }
          />
          <Input
            label="Duration note"
            value={form.durationNote}
            onChange={(e) => setForm((f) => ({ ...f, durationNote: e.target.value }))}
          />
          <Input
            label="CTA label"
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
          />
          <Button variant="primary" className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Drawer>
    </>
  );
}
