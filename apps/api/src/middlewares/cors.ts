import type { NextFunction, Request, Response } from "express";
import { config } from "@perpex/config";

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.header("Access-Control-Allow-Origin", config.FRONTEND_URL);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
};
