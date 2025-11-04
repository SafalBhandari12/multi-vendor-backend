import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.cuid(),
  name: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  shortDescription: z.string().max(500).nullable(),
  sku: z.string().min(3).max(50),
  barcode: z.string().max(50).nullable(),
  productType: z.enum([
    "PRESCRIPTION",
    "OTC",
    "SUPPLEMENT",
    "MEDICAL_DEVICE",
    "PERSONAL_CARE",
  ]),
  requiresPrescription: z.boolean().default(false),
  basePrice: z.number().min(0),
  comparePrice: z.number().min(0).nullable(),
  costPrice: z.number().min(0),
  manufacturer: z.string().max(200).nullable(),
  composition: z.string().max(500).nullable(),
  packSize: z.string().max(100).nullable(),
  dosageForm: z.string().max(100).nullable(),
  strength: z.string().max(100).nullable(),
  images: z.array(z.string().url()).min(1).max(10),
  thumbnail: z.string().url().nullable(),
  weight: z.number().min(0).nullable(),
  dimensions: z.string().max(100).nullable(),
  storageConditions: z.string().max(500).nullable(),
  sideEffects: z.string().max(1000).nullable(),
  contraindications: z.string().max(1000).nullable(),
  warnings: z.string().max(1000).nullable(),
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE"])
    .default("PENDING_APPROVAL"),
  metaTitle: z.string().max(200).nullable(),
  metaDescription: z.string().max(500).nullable(),
  metaKeywords: z.string().max(500).nullable(),
});
export type createProductData = z.infer<typeof createProductSchema> & {
  vendorId: string;
};
