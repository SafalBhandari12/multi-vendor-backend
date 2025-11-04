import { UserRole, VendorStatus } from "@prisma/client";
import prisma from "../../db/prismaClient.js";
import type {
  getAllVendorQuerySchema,
  getVendorByIdParamsSchema,
} from "./vendor.management.validation.js";

class VendorManagementService {
  static async getAllVendors(filters: getAllVendorQuerySchema) {
    const { status, search, limit = 50, offset = 0 } = filters;
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,

        include: {
          user: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.count({ where }),
    ]);
    return { vendors, total };
  }
  static async getVendorById({ vendorId }: getVendorByIdParamsSchema) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        products: {
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            basePrice: true,
          },
        },
      },
    });
    if (!vendor) {
      throw {
        status: 404,
        message: "Vendor not found",
      };
    }
    return vendor;
  }
  static async approveVendor(
    vendorId: string,
    adminId: string,
    commission?: number
  ) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });
    if (!vendor) {
      throw {
        status: 404,
        message: "Vendor not found",
      };
    }
    if (vendor.status === VendorStatus.APPROVED) {
      throw {
        status: 400,
        message: "Vendor is already approved",
      };
    }
    const result = await prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: VendorStatus.APPROVED,
          verifiedAt: new Date(),
          commission: commission || 10,
          rejectedReason: null,
        },
      });
      const updatedUser = await tx.user.update({
        where: { id: vendor.userId },
        data: { role: UserRole.VENDOR },
      });
      await tx.adminActivityLog.create({
        data: {
          adminId,
          module: "VENDOR_MANAGEMENT",
          action: "APPROVE_VENDOR",
          description: `Approved vendor ${vendor.businessName} (${vendor.id})`,
          metadata: {
            vendorId,
            previousStatus: vendor.status,
            newStatus: VendorStatus.APPROVED,
          },
        },
      });
      return { vendor: updatedVendor, user: updatedUser };
    });
    return result;
  }
  static async rejectVendor(vendorId: string, adminId: string, reason: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw {
        status: 404,
        message: "Vendor not found",
      };
    }
    if (vendor.status === VendorStatus.REJECTED) {
      throw {
        status: 400,
        message: "Vendor is already rejected",
      };
    }
    const result = await prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: VendorStatus.REJECTED,
          rejectedReason: reason,
        },
      });
      await tx.adminActivityLog.create({
        data: {
          adminId,
          module: "VENDOR_MANAGEMENT",
          action: "REJECT_VENDOR",
          description: `Rejected vendor ${vendor.businessName} (${vendor.id})`,
          metadata: {
            vendorId,
            previousStatus: vendor.status,
            newStatus: VendorStatus.REJECTED,
          },
        },
      });
      return { updatedVendor };
    });
    return result;
  }
  static async suspendVendor(
    vendorId: string,
    adminId: string,
    reason: string
  ) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw {
        status: 404,
        message: "Vendor not found",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          status: VendorStatus.SUSPENDED,
        },
      });

      await tx.adminActivityLog.create({
        data: {
          adminId,
          module: "VENDOR_MANAGEMENT",
          action: "SUSPEND_VENDOR",
          description: `Suspended vendor ${vendor.businessName} (${vendor.id})`,
          metadata: {
            vendorId,
            previousStatus: vendor.status,
            newStatus: VendorStatus.SUSPENDED,
          },
        },
      });
      return { updatedVendor };
    });
    return result;
  }
  static async getVendorActivityLogs(vendorId: string, limit = 50, offset = 0) {
    const whereQuery = {
      AND: [
        {
          OR: [
            { action: { contains: "VENDOR" } },
            { module: { contains: "VENDOR" } },
          ],
        },
        {
          metadata: {
            path: ["vendorId"],
            equals: vendorId,
          },
        },
      ],
    };
    const [logs, total] = await Promise.all([
      await prisma.adminActivityLog.findMany({
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
export default VendorManagementService;
