import type { Request, Response, NextFunction } from "express";
import { parseError } from "../utils/parse-error";

export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [status, message] = parseError(error);

  res.status(status).json(message);
};
