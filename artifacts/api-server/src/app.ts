import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import healthRouter from "./routes/health";
import { registerRoutes } from "./routes/routes";
import { logger } from "./lib/logger";
import { applySecurityMiddlewares } from "./securityHardening";

const app: Express = express();

const allowedCorsOrigins = new Set([
  "https://burkinawatch.com",
]);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.disable("x-powered-by");

app.use(cors({
  origin(origin, callback) {
    // Les clients mobiles natifs et les requêtes sans en-tête Origin
    // ne nécessitent pas de validation CORS.
    callback(null, !origin || allowedCorsOrigins.has(origin));
  },
  credentials: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

applySecurityMiddlewares(app);

app.use("/api", healthRouter);

export async function initializeApp() {
  await registerRoutes(app);
}

export default app;
