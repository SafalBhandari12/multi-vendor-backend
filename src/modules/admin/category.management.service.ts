import prisma from "../../db/prismaClient.js";
import ImageKitService from "../../services/imagekit.service.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  GetCategoryByIdSchema,
  GetAllCategoriesQuery,
} from "./category.management.validation.js";

class CategoryManagementService {
  static async createCategory(
    data: CreateCategoryInput,
    adminId: string,
    ipAddress: string | null,
    userAgent: string | null,
    imageFile?: Express.Multer.File
  ) {
    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });

    if (existingCategory) {
      throw {
        status: 400,
        message:
          existingCategory.name === data.name
            ? "Category name already exists"
            : "Category slug already exists",
      };
    }

    // Verify parent category exists if provided
    if (data.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        throw {
          status: 404,
          message: "Parent category not found",
        };
      }
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
      select: { id: true },
    });

    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      const uploadResult = await ImageKitService.uploadFile(
        imageFile,
        "categories",
        `category-${data.slug}-${Date.now()}`
      );
      imageUrl = uploadResult.url;
    }

    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          ...(data.description && { description: data.description }),
          ...(imageUrl && { image: imageUrl }),
          ...(data.parentId && { parentId: data.parentId }),
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (admin) {
        await tx.adminActivityLog.create({
          data: {
            adminId: admin.id,
            module: "CATEGORY_MANAGEMENT",
            entityId: category.id,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            action: "CREATE_CATEGORY",
            description: `Created category: ${category.name}`,
            metadata: {
              categoryId: category.id,
              categoryName: category.name,
              slug: category.slug,
              parentId: category.parentId,
              imageUrl: imageUrl,
            },
          },
        });
      }

      return category;
    });

    return result;
  }

  static async getAllCategories(filters: GetAllCategoriesQuery) {
    const { search, limit = 50, offset = 0, isActive, parentId } = filters;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (parentId) {
      where.parentId = parentId;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.category.count({ where }),
    ]);

    return { categories, total };
  }

  static async getCategoryById({ categoryId }: GetCategoryByIdSchema) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true,
          },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw {
        status: 404,
        message: "Category not found",
      };
    }

    return category;
  }

  static async updateCategory(
    categoryId: string,
    data: UpdateCategoryInput,
    adminId: string,
    ipAddress: string | null,
    userAgent: string | null,
    imageFile?: Express.Multer.File
  ) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw {
        status: 404,
        message: "Category not found",
      };
    }

    // Check for duplicate name or slug (excluding current category)
    if (data.name || data.slug) {
      const duplicateCheck = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: categoryId } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });

      if (duplicateCheck) {
        throw {
          status: 400,
          message:
            duplicateCheck.name === data.name
              ? "Category name already exists"
              : "Category slug already exists",
        };
      }
    }

    // Verify parent category exists if provided
    if (data.parentId && data.parentId !== category.parentId) {
      if (data.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw {
            status: 404,
            message: "Parent category not found",
          };
        }

        // Prevent circular parent-child relationship
        if (parentCategory.parentId === categoryId) {
          throw {
            status: 400,
            message:
              "Cannot set this category as parent due to circular relationship",
          };
        }
      }
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
      select: { id: true },
    });

    let imageUrl: string | undefined;

    // Upload new image if provided
    if (imageFile) {
      // Delete old image if exists
      if (category.image) {
        try {
          // Extract fileId from ImageKit URL and delete
          const fileIdMatch = category.image.match(/\/([^/]+)$/);
          if (fileIdMatch && fileIdMatch[1]) {
            await ImageKitService.deleteFile(fileIdMatch[1]);
          }
        } catch (error) {
          console.error("Error deleting old image:", error);
          // Continue with upload even if delete fails
        }
      }

      const uploadResult = await ImageKitService.uploadFile(
        imageFile,
        "categories",
        `category-${data.slug || category.slug}-${Date.now()}`
      );
      imageUrl = uploadResult.url;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id: categoryId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(imageUrl !== undefined && { image: imageUrl }),
          ...(data.parentId !== undefined && { parentId: data.parentId }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (admin) {
        await tx.adminActivityLog.create({
          data: {
            adminId: admin.id,
            module: "CATEGORY_MANAGEMENT",
            entityId: categoryId,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            action: "UPDATE_CATEGORY",
            description: `Updated category: ${updatedCategory.name}`,
            metadata: {
              categoryId,
              previousData: {
                name: category.name,
                slug: category.slug,
                isActive: category.isActive,
                image: category.image,
              },
              newData: {
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                isActive: updatedCategory.isActive,
                image: updatedCategory.image,
              },
            },
          },
        });
      }

      return updatedCategory;
    });

    return result;
  }

  static async deleteCategory(
    categoryId: string,
    adminId: string,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          select: { id: true },
        },
        children: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      throw {
        status: 404,
        message: "Category not found",
      };
    }

    if (category.products.length > 0) {
      throw {
        status: 400,
        message: `Cannot delete category with ${category.products.length} associated products`,
      };
    }

    if (category.children.length > 0) {
      throw {
        status: 400,
        message: `Cannot delete category with ${category.children.length} subcategories`,
      };
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
      select: { id: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.category.delete({
        where: { id: categoryId },
      });

      if (admin) {
        await tx.adminActivityLog.create({
          data: {
            adminId: admin.id,
            module: "CATEGORY_MANAGEMENT",
            entityId: categoryId,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            action: "DELETE_CATEGORY",
            description: `Deleted category: ${category.name}`,
            metadata: {
              categoryId,
              categoryName: category.name,
              slug: category.slug,
            },
          },
        });
      }

      return { success: true, categoryId };
    });

    return result;
  }

  static async getCategoryActivityLogs(
    categoryId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const whereQuery = {
      AND: [
        {
          module: "CATEGORY_MANAGEMENT",
        },
        {
          entityId: categoryId,
        },
      ],
    };

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where: whereQuery,
        include: {
          admin: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.adminActivityLog.count({ where: whereQuery }),
    ]);

    return { logs, total };
  }
}

export default CategoryManagementService;
