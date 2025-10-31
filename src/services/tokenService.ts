import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/index.js";
import { hashToken, randomId } from "../utils/hash.js";
import prisma from "../db/prismaClient.js";

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
