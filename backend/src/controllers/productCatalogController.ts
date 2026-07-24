import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import * as catalogService from '../services/productCatalogService';

export const listCategoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const categories = await catalogService.listCategories();
  res.status(200).json({
    success: true,
    data: categories,
  });
});

export const createCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await catalogService.createCategory(req.body);
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const updateCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await catalogService.updateCategory(String(req.params.id), req.body);
  if (!category) {
    res.status(404).json({ success: false, message: 'Category not found' });
    return;
  }
  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const listProductTypesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const { categoryId, search, active } = req.query;

  const filters: catalogService.ProductTypeFilters = {};

  if (typeof categoryId === 'string' && categoryId.trim()) {
    filters.categoryId = categoryId.trim();
  }

  if (typeof search === 'string' && search.trim()) {
    filters.search = search.trim();
  }

  if (active === 'true') {
    filters.active = true;
  } else if (active === 'false') {
    filters.active = false;
  }

  const { items, total } = await catalogService.listProductTypes(filters, page, limit);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: buildPaginationMeta(page, limit, total),
    },
  });
});

export const getProductTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  const productType = await catalogService.getProductType(String(req.params.id));
  if (!productType) {
    res.status(404).json({ success: false, message: 'Product type not found' });
    return;
  }
  res.status(200).json({
    success: true,
    data: productType,
  });
});

export const createProductTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  const productType = await catalogService.createProductType(req.body);
  res.status(201).json({
    success: true,
    message: 'Product type created successfully',
    data: productType,
  });
});

export const updateProductTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  const productType = await catalogService.updateProductType(String(req.params.id), req.body);
  if (!productType) {
    res.status(404).json({ success: false, message: 'Product type not found' });
    return;
  }
  res.status(200).json({
    success: true,
    message: 'Product type updated successfully',
    data: productType,
  });
});

export const seedCatalogHandler = asyncHandler(async (req: Request, res: Response) => {
  const results = await catalogService.seedCatalog();
  res.status(200).json({
    success: true,
    message: 'Boutique product catalog seeded successfully',
    data: results,
  });
});
