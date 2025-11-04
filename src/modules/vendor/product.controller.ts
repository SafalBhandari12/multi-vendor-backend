import type { Request, Response } from "express";
import { createProductSchema } from "./product.validation.js";

class ProductController {
  static async createProduct(req: Request, res: Response) {
    const vendorId = req.vendorProfile!.id;
    const validatedData = createProductSchema.parse(req.body);
  }
}
export default ProductController;
