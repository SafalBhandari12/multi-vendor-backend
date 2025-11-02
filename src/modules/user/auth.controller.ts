import type { Request, Response } from "express";
import z from "zod";
import { sendOtp, validateOtp } from "../../services/otpService.js";
import prisma from "../../db/prismaClient.js";
import {
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from "../../services/tokenService.js";
import { randomUUID } from "crypto";
import config from "../../config/index.js";

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  countryCode: z.number().min(1).max(999).optional(),
  purpose: z.enum(["LOGIN", "REGISTER"]),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  countryCode: z.number().min(1).max(999).optional(),
  verificationId: z.string().min(2).max(100),
  code: z.string().min(4).max(8),
});

class AuthController {
  static async sendOtpHandler(req: Request, res: Response) {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw {
        status: 400,
        message: parseResult.error,
        source: "sendOtpHandler",
      };
    }
    const { phone, countryCode, purpose } = parseResult.data;
    const result = await sendOtp({
      phone,
      countryCode: String(countryCode),
      purpose,
    });
    console.log(result);
    return res.json({
      ok: true,
      verificationId: result.verificationId,
      timeout: result.timeoutSeconds,
    });
  }
  static async verifyOtpHandler(req: Request, res: Response) {
    const validatedData = verifyOtpSchema.safeParse(req.body);
    if (!validatedData.success) {
      throw {
        status: 400,
        message: validatedData.error,
        source: "verifyOtpHandler",
      };
    }
    const { phone, countryCode, verificationId, code } = validatedData.data;
    const validation = validateOtp({
      phone,
      countryCode: String(countryCode),
      verificationId,
      code,
    });

    if (!(await validation).ok)
      return res.status(400).json({ ok: false, message: "Invalid OTP" });

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          countryCode: String(countryCode),
          phoneVerified: true,
          status: "ACTIVE",
          role: "CUSTOMER",
        },
      });
    } else if (!user.phoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, status: "ACTIVE" },
      });
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshRaw = signRefreshToken({
      sub: user.id,
      tokenId: randomUUID(),
    });

    await storeRefreshToken({
      userId: user.id,
      refreshToken: refreshRaw,
      ip: req.ip ?? null,
      userAgent: req.get("User-Agent") ?? null,
    });

    res.cookie("refreshToken", refreshRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Number(config.refreshExpiresIn), // 30 days
    });

    return res.json({
      accessToken,
      expiresIn: config.accessExpiresIn,
      user: { id: user.id, phone: user.phone, role: user.role },
    });
  }
  static async refreshHandler(req: Request, res: Response) {
    const raw = req.cookies?.refreshToken;
    if (!raw) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    let payload;
    console.log(raw);
    try {
      payload = verifyRefreshToken(raw);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const userId = (payload as any).sub;
    const newRaw = await rotateRefreshToken({
      oldTokenRaw: raw,
      userId,
      ip: req.ip ?? null,
      userAgent: req.get("User-Agent") ?? null,
    });
    const accessToken = signAccessToken({
      sub: userId,
      role: (payload as any).role,
    });

    res.cookie("refreshToken", newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Number(config.refreshExpiresIn), // 30 days
    });

    return res.json({ accessToken, expiresIn: config.accessExpiresIn });
  }
  static async logOutHandler(req: Request, res: Response) {
    const raw = req.cookies?.refreshToken;
    if (raw) revokeRefreshToken(raw);
    res.clearCookie("refreshToken");
    return res.json({ ok: true });
  }
}

export default AuthController;
