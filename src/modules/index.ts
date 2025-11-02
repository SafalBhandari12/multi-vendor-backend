import express from "express";
import authRoutes from "./user/auth.route.js";
import adminRoutes from "./admin/management.route.js";

const routes: express.Router = express.Router();

routes.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

routes.use("/auth", authRoutes);
routes.use("/admin", adminRoutes);

export default routes;
