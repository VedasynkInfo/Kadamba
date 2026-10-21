import mongoose from 'mongoose';
import { ProductCategory, IProductCategory } from '../models/ProductCategory';
import {
  ProductType,
  IProductType,
  IProductGalleryImage,
  IProductVariant,
  IProductSeo,
} from '../models/ProductType';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { Service } from '../models/Service';
import { Order } from '../models/Order';
import { seedData, seedTemplates } from './measurementTemplateService';
import { ApiError } from '../utils/ApiError';
import { searchRegex } from '../utils/query';
import { slugify, uniqueSlug } from '../utils/slugify';
import { toDto } from '../utils/serialize';
import { CACHE_KEYS, CACHE_TTL, cacheKey, cached } from './cacheService';

/* ------------------------------- categories ------------------------------- */

export async function listCategories(): Promise<IProductCategory[]> {
  return ProductCategory.find().sort({ sortOrder: 1, name: 1 });
}

export async function createCategory(data: Partial<IProductCategory>): Promise<IProductCategory> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductCategory.findOne({ code: data.code });
    if (existing) {
      throw new ApiError(409, `Category with code ${data.code} already exists`);
    }
  }
  return ProductCategory.create(data);
}

export async function updateCategory(
  id: string,
  data: Partial<IProductCategory>,
): Promise<IProductCategory | null> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductCategory.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, `Category with code ${data.code} already exists`);
    }
  }
  return ProductCategory.findByIdAndUpdate(id, data, { new: true });
}

/* ------------------------------- product types ------------------------------ */

export interface ProductTypeFilters {
  categoryId?: string;
  search?: string;
  active?: boolean;
  featured?: boolean;
}

export interface ProductTypeAdminDto extends Record<string, unknown> {
  id: string;
  measurementTemplateId?: string;
  measurementTemplate?: Record<string, unknown> | null;
}

type ProductWriteInput = Omit<Partial<IProductType>, 'measurementTemplateId' | 'categoryId'> & {
  categoryId?: mongoose.Types.ObjectId | string;
  measurementTemplateId?: mongoose.Types.ObjectId | string | null;
  measurementTemplateCode?: string | null;
};

const PRODUCT_POPULATE = [
  { path: 'categoryId', select: 'name code active sortOrder' },
  {
    path: 'measurementTemplateId',
    select: 'code name category active version fieldDefs',
  },
] as const;

function serializeAdminProduct(doc: IProductType | Record<string, unknown>): ProductTypeAdminDto {
  const raw =
    typeof (doc as IProductType).toObject === 'function'
      ? (doc as IProductType).toObject({ virtuals: false })
      : { ...(doc as Record<string, unknown>) };

  const template = raw.measurementTemplateId as
    | (Record<string, unknown> & { _id?: unknown })
    | mongoose.Types.ObjectId
    | string
    | null
    | undefined;

  if (template && typeof template === 'object' && '_id' in template) {
    raw.measurementTemplate = template;
    raw.measurementTemplateId = String(template._id);
  } else if (template) {
    raw.measurementTemplateId = String(template);
  } else {
    raw.measurementTemplateId = undefined;
  }

  const dto = toDto<ProductTypeAdminDto>(raw);
  // The console and older API clients still address products by `_id`; keep it
  // alongside the canonical `id` until those call sites are migrated.
  dto._id = dto.id;
  return dto;
}

async function findAdminProduct(id: string): Promise<IProductType | null> {
  return ProductType.findById(id).populate([...PRODUCT_POPULATE]);
}

export async function listProductTypes(
  filters: ProductTypeFilters,
  page = 1,
  limit = 20,
): Promise<{ items: ProductTypeAdminDto[]; total: number }> {
  const query: Record<string, unknown> = {};

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.active !== undefined) {
    query.active = filters.active;
  }

  if (filters.featured !== undefined) {
    query.featured = filters.featured;
  }

  if (filters.search) {
    const regex = searchRegex(filters.search);
    if (regex) query.$or = [{ name: regex }, { code: regex }, { slug: regex }, { tags: regex }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ProductType.find(query)
      .populate([...PRODUCT_POPULATE])
      .sort({ sortOrder: 1, name: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit),
    ProductType.countDocuments(query),
  ]);

  return { items: items.map(serializeAdminProduct), total };
}

export async function getProductType(id: string): Promise<ProductTypeAdminDto | null> {
  const doc = await findAdminProduct(id);
  return doc ? serializeAdminProduct(doc) : null;
}

async function productSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await ProductType.exists(filter));
}

/**
 * Product URLs are derived from the garment name, not the workshop code.
 * `BR-CUST-LH` is useful on an order form and useless in a search result.
 */
export async function ensureProductSlug(
  name: string,
  preferred?: string,
  excludeId?: string,
): Promise<string> {
  return uniqueSlug(name, (slug) => productSlugExists(slug, excludeId), preferred);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeGallery(value: unknown): IProductGalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: `img-${index + 1}`, url: item.trim(), alt: '' };
      }
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      return {
        id: stringValue(raw.id) || `img-${index + 1}`,
        url: stringValue(raw.url) || stringValue(raw.image),
        alt: stringValue(raw.alt),
      };
    })
    .filter((item): item is IProductGalleryImage => Boolean(item?.url));
}

function normalizeVariants(value: unknown): IProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index): IProductVariant | null => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const name = stringValue(raw.name);
      if (!name) return null;
      return {
        id: stringValue(raw.id) || `variant-${index + 1}`,
        name,
        description: stringValue(raw.description) || undefined,
        priceRange: stringValue(raw.priceRange) || undefined,
        active: raw.active === undefined ? true : Boolean(raw.active),
      };
    })
    .filter((item): item is IProductVariant => item !== null);
}

function normalizeSeo(value: unknown): IProductSeo | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const seo: IProductSeo = {
    metaTitle: stringValue(raw.metaTitle) || undefined,
    metaDescription: stringValue(raw.metaDescription) || undefined,
    ogTitle: stringValue(raw.ogTitle) || undefined,
    ogDescription: stringValue(raw.ogDescription) || undefined,
    ogImage: stringValue(raw.ogImage) || undefined,
    twitterTitle: stringValue(raw.twitterTitle) || undefined,
    twitterDescription: stringValue(raw.twitterDescription) || undefined,
    twitterImage: stringValue(raw.twitterImage) || undefined,
  };
  return Object.values(seo).some(Boolean) ? seo : undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item).trim()).filter(Boolean);
}

/**
 * Accept both a template ObjectId and its human code.
 *
 * The code path is what older clients and CSV imports send. Resolving it here
 * means there is exactly one canonical storage shape on the product record.
 */
async function resolveTemplateRef(
  input: ProductWriteInput,
): Promise<mongoose.Types.ObjectId | null | undefined> {
  const hasId = Object.prototype.hasOwnProperty.call(input, 'measurementTemplateId');
  const hasCode = Object.prototype.hasOwnProperty.call(input, 'measurementTemplateCode');
  if (!hasId && !hasCode) return undefined;

  const raw = hasCode ? input.measurementTemplateCode : input.measurementTemplateId;
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;

  const text = String(raw).trim();
  const template = mongoose.isValidObjectId(text)
    ? await MeasurementTemplate.findById(text).select('_id')
    : await MeasurementTemplate.findOne({ code: text.toUpperCase() }).select('_id');

  if (!template) {
    throw new ApiError(400, `Measurement template "${text}" was not found`);
  }
  return template._id;
}

async function normalizeProductWrite(
  input: ProductWriteInput,
  opts: { requireIdentity: boolean },
): Promise<{ data: Record<string, unknown>; unset: string[] }> {
  const data: Record<string, unknown> = { ...input };
  const unset: string[] = [];
  delete data.id;
  delete data._id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.__v;
  delete data.measurementTemplateCode;

  const templateRef = await resolveTemplateRef(input);
  if (templateRef !== undefined) data.measurementTemplateId = templateRef;

  if (data.code !== undefined) {
    data.code = String(data.code).toUpperCase().trim();
  }
  if (data.name !== undefined) {
    data.name = String(data.name).trim();
  }
  if (opts.requireIdentity) {
    if (!data.code) throw new ApiError(400, 'Product type code is required');
    if (!data.name) throw new ApiError(400, 'Product type name is required');
    if (!data.categoryId) throw new ApiError(400, 'Category is required');
  }

  if (data.categoryId !== undefined) {
    const categoryExists = await ProductCategory.exists({ _id: data.categoryId });
    if (!categoryExists) throw new ApiError(400, 'Selected category was not found');
  }

  if (data.gallery !== undefined) data.gallery = normalizeGallery(data.gallery);
  if (data.variants !== undefined) data.variants = normalizeVariants(data.variants);
  if (data.seo !== undefined) {
    const seo = normalizeSeo(data.seo);
    if (seo) data.seo = seo;
    else {
      delete data.seo;
      unset.push('seo');
    }
  }
  if (data.tags !== undefined) data.tags = normalizeStringArray(data.tags) ?? [];
  if (data.defaultStages !== undefined) {
    data.defaultStages = normalizeStringArray(data.defaultStages) ?? [];
  }
  if (data.active !== undefined) data.active = Boolean(data.active);
  if (data.featured !== undefined) data.featured = Boolean(data.featured);
  if (data.sortOrder !== undefined) {
    const sortOrder = Number(data.sortOrder);
    data.sortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
  }
  if (data.leadTimeDays !== undefined) {
    if (data.leadTimeDays === null || data.leadTimeDays === '') {
      delete data.leadTimeDays;
      unset.push('leadTimeDays');
    } else {
      const days = Number(data.leadTimeDays);
      if (!Number.isFinite(days) || days < 0) {
        throw new ApiError(400, 'Lead time must be a positive number of days');
      }
      data.leadTimeDays = Math.round(days);
    }
  }

  for (const field of [
    'image',
    'description',
    'publicDescription',
    'indicativePriceRange',
    'leadTimeNote',
    'sku',
    'stockItem',
  ] as const) {
    if (data[field] !== undefined) {
      const value = stringValue(data[field]);
      if (value) data[field] = value;
      else {
        delete data[field];
        unset.push(field);
      }
    }
  }

  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }

  return { data, unset };
}

export async function createProductType(input: ProductWriteInput): Promise<ProductTypeAdminDto> {
  const { data } = await normalizeProductWrite(input, { requireIdentity: true });

  if (data.code) {
    const existing = await ProductType.findOne({ code: data.code });
    if (existing) {
      throw new ApiError(409, `Product type with code ${data.code} already exists`);
    }
  }

  const created = await ProductType.create(data);
  if (data.name) {
    created.slug = await ensureProductSlug(String(data.name), created.slug, String(created._id));
    await created.save();
  }
  const populated = await findAdminProduct(String(created._id));
  if (!populated) throw new ApiError(500, 'Product type could not be reloaded');
  return serializeAdminProduct(populated);
}

export async function updateProductType(
  id: string,
  input: ProductWriteInput,
): Promise<ProductTypeAdminDto | null> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product type id');
  const { data, unset } = await normalizeProductWrite(input, { requireIdentity: false });

  if (data.code) {
    const existing = await ProductType.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, `Product type with code ${data.code} already exists`);
    }
  }

  const current = await ProductType.findById(id).select('name slug');
  if (!current) return null;

  if (data.name) {
    // Once a URL has been published, keep it stable when only the display name
    // changes. A missing/blank slug (pre-Phase-8 document) is filled on save.
    if (!current.slug || data.slug) {
      data.slug = await ensureProductSlug(String(data.name), data.slug as string | undefined, id);
    }
  }

  const update: Record<string, unknown> = { $set: data };
  if (unset.length > 0) {
    update.$unset = Object.fromEntries(unset.map((field) => [field, 1]));
  }
  const updated = await ProductType.findByIdAndUpdate(id, update, { new: true }).populate([
    ...PRODUCT_POPULATE,
  ]);
  return updated ? serializeAdminProduct(updated) : null;
}

/* ------------------------------- management -------------------------------- */

export async function reorderProductTypes(ids: string[]): Promise<{ updated: number }> {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Provide at least one product type to reorder');
  }
  if (ids.length > 500) throw new ApiError(400, 'Reorder at most 500 product types at once');

  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw new ApiError(400, 'Reorder list contains duplicates');
  if (unique.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, 'Reorder list contains an invalid id');
  }

  const found = await ProductType.countDocuments({ _id: { $in: unique } });
  if (found !== unique.length) {
    throw new ApiError(400, 'One or more product types no longer exist');
  }

  await ProductType.bulkWrite(
    unique.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
    })),
  );

  return { updated: unique.length };
}

export interface ProductBulkUpdates {
  active?: boolean;
  featured?: boolean;
  categoryId?: string;
}

export async function bulkUpdateProductTypes(
  ids: string[],
  updates: ProductBulkUpdates,
): Promise<{ updated: number }> {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Select at least one product type');
  }
  if (ids.length > 500) throw new ApiError(400, 'Update at most 500 product types at once');
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, 'Selection contains an invalid id');
  }

  const set: Record<string, unknown> = {};
  if (updates.active !== undefined) set.active = Boolean(updates.active);
  if (updates.featured !== undefined) set.featured = Boolean(updates.featured);
  if (updates.categoryId) {
    const categoryExists = await ProductCategory.exists({ _id: updates.categoryId });
    if (!categoryExists) throw new ApiError(400, 'Selected category was not found');
    set.categoryId = updates.categoryId;
  }
  if (Object.keys(set).length === 0) throw new ApiError(400, 'No bulk change was provided');

  const result = await ProductType.updateMany({ _id: { $in: ids } }, { $set: set });
  return { updated: result.modifiedCount };
}

export interface ProductUsage {
  orderCount: number;
  openOrderCount: number;
  serviceCount: number;
  services: Array<{ id: string; title: string; slug: string; published: boolean }>;
}

/**
 * "Orders using" and "services using" for the selected garment.
 *
 * Order line items still store the workshop template code, so both the product
 * code and its linked template code are counted. That keeps history intact
 * when a product is renamed without changing its code.
 */
export async function getProductUsage(id: string): Promise<ProductUsage> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product type id');
  const product = await ProductType.findById(id)
    .select('code measurementTemplateId')
    .populate('measurementTemplateId', 'code');
  if (!product) throw new ApiError(404, 'Product type not found');

  const template = product.measurementTemplateId as unknown as { code?: string } | null;
  const codes = [product.code, template?.code].filter(Boolean) as string[];

  const [services, orderCount, openOrderCount] = await Promise.all([
    Service.find({ linkedProductTypeIds: product._id })
      .select('title slug published')
      .sort({ title: 1 })
      .lean(),
    Order.countDocuments({ 'lineItems.productTypeCode': { $in: codes } }),
    Order.countDocuments({
      'lineItems.productTypeCode': { $in: codes },
      status: { $nin: ['delivery', 'cancelled'] },
    }),
  ]);

  return {
    orderCount,
    openOrderCount,
    serviceCount: services.length,
    services: services.map((service) => ({
      id: String(service._id),
      title: service.title,
      slug: service.slug,
      published: Boolean(service.published),
    })),
  };
}

/* ------------------------------ CSV importing ------------------------------- */

export interface ProductImportIssue {
  row: number;
  code?: string;
  message: string;
}

export interface ProductImportResult {
  total: number;
  created: number;
  updated: number;
  failed: ProductImportIssue[];
}

function asBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'active', 'published'].includes(text)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'draft'].includes(text)) return false;
  throw new ApiError(400, `${field} must be true or false`);
}

function safeJson(value: unknown, field: string): unknown {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(400, `${field} is not valid JSON`);
  }
}

/**
 * Upsert products from already-parsed CSV rows.
 *
 * Each row is independent: a bad row is reported with its spreadsheet row
 * number and the import continues. Creating and updating are both supported so
 * an export can be edited and re-imported safely.
 */
export async function importProductTypes(
  rows: Array<Record<string, unknown>>,
): Promise<ProductImportResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(400, 'CSV import needs at least one row');
  }
  if (rows.length > 1000) throw new ApiError(400, 'Import at most 1000 rows at once');

  const result: ProductImportResult = {
    total: rows.length,
    created: 0,
    updated: 0,
    failed: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = Number(row?.row) > 0 ? Number(row.row) : index + 2;
    try {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new ApiError(400, 'Row is empty');
      }

      const code = String(row.code ?? '')
        .toUpperCase()
        .trim();
      if (!code) throw new ApiError(400, 'code is required');
      if (!/^[A-Z0-9-]+$/.test(code)) {
        throw new ApiError(400, 'code can only contain uppercase letters, numbers and dashes');
      }

      const name = String(row.name ?? '').trim();
      if (!name) throw new ApiError(400, 'name is required');

      const existing = await ProductType.findOne({ code }).select('_id');
      let categoryId: string | undefined;
      if (row.categoryId) {
        categoryId = String(row.categoryId);
      } else if (row.category) {
        const category = await ProductCategory.findOne({
          code: String(row.category).toUpperCase().trim(),
        }).select('_id');
        if (!category) throw new ApiError(400, `category "${row.category}" was not found`);
        categoryId = String(category._id);
      } else if (!existing) {
        throw new ApiError(400, 'category is required for a new product');
      }

      const templateText =
        row.measurementTemplateId ?? row.templateCode ?? row.template ?? row.fitTemplate;
      const gallery = safeJson(row.gallery, 'gallery') as unknown;
      const variants = safeJson(row.variants, 'variants') as unknown;
      const seo = safeJson(row.seo, 'seo') as unknown;

      const payload: ProductWriteInput = {
        code,
        name,
        categoryId,
        description: row.description !== undefined ? String(row.description) : undefined,
        publicDescription:
          row.publicDescription !== undefined ? String(row.publicDescription) : undefined,
        indicativePriceRange:
          row.indicativePriceRange !== undefined
            ? String(row.indicativePriceRange)
            : row.priceRange !== undefined
              ? String(row.priceRange)
              : undefined,
        leadTimeDays:
          row.leadTimeDays !== undefined && row.leadTimeDays !== ''
            ? Number(row.leadTimeDays)
            : undefined,
        leadTimeNote: row.leadTimeNote !== undefined ? String(row.leadTimeNote) : undefined,
        image: row.image !== undefined ? String(row.image) : undefined,
        tags:
          row.tags !== undefined
            ? String(row.tags)
                .split(/[;,]/)
                .map((tag) => tag.trim())
                .filter(Boolean)
            : undefined,
        featured: asBoolean(row.featured, 'featured'),
        active: asBoolean(row.active, 'active'),
        sortOrder:
          row.sortOrder !== undefined && row.sortOrder !== '' ? Number(row.sortOrder) : undefined,
        gallery: gallery as IProductGalleryImage[] | undefined,
        variants: variants as IProductVariant[] | undefined,
        seo: seo as IProductSeo | undefined,
        slug: row.slug ? String(row.slug).trim().toLowerCase() : undefined,
      };

      if (templateText !== undefined && templateText !== '') {
        payload.measurementTemplateCode = String(templateText);
      }

      if (existing) {
        await updateProductType(String(existing._id), payload);
        result.updated += 1;
      } else {
        await createProductType(payload);
        result.created += 1;
      }
    } catch (error) {
      result.failed.push({
        row: rowNumber,
        code: row && typeof row.code === 'string' ? row.code : undefined,
        message: error instanceof Error ? error.message : 'Row could not be imported',
      });
    }
  }

  return result;
}

/* --------------------------- public storefront API -------------------------- */

export interface PublicCategoryDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface PublicProductImageDto {
  id: string;
  url: string;
  alt: string;
}

export interface PublicProductVariantDto {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
}

export interface PublicProductDto {
  id: string;
  slug: string;
  code: string;
  name: string;
  category: PublicCategoryDto | null;
  description?: string;
  publicDescription?: string;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  gallery: PublicProductImageDto[];
  variants: PublicProductVariantDto[];
  leadTimeDays?: number;
  leadTimeNote?: string;
  tags: string[];
  featured: boolean;
  seo?: Pick<
    IProductSeo,
    'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription' | 'ogImage'
  >;
  sortOrder: number;
}

function toPublicCategory(category: IProductCategory): PublicCategoryDto {
  return {
    id: String(category._id),
    code: category.code,
    name: category.name,
    sortOrder: category.sortOrder,
  };
}

function toPublicProduct(doc: IProductType): PublicProductDto | null {
  const rawCategory = doc.categoryId as unknown as IProductCategory | null | undefined;
  if (
    rawCategory &&
    typeof rawCategory === 'object' &&
    'active' in rawCategory &&
    !rawCategory.active
  ) {
    return null;
  }

  const category =
    rawCategory && typeof rawCategory === 'object' && 'name' in rawCategory
      ? {
          id: String(rawCategory._id),
          code: rawCategory.code,
          name: rawCategory.name,
          sortOrder: rawCategory.sortOrder ?? 0,
        }
      : null;

  const gallery = (doc.gallery ?? []).map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
  }));

  const seo = doc.seo
    ? {
        metaTitle: doc.seo.metaTitle,
        metaDescription: doc.seo.metaDescription,
        ogTitle: doc.seo.ogTitle,
        ogDescription: doc.seo.ogDescription,
        ogImage: doc.seo.ogImage,
      }
    : undefined;

  return {
    id: String(doc._id),
    slug: doc.slug || slugify(doc.name),
    code: doc.code,
    name: doc.name,
    category,
    description: doc.description,
    publicDescription: doc.publicDescription,
    indicativePriceRange: doc.indicativePriceRange,
    defaultStages: doc.defaultStages ?? [],
    image: doc.image || gallery[0]?.url,
    gallery,
    variants: (doc.variants ?? [])
      .filter((variant) => variant.active !== false)
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        description: variant.description,
        priceRange: variant.priceRange,
      })),
    leadTimeDays: doc.leadTimeDays,
    leadTimeNote: doc.leadTimeNote,
    tags: doc.tags ?? [],
    featured: Boolean(doc.featured),
    seo,
    sortOrder: doc.sortOrder ?? 0,
  };
}

/**
 * Backfill slugs for documents created before the public catalogue existed.
 * The write is deliberately lazy (on read) so deploying this phase does not
 * require an offline migration window.
 */
async function backfillSlugs(items: IProductType[]): Promise<void> {
  const used = new Set(items.map((item) => item.slug).filter(Boolean) as string[]);

  for (const item of items) {
    if (item.slug) continue;
    const root = slugify(item.name);
    let candidate = root;
    let n = 2;
    // Check the whole collection, not just this result page: an inactive
    // garment can hold the slug of a name that is only now being published.
    while (used.has(candidate) || (await productSlugExists(candidate, String(item._id)))) {
      candidate = `${root}-${n}`;
      n += 1;
    }
    used.add(candidate);
    item.slug = candidate;
    await ProductType.updateOne({ _id: item._id }, { $set: { slug: candidate } });
  }
}

export async function getPublicCatalog(filters: { featured?: boolean } = {}): Promise<{
  categories: PublicCategoryDto[];
  products: PublicProductDto[];
}> {
  return cached(
    cacheKey(CACHE_KEYS.cmsCatalog, 'public', filters.featured),
    CACHE_TTL.cmsMs,
    () => queryPublicCatalog(filters),
  );
}

async function queryPublicCatalog(filters: { featured?: boolean }): Promise<{
  categories: PublicCategoryDto[];
  products: PublicProductDto[];
}> {
  const categories = await ProductCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  const categoryIds = categories.map((category) => category._id);

  const query: Record<string, unknown> = {
    active: true,
    categoryId: { $in: categoryIds },
  };
  if (filters.featured !== undefined) query.featured = filters.featured;

  const products = await ProductType.find(query)
    .populate('categoryId', 'name code active sortOrder')
    .sort({ sortOrder: 1, name: 1 });

  await backfillSlugs(products);

  return {
    categories: categories.map(toPublicCategory),
    products: products
      .map(toPublicProduct)
      .filter((product): product is PublicProductDto => Boolean(product)),
  };
}

export async function getPublicProduct(slug: string): Promise<PublicProductDto | null> {
  return cached(
    cacheKey(CACHE_KEYS.cmsCatalog, 'product', slug),
    CACHE_TTL.cmsMs,
    () => queryPublicProduct(slug),
  );
}

async function queryPublicProduct(slug: string): Promise<PublicProductDto | null> {
  const normalized = slugify(slug);

  const direct = await ProductType.findOne({ slug: normalized, active: true }).populate(
    'categoryId',
    'name code active sortOrder',
  );
  if (direct) {
    return toPublicProduct(direct);
  }

  // A database seeded before slugs existed: match the computed slug or the
  // workshop code, then persist the slug so the canonical URL wins next time.
  const candidates = await ProductType.find({ active: true })
    .populate('categoryId', 'name code active sortOrder')
    .sort({ sortOrder: 1, name: 1 });
  await backfillSlugs(candidates);

  const match = candidates.find(
    (item) => item.slug === normalized || item.code.toLowerCase() === slug.toLowerCase(),
  );
  return match ? toPublicProduct(match) : null;
}

/* ---------------------------------- seed ---------------------------------- */

export async function seedCatalog(): Promise<{ categoriesSeeded: number; typesSeeded: number }> {
  // 1. Seed Categories if empty
  let categoriesCount = await ProductCategory.countDocuments();
  const seededCategoriesMap = new Map<string, string>(); // name -> id

  const defaultCategories = [
    { code: 'BRIDAL', name: 'Bridal Collection', sortOrder: 1 },
    { code: 'BLOUSES', name: 'Ethnic / Designer Blouses', sortOrder: 2 },
    { code: 'KURTIS', name: 'Kurtis & Tunics', sortOrder: 3 },
    { code: 'GOWNS', name: 'Dresses & Gowns', sortOrder: 4 },
    { code: 'SALWAR', name: 'Salwar / Suit Collection', sortOrder: 5 },
    { code: 'SKIRTS', name: 'Skirts & Bottoms', sortOrder: 6 },
    { code: 'KIDS', name: 'Kids Wear (Girls)', sortOrder: 7 },
    { code: 'CUSTOM', name: 'Custom Tailoring', sortOrder: 8 },
  ];

  if (categoriesCount === 0) {
    const created = await ProductCategory.insertMany(defaultCategories);
    categoriesCount = created.length;
    created.forEach((c) => seededCategoriesMap.set(c.name, c._id.toString()));
  } else {
    const existing = await ProductCategory.find();
    existing.forEach((c) => seededCategoriesMap.set(c.name, c._id.toString()));
  }

  // 2. Seed Product Types if empty
  const typesCount = await ProductType.countDocuments();
  let typesSeeded = 0;

  if (typesCount === 0) {
    // The catalogue and the fit-card library are two faces of the same
    // workshop data. Seed templates first so every seeded product can hold a
    // real reference instead of a code copied into an id field.
    await seedTemplates();
    const templates = seedData();
    const templateDocs = await MeasurementTemplate.find({
      code: { $in: templates.map((template) => template.code) },
    }).select('_id code');
    const templateByCode = new Map(templateDocs.map((template) => [template.code, template._id]));

    const usedSlugs = new Set<string>();
    const featuredCodes = new Set(['BR-LH', 'BR-BL', 'BL-MG', 'KT-AN', 'DR-LG', 'SL-CH']);
    const typesToInsert = templates.map((t) => {
      // Find matching category
      let categoryId = seededCategoriesMap.get(t.category);
      if (!categoryId) {
        // Fallback or default custom tailoring category
        categoryId = seededCategoriesMap.get('Custom Tailoring');
      }

      const root = slugify(t.name);
      let slug = root;
      let n = 2;
      while (usedSlugs.has(slug)) {
        slug = `${root}-${n}`;
        n += 1;
      }
      usedSlugs.add(slug);

      return {
        code: t.code,
        slug,
        name: t.name,
        categoryId,
        description: t.description,
        publicDescription: t.description,
        measurementTemplateId: templateByCode.get(t.code),
        gallery: [],
        variants: [],
        leadTimeDays: t.category === 'Bridal Collection' ? 45 : 21,
        tags: [t.category],
        featured: featuredCodes.has(t.code),
        active: true,
        sortOrder: 0,
        defaultStages: ['measurements', 'cutting', 'stitching', 'finishing'],
      };
    });

    const createdTypes = await ProductType.insertMany(typesToInsert);
    typesSeeded = createdTypes.length;
  }

  return {
    categoriesSeeded: categoriesCount,
    typesSeeded,
  };
}
