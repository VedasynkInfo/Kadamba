import { ProductCategory, IProductCategory } from '../models/ProductCategory';
import { ProductType, IProductType } from '../models/ProductType';
import { seedData } from './measurementTemplateService';
import { searchRegex } from '../utils/query';
import { slugify, uniqueSlug } from '../utils/slugify';

export async function listCategories(): Promise<IProductCategory[]> {
  return ProductCategory.find().sort({ sortOrder: 1, name: 1 });
}

export async function createCategory(data: Partial<IProductCategory>): Promise<IProductCategory> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductCategory.findOne({ code: data.code });
    if (existing) {
      throw new Error(`Category with code ${data.code} already exists`);
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
      throw new Error(`Category with code ${data.code} already exists`);
    }
  }
  return ProductCategory.findByIdAndUpdate(id, data, { new: true });
}

export interface ProductTypeFilters {
  categoryId?: string;
  search?: string;
  active?: boolean;
}

export async function listProductTypes(
  filters: ProductTypeFilters,
  page = 1,
  limit = 20,
): Promise<{ items: IProductType[]; total: number }> {
  const query: Record<string, any> = {};

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.active !== undefined) {
    query.active = filters.active;
  }

  if (filters.search) {
    const regex = searchRegex(filters.search);
    if (regex) query.$or = [{ name: regex }, { code: regex }, { slug: regex }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ProductType.find(query)
      .populate('categoryId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductType.countDocuments(query),
  ]);

  return { items, total };
}

export async function getProductType(id: string): Promise<IProductType | null> {
  return ProductType.findById(id).populate('categoryId', 'name code');
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

export async function createProductType(data: Partial<IProductType>): Promise<IProductType> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductType.findOne({ code: data.code });
    if (existing) {
      throw new Error(`Product type with code ${data.code} already exists`);
    }
  }
  if (data.name) {
    data.slug = await ensureProductSlug(data.name, data.slug);
  }
  return ProductType.create(data);
}

export async function updateProductType(
  id: string,
  data: Partial<IProductType>,
): Promise<IProductType | null> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductType.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) {
      throw new Error(`Product type with code ${data.code} already exists`);
    }
  }

  const current = await ProductType.findById(id).select('name slug');
  if (current && data.name) {
    // Once a URL has been published, keep it stable when only the display name
    // changes. A missing/blank slug (pre-Phase-8 document) is filled on save.
    if (!current.slug || data.slug) {
      data.slug = await ensureProductSlug(data.name, data.slug, id);
    }
  }

  return ProductType.findByIdAndUpdate(id, data, { new: true }).populate('categoryId', 'name code');
}

/* --------------------------- public storefront API -------------------------- */

export interface PublicCategoryDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
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
    image: doc.image,
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

export async function getPublicCatalog(): Promise<{
  categories: PublicCategoryDto[];
  products: PublicProductDto[];
}> {
  const categories = await ProductCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  const categoryIds = categories.map((category) => category._id);

  const products = await ProductType.find({ active: true, categoryId: { $in: categoryIds } })
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
    const templates = seedData();
    const usedSlugs = new Set<string>();
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
        measurementTemplateId: t.code,
        active: true,
        sortOrder: 0,
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
