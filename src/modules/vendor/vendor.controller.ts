import type { Request, RequestHandler, Response } from "express";
import {
  registerVendorSchema,
  type vendorRegistrationDocuments,
} from "./vendor.validation.js";
import ImageKitService from "../../services/imagekit.service.js";
import VendorService from "./vendor.service.js";
import upload from "../../services/multer.service.js";
import prisma from "../../db/prismaClient.js";

export const uploadDocuments: RequestHandler = upload.fields([
  { name: "businessRegistration", maxCount: 1 },
  { name: "pharmacyLicense", maxCount: 1 },
  { name: "taxDocument", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

class VendorController {
  static async registerVendor(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
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
}

export default VendorController;
