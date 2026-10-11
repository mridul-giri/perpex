import { config } from "@perpex/config";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { TokenPayload, UserPayload } from "@perpex/types";
import { ApiError } from "../utils/api-error";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Unauthorized"));
  }

  try {
    const payload = jwt.verify(token, config.AUTH_SECRET) as TokenPayload;

    const user: UserPayload = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    req.user = user;

    next();
  } catch (error) {
    next(new ApiError(401, "Unauthorized"));
  }
};
