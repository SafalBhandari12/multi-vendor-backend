import express from "express";
import userAuthRoutes from "./user.auth.route.js";

const router: express.Router = express.Router();

router.use("/auth", userAuthRoutes);

export default router;
