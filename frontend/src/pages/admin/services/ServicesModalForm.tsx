import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Checkbox, Input, Select, Textarea } from '@/components/ui';
import type { ServiceCategory, ServiceDetail, ServiceIcon } from '@/pages/services/data';
import type { ProductType } from '@/services/products/productService';
import { BannerSizeGuide } from '../components/BannerSizeGuide';
import { MediaUpload } from '../components/MediaUpload';
import { SeoFields } from '../components/SeoFields';
import { SlugField } from '../components/SlugField';
import { TagsInput } from '../components/TagsInput';
import type { SeoAutoFlags } from '@/seo/generateSeo';
import { SERVICE_CATEGORIES, SERVICE_ICONS } from './types';
import { cn } from '@/utils/cn';

interface ServicesModalFormProps {
  open: boolean;
  onClose: () => void;
  isNew: boolean;
  form: ServiceDetail;
  setForm: React.Dispatch<React.SetStateAction<ServiceDetail>>;
  slugAuto: boolean;
  setSlugAuto: (auto: boolean) => void;
  seoAuto: SeoAutoFlags;
  setSeoAuto: React.Dispatch<React.SetStateAction<SeoAutoFlags>>;
  productTypes: ProductType[];
  onTitleChange: (title: string) => void;
  onRegenerateSeo: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ServicesModalForm({
  open,
  onClose,
  isNew,
  form,
  setForm,
  slugAuto,
  setSlugAuto,
  seoAuto: _seoAuto,
  setSeoAuto,
  productTypes,
  onTitleChange,
  onRegenerateSeo,
  onSave,
  saving,
}: ServicesModalFormProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'seo'>('info');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div>
            <h2 className="font-heading text-lg font-bold text-inherit">
              {isNew ? 'Create New Atelier Service' : 'Edit Service Details'}
            </h2>
            <p className="text-xs opacity-60 mt-0.5">
              {isNew ? 'Define signature bespoke couture and tailoring offerings' : 'Update pricing, features, catalog link, and SEO'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-6 pt-2 gap-4 text-xs font-semibold border-line"
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'info'
                ? 'border-brand text-brand'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            <Icon name="copy" size={14} className="mr-1 inline align-middle" /> Basic Info & Media
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'pricing'
                ? 'border-brand text-brand'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            <Icon name="premium" size={14} className="mr-1 inline align-middle" /> Offerings & Pricing
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={cn(
              'pb-2.5 transition border-b-2 cursor-pointer',
              activeTab === 'seo'
                ? 'border-brand text-brand'
                : 'border-transparent opacity-60 hover:opacity-100',
            )}
          >
            <Icon name="seo" size={14} className="mr-1 inline align-middle" /> SEO & Search Snippets
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'info' ? (
            <>
              <Input
                label="Service Title *"
                required
                placeholder="e.g. Bespoke Bridal Couture"
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category *"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))
                  }
                  options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />

                <Select
                  label="Icon Motif"
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value as ServiceIcon }))
                  }
                  options={SERVICE_ICONS.map((ic) => ({ value: ic, label: ic }))}
                />
              </div>

              <Textarea
                label="Executive Summary *"
                required
                rows={2}
                placeholder="Short luxury synopsis for cards and previews"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />

              <div className="grid gap-3 sm:grid-cols-[1fr,minmax(0,11rem)]">
                <MediaUpload
                  label="Banner Image"
                  folder="services"
                  enableCrop
                  cropAspect={12 / 5}
                  value={form.bannerImage || ''}
                  onChange={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
                  hint="Hero landscape display (1920×800)"
                />
                <BannerSizeGuide context="hero" />
              </div>

              <MediaUpload
                label="Card Image"
                folder="services"
                enableCrop
                cropAspect={4 / 5}
                value={form.cardImage || ''}
                onChange={(url) => setForm((f) => ({ ...f, cardImage: url }))}
                hint="Square/portrait display for grid cards (800×1000)"
              />
            </>
          ) : activeTab === 'pricing' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Starting Price (₹)"
                  placeholder="e.g. Starting from ₹15,000"
                  value={form.pricing?.startingFrom || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pricing: { ...f.pricing, startingFrom: e.target.value },
                    }))
                  }
                />

                <Input
                  label="Base Price Numeric (₹)"
                  type="number"
                  placeholder="15000"
                  value={form.basePriceFrom || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      basePriceFrom: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duration / Turnaround Note"
                  placeholder="e.g. 15–20 Working Days"
                  value={form.durationNote || ''}
                  onChange={(e) => setForm((f) => ({ ...f, durationNote: e.target.value }))}
                />

                <Input
                  label="CTA Button Label"
                  placeholder="Request Consultation"
                  value={form.ctaLabel || ''}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                />
              </div>

              <div className="space-y-2 rounded-xl p-3 border border-line">
                <Checkbox
                  id="svc-fulfillable"
                  label="Linked to Production / Product Catalog"
                  checked={Boolean(form.isFulfillable)}
                  onChange={(e) => setForm((f) => ({ ...f, isFulfillable: e.target.checked }))}
                />
                {form.isFulfillable && productTypes.length ? (
                  <div className="mt-2">
                    <label className="text-[11px] font-semibold opacity-75 block mb-1">
                      Link Applicable Product Types:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {productTypes.map((pt) => {
                        const isSelected = form.linkedProductTypeIds?.includes(pt.id);
                        return (
                          <button
                            key={pt.id}
                            type="button"
                            onClick={() => {
                              const curr = form.linkedProductTypeIds || [];
                              setForm((f) => ({
                                ...f,
                                linkedProductTypeIds: isSelected
                                  ? curr.filter((id) => id !== pt.id)
                                  : [...curr, pt.id],
                              }));
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-md border text-xs font-medium transition cursor-pointer',
                              isSelected
                                ? 'bg-brand text-ink-on-brand border-brand'
                                : 'opacity-70 hover:opacity-100 border-current/20',
                            )}
                          >
                            {isSelected ? <Icon name="check" size={12} /> : '+ '}
                            {pt.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <TagsInput
                label="Signature Features"
                labels={form.features?.map((f) => (typeof f === 'string' ? f : f.title)) || []}
                onChange={(features) =>
                  setForm((f) => ({
                    ...f,
                    features: features.map((t, idx) => ({ id: `feat-${idx}`, title: t, description: '' })),
                  }))
                }
                placeholder="Type feature and press Enter"
              />

              <TagsInput
                label="What's Included"
                labels={form.includes || []}
                onChange={(includes) => setForm((f) => ({ ...f, includes }))}
                placeholder="e.g. 2 Fittings, Fabric Swatches, Delivery"
              />
            </>
          ) : (
            <div className="space-y-4">
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
                onRegenerate={onRegenerateSeo}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <div className="text-xs opacity-50">
            {form.title ? `Service: "${form.title}"` : 'Fill required fields (*)'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={onSave}
              className="font-bold shadow-xs"
            >
              {saving ? 'Saving...' : isNew ? 'Publish Service' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
