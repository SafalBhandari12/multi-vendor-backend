import type { AdminPermission } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export function requirePermission(...permissions: AdminPermission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ ok: false, message: "Authorization Required" });
      }
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }
      const adminProfile = req.adminProfile;
      if (!adminProfile) {
        return res
          .status(403)
          .json({ ok: false, message: "Forbidden: No admin profile found" });
      }
      const hasPermission = permissions.some((perm) =>
        adminProfile.permissions.includes(perm)
      );
      if (!hasPermission) {
        return res
          .status(403)
          .json({ ok: false, message: "Forbidden: Insufficient permissions" });
      }
      next();
    } catch (err) {
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    }
  };
}
