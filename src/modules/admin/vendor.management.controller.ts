import type { Request, Response } from "express";
import {
  approveVendorSchema,
  getAllVendorQuery,
  getVendorActivityLogsParams,
  getVendorByIdParams,
  rejectVendorReasonSchema,
  suspendVendorSchema,
} from "./vendor.management.validation.js";
import VendorManagementService from "./vendor.management.service.js";

class VendorManagement {
  static async getAllVendors(req: Request, res: Response) {
    const parsedQuery = getAllVendorQuery.parse(req.query);

    const { limit, offset, status, search } = parsedQuery;

    const { vendors, total } = await VendorManagementService.getAllVendors({
      limit,
      offset,
      status,
      search,
    });

    return res.json({
      ok: true,
      total,
      limit,
      offset,
      vendors,
    });
  }
  static async getVendorById(req: Request, res: Response) {
    const parsedResult = getVendorByIdParams.parse(req.params);

    const vendor = await VendorManagementService.getVendorById(parsedResult);

    if (!vendor) {
      return res.status(404).json({
        ok: false,
        message: "Vendor not found",
      });
    }

    return res.json({
      ok: true,
      vendor,
    });
  }
  static async approveVendor(req: Request, res: Response) {
    const { vendorId } = getVendorByIdParams.parse(req.params);

    const adminId = req.user!.sub;

    const { comission } = approveVendorSchema.parse(req.body);

    const result = await VendorManagementService.approveVendor(
      vendorId,
      adminId,
      comission
    );
    return res.status(200).json({
      ok: true,
      message: "Vendor approved successfully",
      vendor: result.vendor,
      user: {
        id: result.user.id,
        role: result.user.role,
        previousRole: "CUSTOMER",
      },
    });
  }
  static async rejectVendor(req: Request, res: Response) {
    const { vendorId } = getVendorByIdParams.parse(req.params);
    const adminId = req.user!.sub;
    const { reason } = rejectVendorReasonSchema.parse(req.body);

    const result = await VendorManagementService.rejectVendor(
      vendorId,
      adminId,
      reason
    );

    return res.status(200).json({
      ok: true,
      message: "Vendor rejected successfully",
      vendor: {
        id: result.updatedVendor.id,
        businessName: result.updatedVendor.businessName,
        status: result.updatedVendor.status,
        rejectionReason: result.updatedVendor.rejectedReason,
      },
    });
  }
  static async suspendVendor(req: Request, res: Response) {
    const { vendorId } = getVendorByIdParams.parse(req.params);
    const adminId = req.user!.sub;
    const { reason } = suspendVendorSchema.parse(req.body);

    const vendor = await VendorManagementService.suspendVendor(
      vendorId,
      adminId,
      reason
    );

    return res.status(200).json({
      ok: true,
      message: "Vendor suspended successfully",
      vendor: {
        id: vendor.updatedVendor.id,
        status: vendor.updatedVendor.status,
      },
    });
  }
  //   TODO: Add suspendVendor Method
  static async getVendorActivityLogs(req: Request, res: Response) {
    const { vendorId, limit, offset } = getVendorActivityLogsParams.parse(
      req.params
    );

    const logs = await VendorManagementService.getVendorActivityLogs(
      vendorId,
      limit,
      offset
    );

    return res.status(200).json({
      ok: true,
      total: logs.total,
      logs,
    });
  }
}

export default VendorManagement;
