import { ZodError } from "zod";
import { ApiError } from "./api-error";

export const parseError = (error: any): [number, string] => {
  if (error instanceof ZodError) {
    console.log("[Zod Error]", error);
    return [403, error.issues[0]?.message || "Invalid request"];
  } else if (error instanceof ApiError) {
    return [error.status, error.message || "Internal server error"];
  } else {
    console.error("[Exceptional Error]", error);
    return [500, "Internal server error"];
  }
};
