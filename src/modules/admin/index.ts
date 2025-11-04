import express from "express";
import vendorManagementRoutes from "./vendor.management.route.js";
import categoryManagementRoutes from "./category.management.route.js";

const router: express.Router = express.Router();

router.use("/vendors", vendorManagementRoutes);
router.use("/categories", categoryManagementRoutes);

export default router;
