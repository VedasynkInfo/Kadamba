import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Alert, Button, Input, Select, Spinner, useToast } from '@/components/ui';
import {
  measurementApi,
  type MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import {
  productApi,
  type ProductCategory,
  type ProductImportResult,
  type ProductImportRow,
  type ProductPayload,
  type ProductType,
  type ProductUsage,
} from '@/services/products/productService';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { queryClient } from '@/lib/queryClient';
import { CategoryManagerModal } from './CategoryManagerModal';
import { ProductEditor } from './ProductEditor';
import { ProductImportModal } from './ProductImportModal';
import { ProductMasterList } from './ProductMasterList';
import { downloadProductCsv } from './productCsv';

const PAGE_SIZE = 100;
type StatusFilter = 'all' | 'active' | 'draft' | 'featured';

function messageFor(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

/** The storefront shares one query cache; a save must be visible without a deploy. */
function invalidatePublicProducts() {
  void queryClient.invalidateQueries({ queryKey: ['public-content', 'products'] });
}

export default function ProductsAdminPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createKey, setCreateKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [usage, setUsage] = useState<ProductUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageVersion, setUsageVersion] = useState(0);
  const [pendingSave, setPendingSave] = useState<{
    payload: ProductPayload;
    isNew: boolean;
  } | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);

  const loadProducts = useCallback(async (): Promise<ProductType[]> => {
    const first = await productApi.listProductTypes({ page: 1, limit: PAGE_SIZE });
    const items = [...first.items];
    const pages = first.pagination?.pages ?? 1;
    for (let page = 2; page <= pages; page += 1) {
      const next = await productApi.listProductTypes({ page, limit: PAGE_SIZE });
      items.push(...next.items);
    }
    return items;
  }, []);

  const refreshCategories = useCallback(async () => {
    const next = await productApi.listCategories();
    setCategories(next);
    return next;
  }, []);

  const refreshTemplates = useCallback(async () => {
    const result = await measurementApi.listTemplates({ limit: 100 });
    setTemplates(result.items);
    return result.items;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextCategories, nextTemplates, nextProducts] = await Promise.all([
        productApi.listCategories(),
        measurementApi.listTemplates({ limit: 100 }),
        loadProducts(),
      ]);
      setCategories(nextCategories);
      setTemplates(nextTemplates.items);
      setProductTypes(nextProducts);
      setSelectedId((current) => {
        if (current && nextProducts.some((product) => product.id === current)) return current;
        return nextProducts[0]?.id ?? null;
      });
    } catch (error) {
      setLoadError(messageFor(error, 'The product catalogue could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setSelectedKeys([]);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    if (!selectedId || creating) {
      setUsage(null);
      return;
    }
    let active = true;
    setUsageLoading(true);
    productApi
      .getProductUsage(selectedId)
      .then((next) => {
        if (active) setUsage(next);
      })
      .catch(() => {
        if (active) setUsage(null);
      })
      .finally(() => {
        if (active) setUsageLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, creating, usageVersion]);

  const selectedProduct = useMemo(
    () => productTypes.find((product) => product.id === selectedId) ?? null,
    [productTypes, selectedId],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return productTypes.filter((product) => {
      if (categoryFilter !== 'All' && product.categoryId?.id !== categoryFilter) return false;
      if (statusFilter === 'active' && !product.active) return false;
      if (statusFilter === 'draft' && product.active) return false;
      if (statusFilter === 'featured' && !product.featured) return false;
      if (!needle) return true;
      return [
        product.name,
        product.code,
        product.slug,
        product.categoryId?.name,
        product.measurementTemplate?.code,
        ...(product.tags ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [productTypes, categoryFilter, statusFilter, search]);

  const canReorder =
    categoryFilter === 'All' &&
    statusFilter === 'all' &&
    search.trim() === '' &&
    !loading &&
    productTypes.length <= 500;

  const metrics = useMemo(
    () => ({
      total: productTypes.length,
      active: productTypes.filter((product) => product.active).length,
      featured: productTypes.filter((product) => product.featured).length,
      drafts: productTypes.filter((product) => !product.active).length,
      fits: productTypes.filter((product) => Boolean(product.measurementTemplateId)).length,
    }),
    [productTypes],
  );

  async function persist(payload: ProductPayload, isNew: boolean) {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = isNew
        ? await productApi.createProductType(payload)
        : await productApi.updateProductType(selectedId ?? '', payload);
      setProductTypes((current) => {
        const exists = current.some((product) => product.id === saved.id);
        const next = exists
          ? current.map((product) => (product.id === saved.id ? saved : product))
          : [saved, ...current];
        return next.sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
        );
      });
      setSelectedId(saved.id);
      setCreating(false);
      setSelectedKeys([]);
      setUsageVersion((version) => version + 1);
      invalidatePublicProducts();
      toast({
        title: isNew ? 'Product created' : 'Product saved',
        description: saved.active
          ? `${saved.name} is live on the storefront.`
          : `${saved.name} is saved as a draft.`,
        tone: 'success',
      });
    } catch (error) {
      setSaveError(messageFor(error, 'The product could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  function handleSave(
    payload: ProductPayload,
    meta: { templateChanged: boolean; usage: ProductUsage | null },
  ) {
    const isNew = creating || !selectedProduct;
    if (!isNew && meta.templateChanged && (meta.usage?.orderCount ?? 0) > 0) {
      setPendingSave({ payload, isNew });
      return;
    }
    void persist(payload, isNew);
  }

  async function handleReorder(orderedIds: string[]) {
    const order = new Map(orderedIds.map((id, index) => [id, index]));
    const previous = productTypes;
    const next = [...productTypes].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    setProductTypes(next);
    try {
      await productApi.reorderProductTypes(orderedIds);
      invalidatePublicProducts();
      toast({ title: 'Product order saved', tone: 'success' });
    } catch (error) {
      setProductTypes(previous);
      toast({
        title: 'Could not save the new order',
        description: messageFor(error, 'Try again after refreshing.'),
        tone: 'error',
      });
    }
  }

  async function handleBulk(updates: {
    active?: boolean;
    featured?: boolean;
    categoryId?: string;
  }) {
    if (selectedKeys.length === 0) return;
    setBulkSaving(true);
    try {
      const result = await productApi.bulkUpdateProductTypes(selectedKeys, updates);
      const refreshed = await loadProducts();
      setProductTypes(refreshed);
      setSelectedKeys([]);
      invalidatePublicProducts();
      toast({
        title: `${result.updated} product${result.updated === 1 ? '' : 's'} updated`,
        tone: 'success',
      });
    } catch (error) {
      toast({
        title: 'Bulk update failed',
        description: messageFor(error, 'No products were changed.'),
        tone: 'error',
      });
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await productApi.seedCatalog();
      await Promise.all([refreshCategories(), refreshTemplates()]);
      await loadAll();
      invalidatePublicProducts();
      toast({
        title: 'Starter catalogue seeded',
        description: `${result.categoriesSeeded} categories and ${result.typesSeeded} new product types.`,
        tone: 'success',
      });
    } catch (error) {
      toast({
        title: 'Could not seed the catalogue',
        description: messageFor(error, 'Try again after refreshing.'),
        tone: 'error',
      });
    } finally {
      setSeeding(false);
    }
  }

  async function handleImport(rows: ProductImportRow[]): Promise<ProductImportResult> {
    const result = await productApi.importProductTypes(rows);
    const refreshed = await loadProducts();
    setProductTypes(refreshed);
    invalidatePublicProducts();
    return result;
  }

  async function handleCategorySave(
    id: string | null,
    payload: { code: string; name: string; sortOrder: number; active: boolean },
  ) {
    setCategorySaving(true);
    try {
      if (id) await productApi.updateCategory(id, payload);
      else await productApi.createCategory(payload);
      await refreshCategories();
      const refreshed = await loadProducts();
      setProductTypes(refreshed);
      invalidatePublicProducts();
      toast({ title: id ? 'Category updated' : 'Category created', tone: 'success' });
    } catch (error) {
      throw new Error(messageFor(error, 'Check the code and try again.'));
    } finally {
      setCategorySaving(false);
    }
  }

  function startCreate() {
    setCreating(true);
    setCreateKey((key) => key + 1);
    setSelectedId(null);
    setSelectedKeys([]);
    setSaveError(null);
  }

  function cancelEdit() {
    setCreating(false);
    setSaveError(null);
    setSelectedId((current) => current ?? productTypes[0]?.id ?? null);
  }

  return (
    <div className="mx-auto max-w-[92rem] space-y-5 px-4 py-6 sm:px-6 md:px-8">
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.products.title}
        copy={adminBanners.products.copy}
        actionLabel={adminBanners.products.actionLabel}
        onAction={startCreate}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: 'Products', value: metrics.total, icon: 'products' as const },
          { label: 'Live', value: metrics.active, icon: 'publish' as const },
          { label: 'Drafts', value: metrics.drafts, icon: 'file' as const },
          { label: 'Featured', value: metrics.featured, icon: 'featured' as const },
          { label: 'Fit cards linked', value: metrics.fits, icon: 'measurements' as const },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-line bg-surface-raised p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">
              <Icon name={metric.icon} size={12} />
              {metric.label}
            </div>
            <p className="mt-1 font-heading text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {loadError ? (
        <Alert tone="error" title="Catalogue unavailable">
          {loadError}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void loadAll()}>
            Retry
          </button>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface-raised p-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            aria-label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, code, tag, or fit card..."
          />
        </div>
        <Select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          options={[
            { value: 'All', label: 'All categories' },
            ...categories.map((category) => ({ value: category.id, label: category.name })),
          ]}
          className="w-48"
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Live only' },
            { value: 'draft', label: 'Drafts only' },
            { value: 'featured', label: 'Featured only' },
          ]}
          className="w-40"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            downloadProductCsv(filtered);
            toast({
              title: `Exported ${filtered.length} product${filtered.length === 1 ? '' : 's'}`,
              tone: 'info',
            });
          }}
          disabled={filtered.length === 0}
        >
          <Icon name="download" size={14} />
          Export CSV
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
          <Icon name="upload" size={14} />
          Import
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setCategoriesOpen(true)}>
          <Icon name="tags" size={14} />
          Categories
        </Button>
        <Button type="button" variant="admin" size="sm" onClick={startCreate}>
          <Icon name="add" size={14} />
          New product
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-line bg-surface-raised p-16">
          <Spinner label="Loading products" />
          <span className="text-sm opacity-70">Loading the catalogue...</span>
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.5fr)]">
          <div className="min-w-0 space-y-3">
            <ProductMasterList
              products={filtered}
              categories={categories}
              selectedId={selectedId}
              selectedKeys={selectedKeys}
              canReorder={canReorder}
              onSelect={(id) => {
                setSelectedId(id);
                setCreating(false);
                setSaveError(null);
              }}
              onSelectionChange={setSelectedKeys}
              onReorder={(ids) => void handleReorder(ids)}
              onBulk={(updates) => void handleBulk(updates)}
            />

            {bulkSaving ? (
              <p className="flex items-center gap-2 text-xs opacity-65">
                <Spinner size="sm" label="Saving bulk changes" />
                Saving bulk changes...
              </p>
            ) : null}

            {productTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-raised p-5 text-center">
                <Icon name="database" size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">The catalogue is empty</p>
                <p className="mt-1 text-xs opacity-65">
                  Seed the studio&apos;s starting garments, categories and fit-card links, or create
                  the first product manually.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  loading={seeding}
                  onClick={() => void handleSeed()}
                >
                  <Icon name="database" size={14} />
                  Seed starter catalogue
                </Button>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-3">
            {saveError ? (
              <Alert tone="error" title="Product not saved" onDismiss={() => setSaveError(null)}>
                {saveError}
              </Alert>
            ) : null}

            {creating || selectedProduct ? (
              <ProductEditor
                key={creating ? `new-${createKey}` : selectedProduct?.id}
                product={creating ? null : selectedProduct}
                isNew={creating}
                categories={categories}
                templates={templates}
                usage={usage}
                usageLoading={usageLoading}
                saving={saving}
                defaultCategoryId={categoryFilter !== 'All' ? categoryFilter : categories[0]?.id}
                defaultSortOrder={
                  productTypes.reduce((max, product) => Math.max(max, product.sortOrder ?? 0), -1) +
                  1
                }
                onSave={handleSave}
                onCancel={cancelEdit}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-raised p-12 text-center">
                <Icon name="products" size={28} className="mx-auto mb-3 opacity-40" />
                <p className="font-heading text-lg font-bold">Select a product</p>
                <p className="mx-auto mt-1 max-w-sm text-sm opacity-65">
                  Choose a garment from the master list to edit its story, gallery, fit card, and
                  storefront SEO.
                </p>
                <Button
                  type="button"
                  variant="admin"
                  size="sm"
                  className="mt-4"
                  onClick={startCreate}
                >
                  <Icon name="add" size={14} />
                  Add a product
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        onImported={() => {
          void refreshCategories();
        }}
      />

      <CategoryManagerModal
        open={categoriesOpen}
        categories={categories}
        saving={categorySaving}
        onClose={() => setCategoriesOpen(false)}
        onSave={handleCategorySave}
      />

      {pendingSave ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlink-template-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-surface-raised p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-amber-100 p-2 text-amber-700">
                <Icon name="warning" size={18} />
              </span>
              <div>
                <h2 id="unlink-template-title" className="font-heading text-lg font-bold">
                  Change a fit card that is already in use?
                </h2>
                <p className="mt-1 text-sm opacity-75">
                  {usage?.orderCount ?? 0} order
                  {(usage?.orderCount ?? 0) === 1 ? '' : 's'} use this product. Existing orders keep
                  their original fit card; only new orders will use the new template.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingSave(null)}
              >
                Keep current template
              </Button>
              <Button
                type="button"
                variant="admin"
                size="sm"
                loading={saving}
                onClick={() => {
                  const next = pendingSave;
                  setPendingSave(null);
                  void persist(next.payload, next.isNew);
                }}
              >
                Change and save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
