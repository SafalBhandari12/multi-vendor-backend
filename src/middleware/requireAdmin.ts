import type { NextFunction, Request, Response } from "express";
import prisma from "../db/prismaClient.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role || "")) {
      return res
        .status(403)
        .json({ ok: false, message: "Forbidden: Admins only" });
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { id: req.user.sub },
    });
    if (!adminProfile || !adminProfile.isActive) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: Inactive admin account",
      });
    }
    req.adminProfile = adminProfile;
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
}
