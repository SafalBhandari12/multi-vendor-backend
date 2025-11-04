import z from "zod";

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  countryCode: z.number().min(1).max(999).optional(),
  purpose: z.enum(["LOGIN", "REGISTER"]),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  countryCode: z.number().min(1).max(999).optional(),
  verificationId: z.string().min(2).max(100),
  code: z.string().min(4).max(8),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
