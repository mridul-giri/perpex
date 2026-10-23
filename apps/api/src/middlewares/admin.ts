import type { NextFunction, Request, Response } from "express";
import { prisma } from "@perpex/db";
import { ApiError } from "../utils/api-error";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return next(new ApiError(403, "Admin access required"));
    }

    next();
  } catch (error) {
    next(error);
  }
};
