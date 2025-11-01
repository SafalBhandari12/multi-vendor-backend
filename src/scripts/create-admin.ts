import type { AdminPermission } from "@prisma/client";
import prisma from "../db/prismaClient.js";

async function createSuperAdmin() {
  try {
    const superAdminData = {
      phone: "7847915622",
      countryCode: "+91",
      email: "safalbhandari069@gmail.com",
      firstName: "Safal",
      lastName: "Bhandari",
      designation: "Platform Owner",
      department: "Management",
    };

    let isUpdated = false;

    const existing = await prisma.user.findUnique({
      where: { phone: superAdminData.phone },
      include: { adminProfile: true },
    });

    const allPermissions: AdminPermission[] = [
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
      "MANAGE_ADMINS",
    ];

    let result;

    if (existing) {
      console.log("User already exists. Updating to SUPER_ADMIN...");
      isUpdated = true;
      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: existing.id },
          data: {
            email: superAdminData.email,
            firstName: superAdminData.firstName,
            lastName: superAdminData.lastName,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            phoneVerified: true,
          },
        });
        let adminProfile;
        if (existing.adminProfile) {
          adminProfile = await tx.adminProfile.update({
            where: { id: existing.adminProfile.id },
            data: {
              designation: superAdminData.designation,
              department: superAdminData.department,
              permissions: allPermissions,
              isActive: true,
            },
          });
        } else {
          adminProfile = await tx.adminProfile.create({
            data: {
              userId: existing.id,
              designation: superAdminData.designation,
              department: superAdminData.department,
              permissions: allPermissions,
              isActive: true,
            },
          });
        }

        return { user, adminProfile };
      });
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone: superAdminData.phone,
            countryCode: superAdminData.countryCode,
            email: superAdminData.email,
            firstName: superAdminData.firstName,
            lastName: superAdminData.lastName,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            phoneVerified: true,
          },
        });

        const adminProfile = await tx.adminProfile.create({
          data: {
            userId: user.id,
            designation: superAdminData.designation,
            department: superAdminData.department,
            permissions: allPermissions,
            isActive: true,
          },
        });

        return { user, adminProfile };
      });
    }

    console.log(
      `Super admin ${isUpdated ? "updated" : "created"} successfully.`
    );
  } catch (error) {
    console.log("Error creating/updating super admin:", error);
  }
}

createSuperAdmin();
