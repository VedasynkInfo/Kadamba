import { ProductCategory, IProductCategory } from '../models/ProductCategory';
import { ProductType, IProductType } from '../models/ProductType';
import { seedData } from './measurementTemplateService';

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

export async function updateCategory(id: string, data: Partial<IProductCategory>): Promise<IProductCategory | null> {
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
  limit = 20
): Promise<{ items: IProductType[]; total: number }> {
  const query: Record<string, any> = {};

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.active !== undefined) {
    query.active = filters.active;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: regex }, { code: regex }];
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

export async function createProductType(data: Partial<IProductType>): Promise<IProductType> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductType.findOne({ code: data.code });
    if (existing) {
      throw new Error(`Product type with code ${data.code} already exists`);
    }
  }
  return ProductType.create(data);
}

export async function updateProductType(id: string, data: Partial<IProductType>): Promise<IProductType | null> {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await ProductType.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) {
      throw new Error(`Product type with code ${data.code} already exists`);
    }
  }
  return ProductType.findByIdAndUpdate(id, data, { new: true }).populate('categoryId', 'name code');
}

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
    const typesToInsert = templates.map((t) => {
      // Find matching category
      let categoryId = seededCategoriesMap.get(t.category);
      if (!categoryId) {
        // Fallback or default custom tailoring category
        categoryId = seededCategoriesMap.get('Custom Tailoring');
      }

      return {
        code: t.code,
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
