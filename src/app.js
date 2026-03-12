import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import apiRouter from "./routes/index.routes.js";
import paymentsRouter from "./modules/payment/payments.routes.js";
import morganMiddleware from "./middlewares/morgan.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/error.class.js";
import { FRONTEND_URL, NODE_ENV } from "./configs/serverConfig.js";
import swaggerDocument from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";
import setupSwagger from "./docs/swagger.js";
import path from "node:path";

export const app = express();

app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

app.use("/payments", paymentsRouter);
app.use(cookieParser());
app.use(express.json());
/// TODO important to update upon production
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.set("trust proxy", 1);
app.use(morganMiddleware);

if (NODE_ENV !== "production") {
  app.use(
    "/__swagger-dev",
    express.static(path.join(process.cwd(), "src/docs/swagger-dev")),
  );
  await setupSwagger(app);
}
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.files) req.files.length = 0;
    if (req.file) req.file = undefined;
  });
  next();
});
app.use("/api", apiRouter);
app.get("/health", (_, res) => res.sendStatus(200));

app.use(() => {
  throw new AppError(404, "bad route", true, "bad route");
});

app.use(errorMiddleware);
