import express from "express";
import adminManagementRoutes from "./management.route.js";

const router: express.Router = express.Router();

router.use("/admins", adminManagementRoutes);

export default router;
