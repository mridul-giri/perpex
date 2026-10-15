import { AxiosError } from "axios";
import { client } from "./client";
import { ApiError, type ApiErrorBody } from "./errors";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  idempotencyKey?: string;
}

export const apiFetch = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { body, params, idempotencyKey, headers, method, signal } = options;

  try {
    const res = await client.request<T>({
      url: path,
      method,
      params,
      data: body,
      signal: signal ?? undefined,
      headers: {
        ...(headers as Record<string, string> | undefined),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
    });
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        (error.response?.data as ApiErrorBody | undefined)?.error?.message ??
        `Request failed (${error.response?.status ?? 0})`;
      throw new ApiError(error.response?.status ?? 0, message);
    }
    throw error;
  }
};
