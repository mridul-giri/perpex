import type { UserPayload } from "@perpex/types";

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

export {};
