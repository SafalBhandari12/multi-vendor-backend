import type { Request, RequestHandler, Response } from "express";
import { registerVendorSchema } from "./vendor.validation.js";
import ImageKitService from "../../services/imagekit.service.js";
import VendorService from "./vendor.service.js";
import upload from "../../services/multer.service.js";

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

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    console.log(files.businessRegistration ?? "Hello");

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

    const [businessReg, pharmacyLic, taxDoc, logo] = await Promise.all([
      ImageKitService.uploadFile(
        files.businessRegistration[0],
        `vendors/${userId}/documents`,
        "business-registration"
      ),
      ImageKitService.uploadFile(
        files.pharmacyLicense[0],
        `vendors/${userId}/documents`
      ),
      ImageKitService.uploadFile(
        files.taxDocument[0],
        `vendors/${userId}/documents`
      ),
      files.logo?.[0]
        ? ImageKitService.uploadFile(
            files.logo[0],
            `vendors/${userId}/documents`,
            "logo"
          )
        : Promise.resolve(null),
    ]);
    if (!businessReg || !pharmacyLic || !taxDoc) {
      return res.status(500).json({
        ok: false,
        message: "Failed to upload documents. Please try again.",
      });
    }

    const vendor = await VendorService.register({
      userId,
      ...validatedData.data,
      documents: {
        businessRegistration: businessReg.url,
        pharmacyLicense: pharmacyLic.url,
        taxDocument: taxDoc.url,
        ...(logo && { logo: logo.url }),
      },
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
          businessRegistration: businessReg.url,
          pharmacyLicense: pharmacyLic.url,
          taxDocument: taxDoc.url,
          logo: logo?.url,
        },
        createdAt: vendor.createdAt,
      },
    });
  }
}

export default VendorController;
