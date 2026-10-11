import jwt from "jsonwebtoken";
import { config } from "@perpex/config";
import type { TokenPayload } from "@perpex/types";

export const signToken = (user: {
  id: string;
  name: string;
  email: string;
}) => {
  const payload: TokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
  };

  return jwt.sign(payload, config.AUTH_SECRET, { expiresIn: "7d" });
};
