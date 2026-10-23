import axios, { AxiosError } from "axios";
import { env } from "@/lib/env";
import { getToken } from "@/lib/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const client = axios.create({ baseURL: env.apiUrl });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  idempotent?: boolean;
}

export const apiRequest = async <T>(
  path: string,
  { method = "GET", body, params, signal, idempotent }: RequestOptions = {},
): Promise<T> => {
  try {
    const response = await client.request<T>({
      url: path,
      method,
      data: body,
      params,
      signal,
      headers: idempotent
        ? { "Idempotency-Key": newIdempotencyKey() }
        : undefined,
    });
    return response.data;
  } catch (error) {
    if (!(error instanceof AxiosError)) throw error;

    const status = error.response?.status ?? 0;
    const body = error.response?.data as { error?: { message?: string } };
    const message = body?.error?.message ?? `Request failed (${status})`;
    throw new ApiError(status, message);
  }
};
