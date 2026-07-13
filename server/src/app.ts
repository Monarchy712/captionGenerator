import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

/** Resolve Vite build folder across local + Railway layouts. */
function resolveClientDist(): string | null {
  const candidates = [
    // server/dist -> ../../client/dist (correct for compiled output)
    path.resolve(__dirname, "../../client/dist"),
    // process cwd at monorepo root
    path.resolve(process.cwd(), "client/dist"),
    // process cwd inside server/
    path.resolve(process.cwd(), "../client/dist"),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }
  return null;
}

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

  const clientDist = resolveClientDist();
  if (clientDist) {
    console.log(`[static] Serving frontend from ${clientDist}`);
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    console.warn(
      "[static] client/dist not found — UI will 404. Ensure build:railway builds the client."
    );
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
