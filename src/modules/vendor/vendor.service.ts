import { VendorStatus } from "@prisma/client";
import prisma from "../../db/prismaClient.js";
import type { RegisterVendorInput } from "./vendor.validation.js";

class VendorService {
  static async register(data: RegisterVendorInput) {
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: data.userId },
    });

    if (existingVendor) {
      if (existingVendor.status === VendorStatus.PENDING) {
        throw {
          message: "Vendor registration is already pending approval.",
          status: 400,
          source: "vendorService",
        };
      }
      if (existingVendor.status === VendorStatus.APPROVED) {
        throw {
          message: "Vendor is already registered and approved.",
          status: 400,
          source: "vendorService",
        };
      }
    }

    const duplicateCheck = await prisma.vendor.findFirst({
      where: {
        OR: [
          { businessEmail: data.businessEmail },
          { businessPhone: data.businessPhone },
          { licenseNumber: data.licenseNumber },
          { taxId: data.taxId },
        ],
        NOT: { userId: data.userId },
      },
    });
    if (!duplicateCheck) {
      throw {
        message:
          "Vendor with provided business email, phone, license number, or tax ID already exists.",
        status: 400,
        source: "vendorService",
      };
    }
    const vendor = await prisma.vendor.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        licenseNumber: data.licenseNumber,
        taxId: data.taxId,
        description: data.description || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        ifscCode: data.ifscCode,
        businessRegistration: data.documents.businessRegistration,
        pharmacyLicense: data.documents.pharmacyLicense,
        taxDocument: data.documents.taxDocument,
        logo: data.documents.logo ?? null,
        status: VendorStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    //TODO: Implement notification to the admin about vendor registration
    return vendor;
  }
}

export default VendorService;
