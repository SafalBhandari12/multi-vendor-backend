import { ProductStatus, VendorStatus } from "@prisma/client";
import prisma from "../../db/prismaClient.js";
import type { createProductData } from "./product.validation.js";

class ProductService {
  static async createProduct(data: createProductData) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.vendorId },
    });
    if (!vendor) {
      throw { status: 404, message: "Vendor not found" };
    }
    if (vendor.status !== VendorStatus.APPROVED) {
      throw { status: 400, message: "Vendor is not approved" };
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw { status: 400, message: "SKU must be unique" };
    }
    const product = await prisma.product.create({
      data: {
        ...data,
        status: data.status || ProductStatus.PENDING_APPROVAL,
      },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });
  }
}
export default ProductService;
