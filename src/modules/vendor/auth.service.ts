import { VendorStatus } from "@prisma/client";
import prisma from "../../db/prismaClient.js";
import type { RegisterVendorInput } from "./auth.validation.js";
import ImageKitService from "../../services/imagekit.service.js";

class VendorAuthService {
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
    console.log(duplicateCheck);
    if (duplicateCheck) {
      throw {
        message:
          "Vendor with provided business email, phone, license number, or tax ID already exists.",
        status: 400,
        source: "vendorService",
      };
    }

    const [businessReg, pharmacyLic, taxDoc, logo] = await Promise.all([
      ImageKitService.uploadFile(
        data.files.businessRegistration[0],
        `vendors/${data.userId}/documents`,
        "business-registration"
      ),
      ImageKitService.uploadFile(
        data.files.pharmacyLicense[0],
        `vendors/${data.userId}/documents`,
        "pharmacy-license"
      ),
      ImageKitService.uploadFile(
        data.files.taxDocument[0],
        `vendors/${data.userId}/documents`,
        "tax-document"
      ),
      data.files.logo?.[0]
        ? ImageKitService.uploadFile(
            data.files.logo[0],
            `vendors/${data.userId}/documents`,
            "logo"
          )
        : Promise.resolve(null),
    ]);
    if (!businessReg || !pharmacyLic || !taxDoc) {
      throw {
        message: "Failed to upload documents. Please try again.",
        status: 500,
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
        businessRegistration: businessReg.url,
        pharmacyLicense: pharmacyLic.url,
        taxDocument: taxDoc.url,
        logo: logo?.url ?? null,
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
  static async getVendorStatus(userId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        businessName: true,
        businessEmail: true,
        createdAt: true,
        verifiedAt: true,
      },
    });
    return vendor;
  }

  static async getVendorProfile(userId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
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
      },
    });

    if (!vendor) {
      throw {
        message: "You have not registered as a vendor.",
        status: 404,
        source: "vendorService",
      };
    }

    return vendor;
  }

  static async resubmitApplication(data: RegisterVendorInput) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: data.userId },
    });

    if (!vendor) {
      throw {
        message: "You have not registered as a vendor.",
        status: 404,
        source: "vendorService",
      };
    }

    if (vendor.status !== VendorStatus.REJECTED) {
      throw {
        message: "You can only resubmit an application that has been rejected.",
        status: 400,
        source: "vendorService",
      };
    }

    // Check for duplicate information (excluding current vendor)
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

    if (duplicateCheck) {
      throw {
        message:
          "Vendor with provided business email, phone, license number, or tax ID already exists.",
        status: 400,
        source: "vendorService",
      };
    }

    // Upload new documents
    const [businessReg, pharmacyLic, taxDoc, logo] = await Promise.all([
      ImageKitService.uploadFile(
        data.files.businessRegistration[0],
        `vendors/${data.userId}/documents`,
        "business-registration"
      ),
      ImageKitService.uploadFile(
        data.files.pharmacyLicense[0],
        `vendors/${data.userId}/documents`,
        "pharmacy-license"
      ),
      ImageKitService.uploadFile(
        data.files.taxDocument[0],
        `vendors/${data.userId}/documents`,
        "tax-document"
      ),
      data.files.logo?.[0]
        ? ImageKitService.uploadFile(
            data.files.logo[0],
            `vendors/${data.userId}/documents`,
            "logo"
          )
        : Promise.resolve(null),
    ]);

    if (!businessReg || !pharmacyLic || !taxDoc) {
      throw {
        message: "Failed to upload documents. Please try again.",
        status: 500,
        source: "vendorService",
      };
    }

    // Update vendor with new information and reset status
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        businessName: data.businessName,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        licenseNumber: data.licenseNumber,
        taxId: data.taxId,
        description: data.description || vendor.description,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || vendor.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        ifscCode: data.ifscCode,
        businessRegistration: businessReg.url,
        pharmacyLicense: pharmacyLic.url,
        taxDocument: taxDoc.url,
        logo: logo?.url ?? vendor.logo,
        status: VendorStatus.PENDING,
        rejectedReason: null, // Clear rejection reason
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

    return updatedVendor;
  }

  static async updateVendorProfile(userId: string, data: any) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw {
        message: "You have not registered as a vendor.",
        status: 404,
        source: "vendorService",
      };
    }

    if (vendor.status === VendorStatus.PENDING) {
      throw {
        message:
          "You cannot update your profile while your application is under review. Please wait for approval or resubmit after rejection.",
        status: 400,
        source: "vendorService",
      };
    }

    if (vendor.status === VendorStatus.SUSPENDED) {
      throw {
        message: "You cannot update your profile. Your account is suspended.",
        status: 403,
        source: "vendorService",
      };
    }

    // Check for duplicate information if email, phone, license or taxId are being updated
    if (
      data.businessEmail ||
      data.businessPhone ||
      data.licenseNumber ||
      data.taxId
    ) {
      const duplicateCheck = await prisma.vendor.findFirst({
        where: {
          OR: [
            ...(data.businessEmail
              ? [{ businessEmail: data.businessEmail }]
              : []),
            ...(data.businessPhone
              ? [{ businessPhone: data.businessPhone }]
              : []),
            ...(data.licenseNumber
              ? [{ licenseNumber: data.licenseNumber }]
              : []),
            ...(data.taxId ? [{ taxId: data.taxId }] : []),
          ],
          NOT: { userId },
        },
      });

      if (duplicateCheck) {
        throw {
          message:
            "Vendor with provided business email, phone, license number, or tax ID already exists.",
          status: 400,
          source: "vendorService",
        };
      }
    }

    // Build update data object (no file uploads allowed)
    const updateData: any = { ...data };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
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
      },
    });

    return updatedVendor;
  }
}

export default VendorAuthService;
