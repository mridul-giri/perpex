import type { NextFunction, Request, Response } from "express";
import { completeWrite, readWrite, rememberWrite } from "@perpex/redis";
import { ApiError } from "../utils/api-error";

const TTL_SECONDS = 60 * 60;

type IdempotencyRecord =
  | { status: "PROCESSING"; createdAt: string }
  | {
      status: "COMPLETED";
      createdAt: string;
      response: { statusCode: number; body: unknown };
    };

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.header("Idempotency-Key");
    if (!header) {
      throw new ApiError(400, "Missing Idempotency-Key header");
    }

    const redisKey = `idempotency:${req.user.id}:${req.method}:${req.path}:${header}`;

    const processing: IdempotencyRecord = {
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
    };

    const claimed = await rememberWrite(
      redisKey,
      JSON.stringify(processing),
      TTL_SECONDS,
    );

    if (!claimed) {
      const stored = await readWrite(redisKey);
      if (stored === null) {
        next();
        return;
      }

      const record = JSON.parse(stored) as IdempotencyRecord;

      if (record.status === "PROCESSING") {
        throw new ApiError(409, "Request already in progress");
      }

      res.status(record.response.statusCode).json(record.response.body);
      return;
    }

    res.locals.idempotencyKey = redisKey;
    storeCompletedResponse(res, redisKey);
    next();
  } catch (error) {
    next(error);
  }
};

const storeCompletedResponse = (res: Response, redisKey: string) => {
  const sendJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (!res.locals.idempotencyFailed) {
      const completed: IdempotencyRecord = {
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        response: { statusCode: res.statusCode, body },
      };

      completeWrite(redisKey, JSON.stringify(completed), TTL_SECONDS).catch(
        (error) => {
          console.error("Failed to store idempotency response", error);
        },
      );
    }

    return sendJson(body);
  }) as unknown as Response["json"];
};
