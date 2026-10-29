const TOKEN_KEY = "perpex_token";
const USER_ID_KEY = "perpex_userId";

const inBrowser = () => typeof window !== "undefined";

export const getToken = () =>
  inBrowser() ? localStorage.getItem(TOKEN_KEY) : null;

export const isSignedIn = () => getToken() !== null;

export const saveSession = (token: string, userId: string) => {
  if (!inBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, userId);
};

export const clearSession = () => {
  if (!inBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const getUserName = () => {
  const payload = getToken()?.split(".")[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { name } = JSON.parse(json) as { name?: string };
    return name ?? null;
  } catch {
    return null;
  }
};
