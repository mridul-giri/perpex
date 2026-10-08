import { config } from "@perpex/config";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { TokenPayload, UserPayload } from "@perpex/types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, config.AUTH_SECRET) as TokenPayload;

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
