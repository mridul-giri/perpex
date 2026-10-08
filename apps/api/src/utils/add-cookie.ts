import type { Response } from "express";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "@perpex/types";

export const addCookie = async (user: any, res: Response) => {
  const payload: TokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
  };

  const token = jwt.sign(payload, process.env.AUTH_SECRET!, {
    expiresIn: "1h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600 * 1000,
  });
};
