import express from "express";
import authRoutes from "./user/index.js";
import superAdminRoutes from "./superAdmin/index.js";
import adminRoutes from "./admin/index.js";
import vendorRoutes from "./vendor/index.js";

const routes: express.Router = express.Router();

routes.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

routes.use("/user", authRoutes);
routes.use("/super-admin", superAdminRoutes);
routes.use("/vendor", vendorRoutes);
routes.use("/admin", adminRoutes);

export default routes;
