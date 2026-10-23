import { clearSession, saveSession } from "@/lib/session";
import { apiRequest } from "./client";

export const DEMO_ACCOUNT = { email: "alice@demo.local", password: "demo1234" };

export const signIn = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await apiRequest<{ userId: string; token: string }>(
    "/auth/signin",
    { method: "POST", body: credentials },
  );
  saveSession(response.token, response.userId);
};

export const signUp = (input: {
  name: string;
  email: string;
  password: string;
}) => apiRequest("/auth/signup", { method: "POST", body: input });

export const signOut = clearSession;
