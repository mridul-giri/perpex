import { ZodError } from "zod";
import type { ApiErrorBody } from "@perpex/types";
import { ApiError } from "./api-error";

export const buildErrorBody = (
  error: unknown,
): { status: number; body: ApiErrorBody } => {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: { message: error.issues[0]?.message ?? "Invalid request" },
      },
    };
  }

  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: { error: { message: error.message } },
    };
  }

  return {
    status: 500,
    body: { error: { message: "Internal server error" } },
  };
};
