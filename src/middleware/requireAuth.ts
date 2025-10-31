import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.js";
import { verifyAccessToken } from "../services/tokenService.js";

export default function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = auth.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = { sub: (payload as any).sub, role: (payload as any).role };
  return next();
}
