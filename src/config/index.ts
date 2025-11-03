import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  accessSecret: process.env.JWT_ACCESS_SECRET || "secret-key",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "secret-key",
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  otp: {
    sendUrl: process.env.OTP_SEND_URL,
    validateUrl: process.env.OTP_VALIDATE_URL,
    customerId: process.env.OTP_CUSTOMER_ID || "",
    authToken: process.env.OTP_AUTH_TOKEN,
  },
  refreshCookieMaxAge: Number(
    process.env.REFRESH_TOKEN_MAX_AGE || 30 * 24 * 3600 * 1000
  ),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 10),
  otpLimitWindowMs: Number(process.env.OTP_LIMIT_WINDOW_MS || 300_000),
  otpLimitMax: Number(process.env.OTP_LIMIT_MAX || 5),
  imageKitPublicKey: process.env.IMAGE_KIT_PUBLIC_KEY || "",
  imageKitPrivateKey: process.env.IMAGE_KIT_PRIVATE_KEY || "",
  imageKitUrlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || "",
};
