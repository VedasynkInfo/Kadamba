import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, type ProductCategory, type ProductType } from '@/services/products/productService';
import { measurementApi, type MeasurementTemplate } from '@/services/measurements/measurementsService';
import { Button, Drawer, Input, Spinner } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

export default function ProductsAdminPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Category Drawer/Form state
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catSortOrder, setCatSortOrder] = useState('0');
  const [selectedEditCat, setSelectedEditCat] = useState<ProductCategory | null>(null);

  // Product Type Drawer/Form state
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [typeCode, setTypeCode] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeCategoryId, setTypeCategoryId] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [typePublicDesc, setTypePublicDesc] = useState('');
  const [typeTemplateCode, setTypeTemplateCode] = useState('');
  const [typePriceRange, setTypePriceRange] = useState('');
  const [typeActive, setTypeActive] = useState(true);
  const [typeSortOrder, setTypeSortOrder] = useState('0');
  const [selectedEditType, setSelectedEditType] = useState<ProductType | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await productApi.listCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to get categories', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await measurementApi.listTemplates({ active: true });
      setTemplates(data.items);
    } catch (err) {
      console.error('Failed to get measurement templates', err);
    }
  };

  const fetchProductTypes = async () => {
    setLoadingTypes(true);
    try {
      const data = await productApi.listProductTypes({
        categoryId: selectedCategoryId === 'All' ? undefined : selectedCategoryId,
        search: searchQuery || undefined,
        active: activeFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProductTypes(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to get product types', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      try {
        const cats = await productApi.listCategories();
        await fetchTemplates();
        if (cats.length === 0) {
          await productApi.seedCatalog();
          const reloadedCats = await productApi.listCategories();
          setCategories(reloadedCats);
        } else {
          setCategories(cats);
        }
      } catch (err) {
        console.error('Failed to initialize product catalog', err);
      } finally {
        setLoading(false);
      }
    };
    void initLoad();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !typeCategoryId) {
      setTypeCategoryId(categories[0].id || categories[0]._id || '');
    }
  }, [categories, typeCategoryId]);

  useEffect(() => {
    if (!loading) {
      void fetchProductTypes();
    }
  }, [selectedCategoryId, searchQuery, activeFilter, pagination.page, loading]);

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      const result = await productApi.seedCatalog();
      alert(`Seeded catalog! Categories created/linked: ${result.categoriesSeeded}, Garment types seeded: ${result.typesSeeded}`);
      await Promise.all([fetchCategories(), fetchTemplates()]);
      void fetchProductTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to seed product catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catCode.trim() || !catName.trim()) return;
    setSavingCategory(true);
    try {
      if (selectedEditCat) {
        await productApi.updateCategory(selectedEditCat.id || selectedEditCat._id!, {
          code: catCode,
          name: catName,
          sortOrder: parseInt(catSortOrder) || 0,
        });
      } else {
        await productApi.createCategory({
          code: catCode,
          name: catName,
          sortOrder: parseInt(catSortOrder) || 0,
        });
      }
      setCategoryDrawerOpen(false);
      resetCategoryForm();
      void fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const resetCategoryForm = () => {
    setCatCode('');
    setCatName('');
    setCatSortOrder('0');
    setSelectedEditCat(null);
  };

  const handleEditCategoryClick = (cat: ProductCategory) => {
    setSelectedEditCat(cat);
    setCatCode(cat.code);
    setCatName(cat.name);
    setCatSortOrder(String(cat.sortOrder));
    setCategoryDrawerOpen(true);
  };

  const resetTypeForm = () => {
    setTypeCode('');
    setTypeName('');
    setTypeCategoryId(categories[0]?.id || categories[0]?._id || '');
    setTypeDescription('');
    setTypePublicDesc('');
    setTypeTemplateCode('');
    setTypePriceRange('');
    setTypeActive(true);
    setTypeSortOrder('0');
    setSelectedEditType(null);
  };

  const handleCreateProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeCode.trim() || !typeName.trim() || !typeCategoryId) return;
    setSavingType(true);
    try {
      const payload = {
        code: typeCode,
        name: typeName,
        categoryId: typeCategoryId,
        description: typeDescription || undefined,
        publicDescription: typePublicDesc || undefined,
        measurementTemplateId: typeTemplateCode || undefined,
        indicativePriceRange: typePriceRange || undefined,
        active: typeActive,
        sortOrder: parseInt(typeSortOrder) || 0,
      };

      if (selectedEditType) {
        await productApi.updateProductType(selectedEditType.id || selectedEditType._id!, payload);
      } else {
        await productApi.createProductType(payload);
      }
      setTypeDrawerOpen(false);
      resetTypeForm();
      void fetchProductTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product garment type.');
    } finally {
      setSavingType(false);
    }
  };

  const handleEditTypeClick = (type: ProductType) => {
    setSelectedEditType(type);
    setTypeCode(type.code);
    setTypeName(type.name);
    setTypeCategoryId(type.categoryId?.id || type.categoryId?._id || '');
    setTypeDescription(type.description || '');
    setTypePublicDesc(type.publicDescription || '');
    setTypeTemplateCode(type.measurementTemplateId || '');
    setTypePriceRange(type.indicativePriceRange || '');
    setTypeActive(type.active);
    setTypeSortOrder(String(type.sortOrder));
    setTypeDrawerOpen(true);
  };

  const handleDeactivateType = async (type: ProductType) => {
    const nextActive = !type.active;
    const confirmMsg = nextActive
      ? `Are you sure you want to activate garment type ${type.code}?`
      : `Are you sure you want to deactivate garment type ${type.code}? Deactivated garments are hidden from new order pickers.`;

    if (!confirm(confirmMsg)) return;

    try {
      await productApi.updateProductType(type.id || type._id!, { active: nextActive });
      void fetchProductTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <Spinner size="lg" label="Retrieving boutique catalog..." />
      </div>
    );
  }

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.products.title}
        copy={adminBanners.products.copy}
        actionLabel={adminBanners.products.actionLabel}
        onAction={() => {
          resetTypeForm();
          setTypeDrawerOpen(true);
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border border-black/10 bg-white p-5 space-y-4 shadow-[var(--shadow-soft)]">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/55">Categories</span>
                <button
                  type="button"
                  onClick={() => {
                    resetCategoryForm();
                    setCategoryDrawerOpen(true);
                  }}
                  className="text-[10px] font-semibold text-black hover:underline uppercase"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded transition font-medium',
                    selectedCategoryId === 'All'
                      ? 'bg-black text-cream font-semibold'
                      : 'text-black/75 hover:bg-black/5',
                  )}
                  onClick={() => setSelectedCategoryId('All')}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <div key={cat.id || cat._id} className="group flex items-center justify-between rounded hover:bg-black/5 transition">
                    <button
                      type="button"
                      className={cn(
                        'flex-1 text-left px-3 py-2 text-xs font-medium transition',
                        selectedCategoryId === (cat.id || cat._id)
                          ? 'bg-black/10 text-black font-semibold rounded-l'
                          : 'text-black/75',
                      )}
                      onClick={() => setSelectedCategoryId(cat.id || cat._id!)}
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCategoryClick(cat)}
                      className="px-2.5 py-2 text-[10px] text-black/40 hover:text-black hidden group-hover:block font-semibold uppercase"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions / Seeding */}
            <div className="rounded-lg border border-black/10 bg-white p-5 space-y-3 text-xs shadow-[var(--shadow-soft)]">
              <span className="font-semibold text-black uppercase tracking-wider text-[10px] block border-b border-black/5 pb-2">
                Catalog Seeding
              </span>
              <p className="text-black/55 leading-relaxed">
                Seed the default Kurnool bridal and designer blouse catalog to automatically map template fit fields.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-center mt-2"
                disabled={seeding}
                onClick={handleSeedCatalog}
              >
                {seeding ? 'Seeding...' : '🚀 Seed catalog templates'}
              </Button>
            </div>
          </div>

          {/* Product Type Directory */}
          <div className="lg:col-span-3 min-w-0 space-y-6">
            
            {/* Filters bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
              <div className="flex flex-1 min-w-[200px] max-w-sm">
                <Input
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-cream/30 text-xs"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="rounded-md border border-black/15 bg-cream px-3 py-1.5 text-xs text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">All statuses...</option>
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loadingTypes ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <Spinner size="lg" label="Updating directory..." />
              </div>
            ) : productTypes.length === 0 ? (
              <div className="text-center py-12 border border-black/10 border-dashed rounded-lg bg-cream/10 p-6 text-xs">
                <h4 className="font-semibold text-black">No garment types found</h4>
                <p className="text-black/45 mt-1">
                  Ensure the catalog migration has been executed, or create a brand new custom product type.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    resetTypeForm();
                    setTypeDrawerOpen(true);
                  }}
                >
                  Add garment type
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border border-black/10 rounded-lg overflow-hidden bg-white shadow-[var(--shadow-soft)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/10 bg-black/5 text-[0.65rem] uppercase font-semibold text-black/50">
                          <th className="p-3.5">Code</th>
                          <th className="p-3.5">Garment Name</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Fit Template</th>
                          <th className="p-3.5">Indicative Price</th>
                          <th className="p-3.5">Active</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 bg-white/10">
                        {productTypes.map((type) => (
                          <tr key={type.id || type._id} className="hover:bg-black/[0.01]">
                            <td className="p-3.5 font-mono font-bold text-black">{type.code}</td>
                            <td className="p-3.5">
                              <span className="font-semibold text-black block">{type.name}</span>
                              {type.description && <span className="text-[10px] text-black/45 block mt-0.5 max-w-[200px] truncate">{type.description}</span>}
                            </td>
                            <td className="p-3.5 text-black/75">
                              {type.categoryId?.name || '—'}
                            </td>
                            <td className="p-3.5 font-mono text-[10px]">
                              {type.measurementTemplateId ? (
                                <Link to="/admin/measurements" className="text-black font-semibold hover:underline bg-black/5 px-1.5 py-0.5 rounded border border-black/10">
                                  📏 {type.measurementTemplateId}
                                </Link>
                              ) : (
                                <span className="text-black/35">Unmeasurable</span>
                              )}
                            </td>
                            <td className="p-3.5 text-black/60 font-medium">
                              {type.indicativePriceRange || '—'}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider',
                                  type.active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200',
                                )}
                              >
                                {type.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditTypeClick(type)}
                                className="font-semibold text-black hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeactivateType(type)}
                                className={cn(
                                  'font-semibold hover:underline',
                                  type.active ? 'text-rose-700 hover:text-rose-900' : 'text-emerald-700 hover:text-emerald-900',
                                )}
                              >
                                {type.active ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between border-t border-black/10 pt-4">
                    <span className="text-xs text-black/50">
                      Showing page {pagination.page} of {pagination.pages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Edit Drawer */}
      <Drawer
        open={categoryDrawerOpen}
        onClose={() => {
          setCategoryDrawerOpen(false);
          resetCategoryForm();
        }}
        title={selectedEditCat ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleCreateCategory} className="space-y-5 text-xs pb-10">
          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Category Code *</label>
            <Input
              type="text"
              placeholder="e.g. BRIDAL *"
              required
              disabled={!!selectedEditCat}
              value={catCode}
              onChange={(e) => setCatCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Category Name *</label>
            <Input
              type="text"
              placeholder="e.g. Bridal Collection *"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Sort Order</label>
            <Input
              type="number"
              placeholder="0"
              value={catSortOrder}
              onChange={(e) => setCatSortOrder(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-black/5">
            <Button
              type="button"
              variant="secondary"
              disabled={savingCategory}
              onClick={() => {
                setCategoryDrawerOpen(false);
                resetCategoryForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingCategory}>
              {savingCategory ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Product Type Edit/Create Drawer */}
      <Drawer
        open={typeDrawerOpen}
        onClose={() => {
          setTypeDrawerOpen(false);
          resetTypeForm();
        }}
        title={selectedEditType ? 'Edit Garment Type' : 'Create Garment Type'}
      >
        <form onSubmit={handleCreateProductType} className="space-y-5 text-xs pb-20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-cream/80 mb-1.5 font-semibold">Garment Code *</label>
              <Input
                type="text"
                placeholder="e.g. BR-LH *"
                required
                disabled={!!selectedEditType}
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-cream/80 mb-1.5 font-semibold">Sort Order</label>
              <Input
                type="number"
                placeholder="0"
                value={typeSortOrder}
                onChange={(e) => setTypeSortOrder(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Garment Name *</label>
            <Input
              type="text"
              placeholder="e.g. Bridal Lehenga *"
              required
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-cream/80 mb-1.5 font-semibold">Category *</label>
              <select
                value={typeCategoryId}
                onChange={(e) => setTypeCategoryId(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2.5 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="" disabled>Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-cream/80 mb-1.5 font-semibold">Measurement Template</label>
              <select
                value={typeTemplateCode}
                onChange={(e) => setTypeTemplateCode(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-cream px-3 py-2.5 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">Unmeasurable (No fitting card)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Indicative Price Range</label>
            <Input
              type="text"
              placeholder="e.g. ₹8,000–₹12,000"
              value={typePriceRange}
              onChange={(e) => setTypePriceRange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Internal Operations Description</label>
            <Input
              type="text"
              placeholder="e.g. includes fall/pico, heavy embroidery support"
              value={typeDescription}
              onChange={(e) => setTypeDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-cream/80 mb-1.5 font-semibold">Portal Public Description</label>
            <textarea
              placeholder="Detailed description showing on customer login portal..."
              value={typePublicDesc}
              onChange={(e) => setTypePublicDesc(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-black/15 bg-cream px-3 py-2 text-sm text-black focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="type-act"
              checked={typeActive}
              onChange={(e) => setTypeActive(e.target.checked)}
            />
            <label htmlFor="type-act" className="font-semibold text-black/75 cursor-pointer">
              Garment is Active (New orders can select this type)
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-black/10">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={savingType}
              onClick={() => {
                setTypeDrawerOpen(false);
                resetTypeForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={savingType}>
              {savingType ? 'Saving...' : 'Save Garment'}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
