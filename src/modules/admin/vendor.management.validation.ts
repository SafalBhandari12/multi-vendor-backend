import { VendorStatus } from "@prisma/client";
import { z } from "zod";

export const getAllVendorQuery = z.object({
  limit: z.number().min(1).max(500).default(50),
  offset: z.number().min(0).default(0),
  status: z.enum(VendorStatus),
  search: z.string().min(2).max(100).optional(),
});

export type getAllVendorQuerySchema = z.infer<typeof getAllVendorQuery>;

export const getVendorByIdParams = z.object({
  vendorId: z.string().cuid(),
});
export type getVendorByIdParamsSchema = z.infer<typeof getVendorByIdParams>;

export const approveVendorSchema = z.object({
  comission: z.number().min(0).max(100).default(10.0),
});
export const rejectVendorReasonSchema = z.object({
  reason: z.string().min(5).max(500),
});
export const suspendVendorSchema = z.object({
  reason: z.string().min(5).max(500),
});
export const getVendorActivityLogsParams = z.object({
  vendorId: z.string().cuid(),
  limit: z.number().min(1).max(500).default(50),
  offset: z.number().min(0).default(0),
});
