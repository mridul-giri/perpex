import type { Request, Response, NextFunction } from "express";
import { forgetWrite } from "@perpex/redis";
import { buildErrorBody } from "../utils/error-response";

export const errorMiddleware = async (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { status, body } = buildErrorBody(error);

  const redisKey = res.locals.idempotencyKey;

  if (redisKey) {
    res.locals.idempotencyFailed = true;
    await forgetWrite(redisKey).catch(() => {});
  }

  if (status >= 500) console.error("[API Error]", error);

  res.status(status).json(body);
};
