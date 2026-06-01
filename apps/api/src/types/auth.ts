import type { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  sub: string;
  name: string;
  email: string;
}

export interface UserPayload {
  id: string;
  name: string;
  email: string;
}
