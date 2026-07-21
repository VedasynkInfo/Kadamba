import type { Request, Response } from 'express';
import {
  createBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  updateBlog,
} from '../services/blogService';
import { isAdminRequest } from '../middleware/optionalAuth';
import { asyncHandler } from '../utils/asyncHandler';

export const listBlogsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listBlogs(req.query as Record<string, unknown>, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Blog posts', data });
});

export const getBlogHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await getBlog(req.params.idOrSlug as string, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Blog post', data: item });
});

export const createBlogHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await createBlog(req.body);
  res.status(201).json({ success: true, message: 'Blog post created', data: item });
});

export const updateBlogHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await updateBlog(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Blog post updated', data: item });
});

export const removeBlogHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await deleteBlog(req.params.id as string);
  res.status(200).json({ success: true, message: 'Blog post deleted', data: item });
});
