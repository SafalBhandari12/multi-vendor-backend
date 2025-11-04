import axios from "axios";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../../config/index.js";
import prisma from "../../db/prismaClient.js";
import { hashToken, randomId } from "../../utils/hash.js";

export async function sendOtp({
  phone,
  countryCode = "91",
  purpose = "LOGIN",
}: {
  phone: string;
  countryCode?: string;
  purpose?: "LOGIN" | "REGISTER";
}) {
  const url = `${config.otp.sendUrl}?countryCode=${encodeURIComponent(
    countryCode
  )}&customerId=${encodeURIComponent(
    config.otp.customerId
  )}&flowType=SMS&mobileNumber=${encodeURIComponent(phone)}`;
  console.log(url);

  const resp = await axios.post(
    url,
    {},
    { headers: { authToken: config.otp.authToken } }
  );
  console.log(resp.data);

  const data = resp.data?.data ?? {};

  const verificationId = String(
    data.verificationId ?? (data.verificationId || "")
  );
  const timeoutSeconds = Number(data.timeout || 60);
  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

  const record = await prisma.otpVerification.create({
    data: {
      phone,
      countryCode,
      verificationId,
      status: "PENDING",
      expiresAt,
      purpose,
      attempts: 0,
    },
  });
  return { verificationId, timeoutSeconds, record: record.id };
}

export async function validateOtp({
  phone,
  countryCode = "91",
  verificationId,
  code,
}: {
  phone: string;
  countryCode?: string;
  verificationId: string;
  code: string;
}) {
  const url = `${config.otp.validateUrl}?countryCode=${encodeURIComponent(
    countryCode
  )}&mobileNumber=${encodeURIComponent(
    phone
  )}&verificationId=${encodeURIComponent(
    verificationId
  )}&customerId=${encodeURIComponent(
    config.otp.customerId
  )}&code=${encodeURIComponent(code)}`;

  const resp = await axios.get(url, {
    headers: { authToken: config.otp.authToken },
  });

  const data = resp.data?.data ?? {};
  const status = (data.verificationStatus || "").toUpperCase();

  const local = await prisma.otpVerification.findUnique({
    where: { verificationId, phone },
  });

  if (local) {
    await prisma.otpVerification.update({
      where: { id: local.id },
      data: {
        status: status === "VERIFICATION_COMPLETED" ? "VERIFIED" : "FAILED",
        verifiedAt: status === "VERIFICATION_COMPLETED" ? new Date() : null,
        attempts: { increment: 1 },
      },
    });
  }
  return { ok: status === "VERIFICATION_COMPLETED", raw: data };
}

// Token Service Functions
export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessExpiresIn,
  } as SignOptions);
};

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
  } as SignOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.accessSecret);

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.refreshSecret);

export async function storeRefreshToken({
  userId,
  refreshToken,
  ip,
  userAgent,
}: {
  userId: string;
  refreshToken: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const hashed = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + Number(config.refreshExpiresIn));
  console.log("expires at", expiresAt);
  return prisma.refreshToken.create({
    data: {
      userId,
      token: hashed,
      expiresAt,
      ipAddress: ip ?? null,
      userAgent: userAgent ?? null,
    },
  });
}

export async function rotateRefreshToken({
  oldTokenRaw,
  userId,
  ip,
  userAgent,
}: {
  oldTokenRaw: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const hashedOld = hashToken(oldTokenRaw);
  const old = await prisma.refreshToken.findFirst({
    where: {
      userId,
      token: hashedOld,
      isRevoked: false,
    },
  });

  if (!old) throw new Error("Invalid Or Expired refresh token");

  await prisma.refreshToken.update({
    where: { id: old.id },
    data: { isRevoked: true, revokedAt: new Date() },
  });

  const newRaw = signRefreshToken({ sub: userId, tokenId: randomId() });

  await storeRefreshToken({
    userId,
    refreshToken: newRaw,
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  });
  return newRaw;
}

export async function revokeRefreshToken(tokenRaw: string) {
  const hashed = hashToken(tokenRaw);
  const existing = await prisma.refreshToken.findFirst({
    where: { token: hashed, isRevoked: false },
  });
  if (!existing) throw new Error("Invalid or expired refresh token");
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { isRevoked: true, revokedAt: new Date() },
  });
}
