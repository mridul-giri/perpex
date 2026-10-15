import { setTokenGetter } from "./http";

const TOKEN_KEY = "perpex_token";
const USER_KEY = "perpex_userId";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

const decodeTokenPayload = (token: string): { name?: string } | null => {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { name?: string };
  } catch {
    return null;
  }
};

export const getUserName = (): string | null => {
  const token = getToken();
  return token ? (decodeTokenPayload(token)?.name ?? null) : null;
};

export const isLoggedIn = (): boolean => !!getToken();

export const setAuthData = (token: string, userId?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  if (userId) localStorage.setItem(USER_KEY, userId);
};

export const clearAuthData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

setTokenGetter(getToken);
