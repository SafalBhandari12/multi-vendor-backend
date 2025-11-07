import express, { Router } from "express";
import VendorController from "./auth.controller.js";
import requireAuth from "../../middleware/requireAuth.js";
import {
  uploadDocuments,
  uploadDocumentsOptional,
  uploadProfileDocuments,
} from "./auth.validation.js";

const router: express.Router = Router();

router.post(
  "/register",
  requireAuth,
  uploadDocuments,
  VendorController.registerVendor
);

router.get("/status", requireAuth, VendorController.getStatus);

router.get("/profile", requireAuth, VendorController.getProfile);

router.post(
  "/resubmit",
  requireAuth,
  uploadDocumentsOptional,
  VendorController.resubmitApplication
);

router.put(
  "/profile",
  requireAuth,
  uploadProfileDocuments,
  VendorController.updateProfile
);

export default router;
