import { AdminPermission } from "@prisma/client";
import type { Request, Response } from "express";
import z from "zod";
import AdminService from "./management.service.js";

const createAdminSchema = z.object({
  phone: z.string().min(10).max(15),
  countryCode: z.string().min(1).max(5).default("91"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  designation: z.string().min(2).max(100),
  department: z.string().min(2).max(100),
  permissions: z
    .array(
      z.enum([
        "MANAGE_USERS",
        "MANAGE_VENDORS",
        "MANAGE_PRODUCTS",
        "MANAGE_ORDERS",
        "MANAGE_PRESCRIPTIONS",
        "MANAGE_REFUNDS",
        "MANAGE_COUPONS",
        "MANAGE_CATEGORIES",
        "MANAGE_REVIEWS",
        "MANAGE_PAYOUTS",
        "VIEW_ANALYTICS",
        "MANAGE_SETTINGS",
      ])
    )
    .min(1, "At least one permission required")
    .max(12, "Cannot request more than 12 permissions"),
});
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

const updatePermissionsSchema = z.object({
  permissions: z.array(z.enum(AdminPermission)),
});
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;

export const updateAdminDetailsSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  designation: z.string().min(3).max(100).optional(),
  department: z.string().min(3).max(100).optional(),
});
export type UpdateAdminDetailsInput = z.infer<typeof updateAdminDetailsSchema>;

const searchAdminByPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits")
    .regex(/^\d+$/, "Phone must contain only numeric characters"),
});

const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});

class AdminController {
  static async createAdmin(req: Request, res: Response) {
    const parseResult = createAdminSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { user, adminProfile } = await AdminService.createAdmin(
      parseResult.data,
      req.user!.sub,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    return res.status(201).json({
      ok: true,
      message: "Admin created successfully",
      admin: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      adminProfile: {
        id: adminProfile.id,
        designation: adminProfile.designation,
        department: adminProfile.department,
        permissions: adminProfile.permissions,
        isActive: adminProfile.isActive,
        createdAt: adminProfile.createdAt,
      },
    });
  }
  static async getAllAdmins(req: Request, res: Response) {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const { admins, total } = await AdminService.getAllAdmins(limit, offset);

    return res.json({
      ok: true,
      total,
      limit,
      offset,
      admins: admins.map((admin) => ({
        id: admin.id,
        phone: admin.phone,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        status: admin.status,
        adminProfile: admin.adminProfile,
      })),
    });
  }
  static async getAdminById(req: Request, res: Response) {
    const { adminId } = req.params;

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "AdminId parameter is required" });
    }

    const admin = await AdminService.getAdminById(adminId);

    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        phone: admin.phone,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      adminProfile: admin.adminProfile,
    });
  }
  static async searchByPhone(req: Request, res: Response) {
    const parseResult = searchAdminByPhoneSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const admin = await AdminService.searchAdminByPhone(parseResult.data.phone);

    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        phone: admin.phone,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      adminProfile: admin.adminProfile,
    });
  }
  static async updatePermissions(req: Request, res: Response) {
    const parseResult = updatePermissionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { adminId } = req.params;
    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId parameter is required" });
    }

    const updated = await AdminService.updatePermissions(
      adminId,
      parseResult.data,
      req.user!.sub,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    return res.json({
      ok: true,
      message: "Admin permissions updated successfully",
      adminProfile: {
        id: updated.id,
        permissions: updated.permissions,
      },
    });
  }
  static async toggleAdminStatus(req: Request, res: Response) {
    const parseResult = updateAdminStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { adminId } = req.params;

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId parameter is required" });
    }

    const updated = await AdminService.toggleAdminStatus(
      adminId,
      parseResult.data.isActive,
      req.user!.sub,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    return res.json({
      ok: true,
      message: "Admin status updated successfully",
      admin: {
        isActive: updated.isActive,
        status: updated.isActive ? "ACTIVE" : "INACTIVE",
      },
    });
  }
  static async updateAdminDetails(req: Request, res: Response) {
    const parseResult = updateAdminDetailsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { adminId } = req.params;

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId parameter is required" });
    }

    const { user, profile } = await AdminService.updateAdminDetails(
      adminId,
      parseResult.data,
      req.user!.sub,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    return res.json({
      ok: true,
      message: "Admin updated successfully",
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      adminProfile: {
        id: profile.id,
        designation: profile.designation,
        department: profile.department,
      },
    });
  }
  static async deleteAdmin(req: Request, res: Response) {
    const { adminId } = req.params;

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId parameter is required" });
    }

    await AdminService.deleteAdmin(
      adminId,
      req.user!.sub,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    return res.json({
      ok: true,
      message: "Admin deleted successfully",
      adminId,
    });
  }
  static async getActivityLog(req: Request, res: Response) {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const adminId = req.query.adminId as string | undefined;

    const { logs, total } = await AdminService.getActivityLog(
      limit,
      offset,
      adminId
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

export default AdminController;
