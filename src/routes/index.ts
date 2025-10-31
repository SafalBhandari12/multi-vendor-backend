import express from "express";

const routes: express.Router = express.Router();

routes.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

routes.use("/auth", (await import("./auth/user.auth.route.js")).default);

export default routes;
