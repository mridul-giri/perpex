import type { Request, Response, NextFunction } from "express";
import { forgetWrite } from "@perpex/redis";
import { parseError } from "../utils/parse-error";

export const errorMiddleware = async (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [status, message] = parseError(error);

  const redisKey = res.locals.idempotencyKey;

  if (redisKey) {
    res.locals.idempotencyFailed = true;
    await forgetWrite(redisKey).catch(() => {});
  }

  res.status(status).json(message);
};
