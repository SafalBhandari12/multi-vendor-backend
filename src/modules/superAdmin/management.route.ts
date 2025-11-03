import express, { Router } from "express";
import requireAuth from "../../middleware/requireAuth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import AdminController from "./management.controller.js";

const router: express.Router = Router();

router.post(
  "/create",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.createAdmin
);

router.get(
  "/all",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.getAllAdmins
);
router.get(
  "/activity",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.getActivityLog
);
router.get(
  "/search/phone",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.searchByPhone
);

router.get(
  "/:adminId",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.getAdminById
);

router.put(
  "/:adminId/permissions",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.updatePermissions
);

router.put(
  "/:adminId/status",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.toggleAdminStatus
);

router.put(
  "/:adminId",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.updateAdminDetails
);

router.delete(
  "/:adminId",
  requireAuth,
  requireAdmin,
  requirePermission("MANAGE_ADMINS"),
  AdminController.deleteAdmin
);

export default router;
