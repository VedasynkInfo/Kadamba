import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { Alert, Button, Checkbox, Input, Select, Textarea } from '@/components/ui';
import { TabStrip } from '@/components/ui/TabStrip';
import type { MeasurementTemplate } from '@/services/measurements/measurementsService';
import type { ProductPayload, ProductType, ProductUsage } from '@/services/products/productService';
import type { SeoFieldsValue } from '../components/SeoFields';
import { SeoFields } from '../components/SeoFields';
import { TagsInput } from '../components/TagsInput';
import type { ProductCategory } from '@/services/products/productService';
import { cn } from '@/utils/cn';
import { GalleryEditor } from './GalleryEditor';
import { TemplatePreview } from './TemplatePreview';
import {
  blankProduct,
  formToPayload,
  productToForm,
  templateChanged,
  type ProductEditorTab,
  type ProductFormState,
  validateProductForm,
} from './types';
import { VariantsEditor } from './VariantsEditor';

interface ProductEditorProps {
  product: ProductType | null;
  isNew: boolean;
  categories: ProductCategory[];
  templates: MeasurementTemplate[];
  usage: ProductUsage | null;
  usageLoading: boolean;
  saving: boolean;
  defaultCategoryId?: string;
  defaultSortOrder?: number;
  onSave: (
    payload: ProductPayload,
    meta: { templateChanged: boolean; usage: ProductUsage | null },
  ) => void;
  onCancel: () => void;
}

const TABS = [
  { id: 'story', label: 'Story & fit', icon: 'note' as const },
  { id: 'gallery', label: 'Gallery', icon: 'images' as const },
  { id: 'variants', label: 'Variants', icon: 'thread' as const },
  { id: 'seo', label: 'SEO', icon: 'seo' as const },
];

export function ProductEditor({
  product,
  isNew,
  categories,
  templates,
  usage,
  usageLoading,
  saving,
  defaultCategoryId,
  defaultSortOrder,
  onSave,
  onCancel,
}: ProductEditorProps) {
  const [form, setForm] = useState<ProductFormState>(() =>
    product ? productToForm(product) : blankProduct(defaultCategoryId, defaultSortOrder),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<ProductEditorTab>('story');

  const templateOptions = [
    { value: '', label: 'No fit card (not recommended)' },
    ...templates.map((template) => ({
      value: template.id,
      label: `${template.code} - ${template.name}${template.active ? '' : ' (inactive)'}`,
    })),
  ];
  if (
    product?.measurementTemplate &&
    product.measurementTemplateId &&
    !templates.some((template) => template.id === product.measurementTemplateId)
  ) {
    templateOptions.push({
      value: product.measurementTemplateId ?? '',
      label: `${product.measurementTemplate.code} - ${product.measurementTemplate.name}`,
    });
  }

  const previewTemplate = form.measurementTemplateId
    ? (templates.find((template) => template.id === form.measurementTemplateId) ??
      (product?.measurementTemplateId === form.measurementTemplateId
        ? (product.measurementTemplate as MeasurementTemplate | undefined)
        : undefined) ??
      null)
    : null;
  const changedTemplate = templateChanged(form, product);

  function patch<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function submit() {
    const nextErrors = validateProductForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setTab('story');
      return;
    }
    onSave(formToPayload(form), { templateChanged: changedTemplate, usage });
  }

  return (
    <form
      className="overflow-hidden rounded-xl border border-line bg-surface-raised text-ink"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">
            {isNew ? 'New product' : 'Product detail'}
          </p>
          <h2 className="mt-0.5 font-heading text-xl font-bold">
            {isNew ? 'Add a garment' : form.name || 'Untitled product'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && product?.slug ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/products/${product.slug}`, '_blank', 'noopener')}
            >
              <Icon name="external" size={14} />
              View live
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="admin" size="sm" loading={saving}>
            <Icon name="save" size={14} />
            {isNew ? 'Create product' : 'Save changes'}
          </Button>
        </div>
      </div>

      <TabStrip
        items={TABS}
        value={tab}
        onChange={(value) => setTab(value as ProductEditorTab)}
        layoutId={`product-editor-tabs-${product?.id ?? 'new'}`}
        className="px-2"
      />

      <div className="space-y-5 p-4">
        {tab === 'story' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Workshop code"
                value={form.code}
                onChange={(event) => patch('code', event.target.value.toUpperCase())}
                placeholder="BR-LH"
                required
                disabled={!isNew}
                error={errors.code}
                hint={
                  isNew
                    ? 'The join key for orders and fit cards. Use uppercase letters, numbers and dashes.'
                    : 'Codes are the order join key and cannot be changed here.'
                }
              />
              <Input
                label="Public name"
                value={form.name}
                onChange={(event) => patch('name', event.target.value)}
                placeholder="Bridal Lehenga Set"
                required
                error={errors.name}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(value) => patch('categoryId', value)}
                options={categories.map((category) => ({
                  value: category.id,
                  label: `${category.name} (${category.code})`,
                }))}
                placeholder="Choose a category"
                error={errors.categoryId}
                required
              />
              <Input
                label="Public slug"
                value={form.slug}
                onChange={(event) => patch('slug', event.target.value)}
                placeholder="auto-generated from the public name"
                hint="Leave blank to generate once; existing published URLs stay stable."
              />
            </div>

            <Textarea
              label="Public description"
              rows={4}
              value={form.publicDescription}
              onChange={(event) => patch('publicDescription', event.target.value)}
              placeholder="The story a customer reads on the product page."
              hint="This is the storefront copy. Keep workshop-only notes in the internal field."
            />

            <Textarea
              label="Internal description"
              rows={2}
              value={form.description}
              onChange={(event) => patch('description', event.target.value)}
              placeholder="Cutting notes, fabric expectations, production constraints."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Indicative price range"
                value={form.indicativePriceRange}
                onChange={(event) => patch('indicativePriceRange', event.target.value)}
                placeholder="Rs 18,000 - Rs 45,000"
              />
              <Input
                label="Lead time (days)"
                type="number"
                min={0}
                max={365}
                value={form.leadTimeDays}
                onChange={(event) => patch('leadTimeDays', event.target.value)}
                placeholder="45"
                error={errors.leadTimeDays}
              />
            </div>

            <Input
              label="Lead time note"
              value={form.leadTimeNote}
              onChange={(event) => patch('leadTimeNote', event.target.value)}
              placeholder="45-60 days during wedding season"
            />

            <div>
              <TagsInput
                label="Tags"
                labels={form.tags}
                onChange={(tags) => patch('tags', tags)}
                placeholder="Add a tag, then press Enter"
              />
              <p className="mt-1 text-xs opacity-65">
                Tags power search and future featured collections. Use short, consistent nouns.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 rounded-lg border border-line p-3">
              <Checkbox
                label="Active on the website"
                name="product-active"
                checked={form.active}
                onChange={(event) => patch('active', event.target.checked)}
              />
              <Checkbox
                label="Feature in collections"
                name="product-featured"
                checked={form.featured}
                onChange={(event) => patch('featured', event.target.checked)}
              />
            </div>

            <div className="rounded-lg border border-line p-3">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Measurement template</p>
                  <p className="text-xs opacity-65">
                    A real link to the fit card used by new orders.
                  </p>
                </div>
                <Link
                  to="/admin/measurements"
                  className="text-xs font-semibold underline decoration-gold/60 underline-offset-2 hover:text-brand-strong"
                >
                  Manage fit cards
                </Link>
              </div>
              <Select
                value={form.measurementTemplateId}
                onChange={(value) => patch('measurementTemplateId', value)}
                options={templateOptions}
              />
              <TemplatePreview template={previewTemplate} className="mt-3" />
              {changedTemplate && (usage?.orderCount ?? 0) > 0 ? (
                <Alert tone="warning" title="This fit card is already in use" className="mt-3">
                  {usage?.orderCount} order{usage?.orderCount === 1 ? '' : 's'} use this product.
                  Unlinking or changing the template will not rewrite those existing orders; it only
                  changes the fit card offered for new ones.
                </Alert>
              ) : null}
            </div>

            {!isNew ? (
              <div className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Usage</p>
                  {usageLoading ? (
                    <span className="text-xs opacity-60">Checking orders and services...</span>
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-sunken/60 p-2">
                    <p className="font-heading text-xl font-bold">{usage?.orderCount ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wide opacity-65">Orders using</p>
                  </div>
                  <div className="rounded-lg bg-surface-sunken/60 p-2">
                    <p className="font-heading text-xl font-bold">{usage?.openOrderCount ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wide opacity-65">Open orders</p>
                  </div>
                  <div className="rounded-lg bg-surface-sunken/60 p-2">
                    <p className="font-heading text-xl font-bold">{usage?.serviceCount ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wide opacity-65">Services</p>
                  </div>
                </div>
                {usage && usage.services.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">
                      Linked from services
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {usage.services.map((service) => (
                        <li key={service.id}>
                          <Link
                            to="/admin/services"
                            className={cn(
                              'inline-flex rounded-full border border-line px-2 py-0.5 text-[11px] hover:border-gold/60',
                              !service.published && 'opacity-60',
                            )}
                          >
                            {service.title}
                            {!service.published ? ' (draft)' : ''}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs opacity-65">
                    No service currently links to this product. Link it from the service editor to
                    make the relationship explicit on both desks.
                  </p>
                )}
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'gallery' ? (
          <GalleryEditor
            images={form.gallery}
            cover={form.image}
            onChange={(gallery, cover) => {
              setForm((current) => ({ ...current, gallery, image: cover ?? current.image }));
            }}
          />
        ) : null}

        {tab === 'variants' ? (
          <VariantsEditor
            variants={form.variants}
            onChange={(variants) => patch('variants', variants)}
          />
        ) : null}

        {tab === 'seo' ? (
          <SeoFields value={form.seo} onChange={(next: SeoFieldsValue) => patch('seo', next)} />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-sunken/30 p-4">
        <p className="text-xs opacity-60">
          {form.active ? 'Visible on the storefront when saved.' : 'Saved as a draft.'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="admin" size="sm" loading={saving}>
            <Icon name="save" size={14} />
            {isNew ? 'Create product' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
