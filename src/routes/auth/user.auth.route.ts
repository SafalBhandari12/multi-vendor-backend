import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import AuthController from "./user.auth.controller.js";

const router: express.Router = express.Router();

router.post("/send-otp", asyncHandler(AuthController.sendOtpHandler));
router.post("/verify-otp", asyncHandler(AuthController.verifyOtpHandler));
router.post("/refresh", asyncHandler(AuthController.refreshHandler));
router.post("/logout", asyncHandler(AuthController.logOutHandler));

export default router;
