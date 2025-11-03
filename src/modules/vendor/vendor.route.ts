import express, { Router } from "express";
import VendorController, { uploadDocuments } from "./vendor.controller.js";
import requireAuth from "../../middleware/requireAuth.js";

const router: express.Router = Router();

router.post(
  "/register",
  requireAuth,
  uploadDocuments,
  VendorController.registerVendor
);

export default router;
