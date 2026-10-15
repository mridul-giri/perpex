import { setAuthData } from "@/lib/auth";
import { apiFetch } from "@/lib/http";

export const DEMO_EMAIL = "alice@demo.local";
export const DEMO_PASSWORD = "demo1234";

export const signInDemo = async (): Promise<void> => {
  const res = await apiFetch<{ userId: string; token: string }>(
    "/auth/signin",
    { method: "POST", body: { email: DEMO_EMAIL, password: DEMO_PASSWORD } },
  );
  setAuthData(res.token, res.userId);
};
