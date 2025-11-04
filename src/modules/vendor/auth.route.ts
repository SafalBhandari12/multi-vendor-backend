import express, { Router } from "express";
import VendorController from "./auth.controller.js";
import requireAuth from "../../middleware/requireAuth.js";
import { uploadDocuments } from "./auth.validation.js";

const router: express.Router = Router();

router.post(
  "/register",
  requireAuth,
  uploadDocuments,
  VendorController.registerVendor
);

router.get("/status", requireAuth, VendorController.getStatus);

export default router;
