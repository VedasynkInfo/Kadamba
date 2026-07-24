import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import {
  type ServiceCategory,
  type ServiceDetail,
  type ServiceIcon,
} from '@/pages/services/data';
import { productApi, type ProductType } from '@/services/products/productService';
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

const categories: ServiceCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Boutique'];
const icons: ServiceIcon[] = ['bridal', 'traditional', 'tailoring', 'boutique'];
const SKELETON_ROWS = 7;

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
    published: true,
    isFulfillable: false,
    linkedProductTypeIds: [],
    defaultLeadTimeDays: undefined,
    basePriceFrom: undefined,
    tags: [],
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

export default function ServicesAdminPage() {
  const { services, upsertService, removeService, loading, settings } = useAdminContent();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceDetail>(blankService());
  const [isNew, setIsNew] = useState(true);
  const [slugAuto, setSlugAuto] = useState(true);
  const [seoAuto, setSeoAuto] = useState<SeoAutoFlags>(defaultSeoAutoFlags);
  const [deleteTarget, setDeleteTarget] = useState<ServiceDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  useEffect(() => {
    productApi
      .listProductTypes({ active: 'true', limit: 200 })
      .then((res) => setProductTypes(res.items))
      .catch(() => {
        /* silently ignore – admin might not have product types yet */
      });
  }, []);

  const siteSeo = useMemo(() => getSiteSeoDefaults(settings.seo), [settings.seo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (!q) return true;
      return [s.title, s.category, s.slug, s.summary].join(' ').toLowerCase().includes(q);
    });
  }, [services, query]);

  function syncSeo(next: ServiceDetail) {
    const pack = buildSeoPack(next.title, next.summary, next.bannerImage, siteSeo);
    return applySeoPack(next, pack, seoAuto, slugAuto, 'bannerAlt');
  }

  function openCreate() {
    setIsNew(true);
    setForm(blankService());
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setOpen(true);
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
        imageUrl: cloned.bannerImage,
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
    setForm((f) => syncSeo({ ...f, bannerImage: url, cardImage: f.cardImage || url }));
  }

  function regenerateSeo() {
    setSlugAuto(true);
    setSeoAuto(defaultSeoAutoFlags);
    setForm((f) => {
      const pack = buildSeoPack(f.title, f.summary, f.bannerImage, siteSeo);
      return applySeoPack(f, pack, defaultSeoAutoFlags, true, 'bannerAlt');
    });
  }

  function toggleProductType(ptId: string) {
    setForm((f) => {
      const existing = f.linkedProductTypeIds ?? [];
      const next = existing.includes(ptId)
        ? existing.filter((id) => id !== ptId)
        : [...existing, ptId];
      return { ...f, linkedProductTypeIds: next };
    });
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
    try {
      await upsertService({
        ...form,
        slug:
          form.slug.trim() || buildSeoPack(form.title, form.summary, form.bannerImage, siteSeo).slug,
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeService(deleteTarget.id);
      toast({ tone: 'info', title: 'Service removed' });
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
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <Skeleton key={i} variant="table" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="Shape bridal wear, traditional collections, and custom tailoring offers."
              actionLabel={adminBanners.services.actionLabel}
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                    <th className="py-3 pr-4 font-medium">Service</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">From</th>
                    <th className="py-3 pr-4 font-medium">Fulfillable</th>
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
                      <td className="py-3 pr-4">{item.pricing.startingFrom || '—'}</td>
                      <td className="py-3 pr-4">
                        {item.isFulfillable ? (
                          <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-800">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-black/30">No</span>
                        )}
                      </td>
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
        title={isNew ? 'Add service' : 'Edit service'}
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
            collection="services"
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
            onChange={(e) => handleSummaryChange(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
            <MediaUpload
              label="Banner image"
              required
              folder="services"
              value={form.bannerImage}
              onChange={handleBannerChange}
              hint="Upload from your device — used for banner and card"
            />
            <BannerSizeGuide context="hero" />
          </div>
          <MediaUpload
            label="Card image"
            folder="services"
            value={form.cardImage}
            onChange={(url) => setForm((f) => ({ ...f, cardImage: url }))}
            hint="Optional — defaults to banner if empty"
          />
          <Input
            label="Banner alt text"
            value={form.bannerAlt}
            onChange={(e) => {
              setSeoAuto((a) => ({ ...a, imageAlt: false }));
              setForm((f) => ({ ...f, bannerAlt: e.target.value }));
            }}
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

          <fieldset className="space-y-3 rounded-lg border border-black/10 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-black/50">
              Operations
            </legend>

            <Checkbox
              label="Published"
              checked={form.published ?? true}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  published: (e.target as HTMLInputElement).checked,
                }))
              }
            />
            <Checkbox
              label="Fulfillable (appears in order line-item picker)"
              checked={form.isFulfillable ?? false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isFulfillable: (e.target as HTMLInputElement).checked,
                }))
              }
            />
            <Input
              label="Default lead time (days)"
              type="number"
              value={form.defaultLeadTimeDays != null ? String(form.defaultLeadTimeDays) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  defaultLeadTimeDays: e.target.value ? parseInt(e.target.value, 10) : undefined,
                }))
              }
            />
            <Input
              label="Base price from (₹)"
              type="number"
              value={form.basePriceFrom != null ? String(form.basePriceFrom) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  basePriceFrom: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
            <TagsInput
              label="Tags"
              labels={form.tags ?? []}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />

            <div>
              <p className="mb-1.5 text-sm font-medium text-black/80">Linked product types</p>
              {productTypes.length === 0 ? (
                <p className="text-xs text-black/40 italic">
                  No product types found. Seed the product catalog first.
                </p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-black/8 bg-white/60 p-2">
                  {productTypes.map((pt) => (
                    <Checkbox
                      key={pt.id}
                      label={`${pt.name} (${pt.code})`}
                      checked={(form.linkedProductTypeIds ?? []).includes(pt.id)}
                      onChange={() => toggleProductType(pt.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </fieldset>

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
        title="Delete service?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from services.`
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
