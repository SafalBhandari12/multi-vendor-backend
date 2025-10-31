import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import routes from "./routes/index.js";
import dotenv from "dotenv";

dotenv.config();

const app: express.Application = express();

app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));
app.use(helmet());

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

app.use("/api", routes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("Error caught by handler", err);
  console.log("Error source ", err.source || "unknown");
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

export default app;
