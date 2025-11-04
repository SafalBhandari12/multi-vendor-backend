import express from "express";
import VendorManagement from "./vendor.management.controller.js";
import requireAuth from "../../middleware/requireAuth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { AdminPermission } from "@prisma/client";

const router: express.Router = express.Router();

router.get(
  "/",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.getAllVendors
);
router.get(
  "/:vendorId",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.getVendorById
);
router.post(
  "/:vendorId/approve",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.approveVendor
);
router.post(
  "/:vendorId/reject",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.rejectVendor
);
router.post(
  "/:vendorId/suspend",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.suspendVendor
);
router.get(
  "/:vendorId/activity-logs",
  requireAuth,
  requireAdmin,
  requirePermission(AdminPermission.MANAGE_VENDORS),
  VendorManagement.getVendorActivityLogs
);

export default router;
