import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../modules/user/token.service.js";

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
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

    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = { sub: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    console.error("Error in requireAuth middleware:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
