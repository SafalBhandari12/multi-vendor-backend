import express from "express";
import authRoutes from "./user/user.auth.route.js";
import adminRoutes from "./superAdmin/management.route.js";
import vendorRoutes from "./vendor/vendor.route.js";

const routes: express.Router = express.Router();

routes.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

routes.use("/auth", authRoutes);
routes.use("/admin", adminRoutes);
routes.use("/vendor", vendorRoutes);

export default routes;
