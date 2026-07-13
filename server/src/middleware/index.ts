import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/helpers";
import { config } from "../config";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  console.error("[Error]", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

/**
 * Simple password gate for admin routes.
 * Header: x-admin-password: <password>
 * Or Authorization: Bearer <password>
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const headerPwd = req.header("x-admin-password");
  const auth = req.header("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const password = headerPwd || bearer;

  if (!password || password !== config.adminPassword) {
    next(new AppError(401, "Unauthorized — admin password required"));
    return;
  }
  next();
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
