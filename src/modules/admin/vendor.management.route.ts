import express from "express";
import VendorManagement from "./vendor.management.controller.js";

const router: express.Router = express.Router();

router.get("/", VendorManagement.getAllVendors);
router.get("/:vendorId", VendorManagement.getVendorById);
router.post("/:vendorId/approve", VendorManagement.approveVendor);
router.post("/:vendorId/reject", VendorManagement.rejectVendor);
router.post("/:vendorId/suspend", VendorManagement.suspendVendor);
router.get("/:vendorId/activity-logs", VendorManagement.getVendorActivityLogs);

export default router;
