import { AdminPermission } from "@prisma/client";
import z from "zod";

export const createAdminSchema = z.object({
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

export const updatePermissionsSchema = z.object({
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

export const searchAdminByPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits")
    .regex(/^\d+$/, "Phone must contain only numeric characters"),
});

export const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});
