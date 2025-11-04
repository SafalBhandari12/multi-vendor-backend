import type { Request, Response } from "express";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryByIdSchema,
  getAllCategoriesQuery,
  deleteCategorySchema,
} from "./category.management.validation.js";
import CategoryManagementService from "./category.management.service.js";

class CategoryManagementController {
  static async createCategory(req: Request, res: Response) {
    const parseResult = createCategorySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "Image file is required",
      });
    }

    const adminId = req.user!.sub;
    const ipAddress = req.ip || null;
    const userAgent = req.get("User-Agent") || null;

    const category = await CategoryManagementService.createCategory(
      parseResult.data,
      adminId,
      ipAddress,
      userAgent,
      req.file
    );

    return res.status(201).json({
      ok: true,
      message: "Category created successfully",
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        parentId: category.parentId,
        createdAt: category.createdAt,
      },
    });
  }

  static async getAllCategories(req: Request, res: Response) {
    const parseResult = getAllCategoriesQuery.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { categories, total } =
      await CategoryManagementService.getAllCategories(parseResult.data);

    return res.json({
      ok: true,
      total,
      limit: parseResult.data.limit,
      offset: parseResult.data.offset,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent,
        childrenCount: category.children.length,
        productsCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
    });
  }

  static async getCategoryById(req: Request, res: Response) {
    const parseResult = getCategoryByIdSchema.safeParse(req.params);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const category = await CategoryManagementService.getCategoryById(
      parseResult.data
    );

    return res.json({
      ok: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent,
        children: category.children,
        productsCount: category._count.products,
        childrenCount: category._count.children,
        recentProducts: category.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  }

  static async updateCategory(req: Request, res: Response) {
    const paramsResult = getCategoryByIdSchema.safeParse(req.params);

    if (!paramsResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: paramsResult.error.flatten(),
      });
    }

    const bodyResult = updateCategorySchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: bodyResult.error.flatten(),
      });
    }

    const adminId = req.user!.sub;
    const ipAddress = req.ip || null;
    const userAgent = req.get("User-Agent") || null;

    const category = await CategoryManagementService.updateCategory(
      paramsResult.data.categoryId,
      bodyResult.data,
      adminId,
      ipAddress,
      userAgent,
      req.file
    );

    return res.json({
      ok: true,
      message: "Category updated successfully",
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent,
        children: category.children,
        updatedAt: category.updatedAt,
      },
    });
  }

  static async deleteCategory(req: Request, res: Response) {
    const parseResult = deleteCategorySchema.safeParse(req.params);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const adminId = req.user!.sub;
    const ipAddress = req.ip || null;
    const userAgent = req.get("User-Agent") || null;

    const result = await CategoryManagementService.deleteCategory(
      parseResult.data.categoryId,
      adminId,
      ipAddress,
      userAgent
    );

    return res.json({
      ok: true,
      message: "Category deleted successfully",
      categoryId: result.categoryId,
    });
  }

  static async getCategoryActivityLogs(req: Request, res: Response) {
    const paramsResult = getCategoryByIdSchema.safeParse(req.params);

    if (!paramsResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: paramsResult.error.flatten(),
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const { logs, total } =
      await CategoryManagementService.getCategoryActivityLogs(
        paramsResult.data.categoryId,
        limit,
        offset
      );

    return res.json({
      ok: true,
      total,
      limit,
      offset,
      logs,
    });
  }
}

export default CategoryManagementController;
