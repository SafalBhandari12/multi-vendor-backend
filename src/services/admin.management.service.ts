import type {
  CreateAdminInput,
  UpdateAdminDetailsInput,
  UpdatePermissionsInput,
} from "../modules/admin/management.controller.js";
import prisma from "../db/prismaClient.js";

class AdminService {
  static async createAdmin(
    data: CreateAdminInput,
    superAdminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    let existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
      include: { adminProfile: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      let user;
      let adminProfile;
      let action = "CREATE_ADMIN";

      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: "ADMIN",
            status: "ACTIVE",
            phoneVerified: true,
            ...(data.email && { email: data.email }),
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
          },
        });

        if (existingUser.adminProfile) {
          adminProfile = await tx.adminProfile.update({
            where: { userId: user.id },
            data: {
              designation: data.designation,
              department: data.department,
              permissions: data.permissions,
              isActive: true,
            },
          });
        } else {
          adminProfile = await tx.adminProfile.create({
            data: {
              userId: user.id,
              designation: data.designation,
              department: data.department,
              permissions: data.permissions,
              isActive: true,
            },
          });
        }

        action = "UPDATE_USER_TO_ADMIN";
      } else {
        user = await tx.user.create({
          data: {
            phone: data.phone,
            countryCode: data.countryCode,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: "ADMIN",
            status: "ACTIVE",
            phoneVerified: true,
          },
        });

        adminProfile = await tx.adminProfile.create({
          data: {
            userId: user.id,
            designation: data.designation,
            department: data.department,
            permissions: data.permissions,
            isActive: true,
          },
        });
      }

      const superAdminProfile = await tx.adminProfile.findUnique({
        where: { userId: superAdminId },
      });

      if (superAdminProfile) {
        await tx.adminActivityLog.create({
          data: {
            adminId: superAdminProfile.id,
            action: action,
            module: "ADMIN",
            entityId: user.id,
            description: `${
              action === "CREATE_ADMIN" ? "Created" : "Updated"
            } admin: ${user.firstName} ${user.lastName}`,
            ipAddress,
            userAgent,
            metadata: {
              email: user.email,
              phone: user.phone,
              permissions: data.permissions,
              previousRole: existingUser?.role || null,
            },
          },
        });
      }

      return { user, adminProfile };
    });

    return result;
  }
  static async getAllAdmins(limit: number = 100, offset: number = 0) {
    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: "ADMIN" },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          adminProfile: {
            select: {
              id: true,
              designation: true,
              department: true,
              permissions: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({
        where: { role: "ADMIN" },
      }),
    ]);

    return { admins, total };
  }
  static async getAdminById(adminId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: "ADMIN" },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        adminProfile: {
          select: {
            id: true,
            designation: true,
            department: true,
            permissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!admin) {
      throw {
        status: 404,
        message: "Admin not found",
      };
    }

    return admin;
  }
  static async updatePermissions(
    adminId: string,
    data: UpdatePermissionsInput,
    superAdminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
      select: { id: true, permissions: true },
    });

    if (!adminProfile) {
      throw {
        status: 404,
        message: "Admin not found",
      };
    }

    const oldPermissions = adminProfile.permissions;

    const updated = await prisma.adminProfile.update({
      where: { userId: adminId },
      data: {
        permissions: data.permissions,
      },
      select: {
        id: true,
        permissions: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const superAdminProfile = await prisma.adminProfile.findUnique({
      where: { userId: superAdminId },
    });

    if (superAdminProfile) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: superAdminProfile.id,
          action: "UPDATE_ADMIN_PERMISSIONS",
          module: "ADMIN",
          entityId: adminId,
          description: `Updated permissions for: ${updated.user.firstName} ${updated.user.lastName}`,
          ipAddress,
          userAgent,
          metadata: {
            email: updated.user.email,
            oldPermissions,
            newPermissions: data.permissions,
          },
        },
      });
    }

    return updated;
  }
  static async toggleAdminStatus(
    adminId: string,
    isActive: boolean,
    superAdminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
      select: { isActive: true },
    });

    if (!adminProfile) {
      throw {
        status: 404,
        message: "Admin not found",
      };
    }

    const updated = await prisma.adminProfile.update({
      where: { userId: adminId },
      data: { isActive },
      select: {
        isActive: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const superAdminProfile = await prisma.adminProfile.findUnique({
      where: { userId: superAdminId },
    });

    if (superAdminProfile) {
      const action = isActive ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN";
      await prisma.adminActivityLog.create({
        data: {
          adminId: superAdminProfile.id,
          action,
          module: "ADMIN",
          entityId: adminId,
          description: `${isActive ? "Activated" : "Deactivated"} admin: ${
            updated.user.firstName
          } ${updated.user.lastName}`,
          ipAddress,
          userAgent,
          metadata: {
            email: updated.user.email,
            status: isActive ? "ACTIVE" : "INACTIVE",
          },
        },
      });
    }

    return updated;
  }
  static async updateAdminDetails(
    adminId: string,
    data: UpdateAdminDetailsInput,
    superAdminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const existingAdmin = await prisma.user.findUnique({
      where: { id: adminId, role: "ADMIN" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!existingAdmin) {
      throw {
        status: 404,
        message: "Admin not found",
      };
    }

    if (data.email && data.email !== existingAdmin.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw {
          status: 400,
          message: "Email already in use",
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: adminId },
        data: {
          ...(data.email && { email: data.email }),
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const updatedProfile = await tx.adminProfile.update({
        where: { userId: adminId },
        data: {
          ...(data.designation && { designation: data.designation }),
          ...(data.department && { department: data.department }),
        },
        select: {
          id: true,
          designation: true,
          department: true,
        },
      });

      const superAdminProfile = await tx.adminProfile.findUnique({
        where: { userId: superAdminId },
      });

      if (superAdminProfile) {
        await tx.adminActivityLog.create({
          data: {
            adminId: superAdminProfile.id,
            action: "UPDATE_ADMIN_DETAILS",
            module: "ADMIN",
            entityId: adminId,
            description: `Updated details for: ${updatedUser.firstName} ${updatedUser.lastName}`,
            ipAddress,
            userAgent,
            metadata: {
              oldEmail: existingAdmin.email,
              newEmail: updatedUser.email,
              oldName: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
              newName: `${updatedUser.firstName} ${updatedUser.lastName}`,
            },
          },
        });
      }

      return { user: updatedUser, profile: updatedProfile };
    });

    return result;
  }
  static async deleteAdmin(
    adminId: string,
    superAdminId: string,
    ipAddress: string,
    userAgent: string
  ) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: "ADMIN" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!admin) {
      throw {
        status: 404,
        message: "Admin not found",
      };
    }

    const superAdminProfile = await prisma.adminProfile.findUnique({
      where: { userId: superAdminId },
    });

    if (superAdminProfile) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: superAdminProfile.id,
          action: "DELETE_ADMIN",
          module: "ADMIN",
          entityId: adminId,
          description: `Deleted admin: ${admin.firstName} ${admin.lastName}`,
          ipAddress,
          userAgent,
          metadata: {
            email: admin.email,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    }

    await prisma.user.delete({
      where: { id: adminId },
    });

    return { success: true, adminId };
  }
  static async getActivityLog(
    limit: number = 100,
    offset: number = 0,
    adminId?: string
  ) {
    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where: {
          ...(adminId && { entityId: adminId }),
          action: {
            in: [
              "CREATE_ADMIN",
              "UPDATE_ADMIN_PERMISSIONS",
              "UPDATE_ADMIN_DETAILS",
              "ACTIVATE_ADMIN",
              "DEACTIVATE_ADMIN",
              "DELETE_ADMIN",
            ],
          },
        },
        select: {
          id: true,
          adminId: true,
          action: true,
          module: true,
          entityId: true,
          description: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
          admin: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.adminActivityLog.count({
        where: {
          ...(adminId && { entityId: adminId }),
          action: {
            in: [
              "CREATE_ADMIN",
              "UPDATE_ADMIN_PERMISSIONS",
              "UPDATE_ADMIN_DETAILS",
              "ACTIVATE_ADMIN",
              "DEACTIVATE_ADMIN",
              "DELETE_ADMIN",
            ],
          },
        },
      }),
    ]);

    return { logs, total };
  }
  static async searchAdminByPhone(phone: string) {
    const admin = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        adminProfile: {
          select: {
            id: true,
            designation: true,
            department: true,
            permissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      throw {
        status: 404,
        message: "Admin not found with this phone number",
      };
    }

    return admin;
  }
}

export default AdminService;
