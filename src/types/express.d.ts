import type { AdminPermission } from "@prisma/client";
import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role?: string;
      };
      adminProfile?: {
        id: string;
        designation: string | null;
        department: string | null;
        permissions: AdminPermission[];
        isActive: boolean;
      };
      vendorProfile?: {
        id: string;
      };
    }
  }
}
