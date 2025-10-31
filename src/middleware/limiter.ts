import rateLimit from "express-rate-limit";
import config from "../config/index.js";

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  limit: config.rateLimitMax, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

export const otpLimiter = rateLimit({
  windowMs: config.otpLimitWindowMs, // 15 minutes
  limit: config.otpLimitMax, // 3 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

export default limiter;
