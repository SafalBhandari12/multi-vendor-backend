import type { RequestHandler } from "express";
import z from "zod";
import upload from "../../services/multer.service.js";

export const registerVendorSchema = z.object({
  businessName: z.string().min(3).max(200),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(10).max(15),
  licenseNumber: z.string().min(5).max(50),
  taxId: z.string().min(5).max(50),
  description: z.string().min(10).max(1000).optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
  country: z.string().min(2).max(100),
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(8).max(20),
  accountHolderName: z.string().min(2).max(200),
  ifscCode: z.string().min(6).max(15),
});

export type RegisterVendorInput = z.infer<typeof registerVendorSchema> & {
  userId: string;
  files: vendorRegistrationDocuments;
};

export const uploadDocuments: RequestHandler = upload.fields([
  { name: "businessRegistration", maxCount: 1 },
  { name: "pharmacyLicense", maxCount: 1 },
  { name: "taxDocument", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

export type vendorRegistrationDocuments = {
  businessRegistration: [Express.Multer.File];
  pharmacyLicense: [Express.Multer.File];
  taxDocument: [Express.Multer.File];
  logo?: [Express.Multer.File];
};
