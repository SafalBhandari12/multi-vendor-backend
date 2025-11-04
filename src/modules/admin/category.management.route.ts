import express, { Router } from "express";
import requireAuth from "../../middleware/requireAuth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import CategoryManagementController from "./category.management.controller.js";
import upload from "../../services/multer.service.js";

const router: express.Router = Router();

router.post(
  "/create",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_CATEGORIES"),
  upload.single("image"),
  CategoryManagementController.createCategory
);

router.get("/", CategoryManagementController.getAllCategories);

router.get("/:categoryId", CategoryManagementController.getCategoryById);

router.get(
  "/:categoryId/activity",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_CATEGORIES"),
  CategoryManagementController.getCategoryActivityLogs
);

router.put(
  "/:categoryId",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_CATEGORIES"),
  upload.single("image"),
  CategoryManagementController.updateCategory
);

router.delete(
  "/:categoryId",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_CATEGORIES"),
  CategoryManagementController.deleteCategory
);

export default router;
