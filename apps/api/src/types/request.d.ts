import type { UserPayload } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

export {};
