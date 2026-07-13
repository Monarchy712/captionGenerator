import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

export function createApp() {
  const app = express();

  const origins = config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);

  app.use(
    cors({
      origin: origins.includes("*")
        ? true
        : (origin, cb) => {
            if (!origin || origins.includes(origin)) cb(null, true);
            else cb(null, false);
          },
      credentials: true,
      exposedHeaders: ["x-admin-password"],
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", routes);

  // Production: serve the Vite build from the same service (one Railway URL)
  const clientDist = path.resolve(__dirname, "../../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
