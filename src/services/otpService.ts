import axios from "axios";
import config from "../config/index.js";
import prisma from "../db/prismaClient.js";

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

  const resp = await axios.post(
    url,
    {},
    { headers: { authToken: config.otp.authToken } }
  );

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
