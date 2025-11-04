import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(5).max(500).optional(),
  parentId: z.string().cuid().optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens")
    .optional(),
  description: z.string().min(5).max(500).optional(),
  parentId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const getCategoryByIdSchema = z.object({
  categoryId: z.string().cuid(),
});
export type GetCategoryByIdSchema = z.infer<typeof getCategoryByIdSchema>;

export const getAllCategoriesQuery = z.object({
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().min(2).max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  parentId: z.string().cuid().optional(),
});
export type GetAllCategoriesQuery = z.infer<typeof getAllCategoriesQuery>;

export const deleteCategorySchema = z.object({
  categoryId: z.string().cuid(),
});
export type DeleteCategorySchema = z.infer<typeof deleteCategorySchema>;
