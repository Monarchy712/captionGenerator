import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      exposedHeaders: ["x-admin-password"],
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
