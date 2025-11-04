import express from "express";
import vendorAuthRoutes from "./auth.route.js";

const router: express.Router = express.Router();

router.use("/auth", vendorAuthRoutes);

export default router;
