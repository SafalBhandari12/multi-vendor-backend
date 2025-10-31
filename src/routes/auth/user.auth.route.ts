import express, { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import AuthController from "./user.auth.controller.js";
import requireAuth from "../../middleware/requireAuth.js";
import { otpLimiter } from "../../middleware/limiter.js";

const router: express.Router = express.Router();

router.post(
  "/send-otp",
  otpLimiter,
  asyncHandler(AuthController.sendOtpHandler)
);
router.post(
  "/verify-otp",
  otpLimiter,
  asyncHandler(AuthController.verifyOtpHandler)
);
router.post("/refresh", asyncHandler(AuthController.refreshHandler));
router.post("/logout", asyncHandler(AuthController.logOutHandler));
router.get("/me", requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
