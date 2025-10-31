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
import axios from "axios";
import cookieParser from "cookie-parser";

dotenv.config();

const app: express.Application = express();

app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));
app.use(helmet());
app.use(cookieParser());

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Welcome to the API");
});

app.use("/api", routes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  console.log("Error source ", err.source || "unknown");
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";
  if (axios.isAxiosError(err)) {
    status = err.response?.status;
    message = err.response?.data;
  }

  res.status(status).json({ error: message });
});

export default app;
