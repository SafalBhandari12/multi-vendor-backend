import type { Request, RequestHandler, Response } from "express";
import {
  registerVendorSchema,
  updateVendorProfileSchema,
  type vendorRegistrationDocuments,
} from "./auth.validation.js";
import VendorService from "./auth.service.js";
import { UserRole, VendorStatus } from "@prisma/client";

class VendorController {
  static async registerVendor(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    if (req.user?.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: Super Admins cannot register as vendors",
      });
    }

    const files = req.files as vendorRegistrationDocuments;
    if (!req.is("multipart/form-data")) {
      return res.status(400).json({
        ok: false,
        message: "Content-Type must be multipart/form-data",
      });
    }

    if (
      !files.businessRegistration?.[0] ||
      !files.pharmacyLicense?.[0] ||
      !files.taxDocument?.[0]
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "All documents (businessRegistration, pharmacyLicense, taxDocument) are required.",
      });
    }

    const validatedData = registerVendorSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: validatedData.error.flatten(),
      });
    }

    const vendor = await VendorService.register({
      userId,
      ...validatedData.data,
      files,
    });

    return res.status(201).json({
      ok: true,
      message:
        "Vendor registration submitted successfully. Your application is under review.",
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        status: vendor.status,
        documents: {
          businessRegistration: vendor.businessRegistration,
          pharmacyLicense: vendor.pharmacyLicense,
          taxDocument: vendor.taxDocument,
          logo: vendor.logo,
        },
        createdAt: vendor.createdAt,
      },
    });
  }
  static async getStatus(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const vendor = await VendorService.getVendorStatus(userId);
    if (!vendor) {
      return res
        .status(404)
        .json({ ok: false, message: "You have not registered as a vendor." });
    }

    let message = "";
    if (vendor?.status === VendorStatus.PENDING) {
      message = "Your vendor application is under review.";
    } else if (vendor?.status === VendorStatus.APPROVED) {
      message = "Your vendor application has been approved.";
    } else if (vendor?.status === VendorStatus.REJECTED) {
      message = "Your vendor application has been rejected.";
    } else if (vendor?.status === VendorStatus.SUSPENDED) {
      message = "Your vendor account has been suspended.";
    }

    return res.status(200).json({
      ok: true,
      hasApplicationApproved: true,
      vendor: {
        ...vendor,
        canResubmit: vendor.status === VendorStatus.REJECTED,
        UserRole: req.user?.role || UserRole.CUSTOMER,
      },
    });
  }

  static async getProfile(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const vendor = await VendorService.getVendorProfile(userId);

    return res.status(200).json({
      ok: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        businessPhone: vendor.businessPhone,
        licenseNumber: vendor.licenseNumber,
        taxId: vendor.taxId,
        logo: vendor.logo,
        description: vendor.description,
        status: vendor.status,
        rejectedReason: vendor.rejectedReason,
        rating: vendor.rating,
        totalSales: vendor.totalSales,
        totalOrders: vendor.totalOrders,
        commission: vendor.commission,
        address: {
          addressLine1: vendor.addressLine1,
          addressLine2: vendor.addressLine2,
          city: vendor.city,
          state: vendor.state,
          postalCode: vendor.postalCode,
          country: vendor.country,
        },
        bankDetails: {
          bankName: vendor.bankName,
          accountNumber: vendor.accountNumber,
          accountHolderName: vendor.accountHolderName,
          ifscCode: vendor.ifscCode,
        },
        documents: {
          businessRegistration: vendor.businessRegistration,
          pharmacyLicense: vendor.pharmacyLicense,
          taxDocument: vendor.taxDocument,
        },
        user: vendor.user,
        createdAt: vendor.createdAt,
        verifiedAt: vendor.verifiedAt,
        updatedAt: vendor.updatedAt,
      },
    });
  }

  static async resubmitApplication(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    if (req.user?.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: Super Admins cannot resubmit vendor applications",
      });
    }

    if (!req.is("multipart/form-data")) {
      return res.status(400).json({
        ok: false,
        message: "Content-Type must be multipart/form-data",
      });
    }

    const files = req.files as vendorRegistrationDocuments;

    if (
      !files?.businessRegistration?.[0] ||
      !files?.pharmacyLicense?.[0] ||
      !files?.taxDocument?.[0]
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "All documents (businessRegistration, pharmacyLicense, taxDocument) are required.",
      });
    }

    const validatedData = registerVendorSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: validatedData.error.flatten(),
      });
    }

    const vendor = await VendorService.resubmitApplication({
      userId,
      ...validatedData.data,
      files,
    });

    return res.status(200).json({
      ok: true,
      message:
        "Vendor application resubmitted successfully. Your application is under review again.",
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        status: vendor.status,
        documents: {
          businessRegistration: vendor.businessRegistration,
          pharmacyLicense: vendor.pharmacyLicense,
          taxDocument: vendor.taxDocument,
          logo: vendor.logo,
        },
        createdAt: vendor.createdAt,
      },
    });
  }

  static async updateProfile(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    if (req.user?.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: Super Admins cannot update vendor profiles",
      });
    }

    const validatedData = updateVendorProfileSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: validatedData.error.flatten(),
      });
    }

    const vendor = await VendorService.updateVendorProfile(
      userId,
      validatedData.data
    );

    return res.status(200).json({
      ok: true,
      message: "Vendor profile updated successfully",
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        businessPhone: vendor.businessPhone,
        licenseNumber: vendor.licenseNumber,
        taxId: vendor.taxId,
        logo: vendor.logo,
        description: vendor.description,
        status: vendor.status,
        address: {
          addressLine1: vendor.addressLine1,
          addressLine2: vendor.addressLine2,
          city: vendor.city,
          state: vendor.state,
          postalCode: vendor.postalCode,
          country: vendor.country,
        },
        bankDetails: {
          bankName: vendor.bankName,
          accountNumber: vendor.accountNumber,
          accountHolderName: vendor.accountHolderName,
          ifscCode: vendor.ifscCode,
        },
        documents: {
          businessRegistration: vendor.businessRegistration,
          pharmacyLicense: vendor.pharmacyLicense,
          taxDocument: vendor.taxDocument,
        },
        updatedAt: vendor.updatedAt,
      },
    });
  }
}

export default VendorController;
