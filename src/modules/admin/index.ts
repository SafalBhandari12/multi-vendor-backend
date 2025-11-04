import express from "express";
import vendorManagementRoutes from "./vendor.management.route.js";

const router: express.Router = express.Router();

router.use("/vendorManagement", vendorManagementRoutes);

export default router;
