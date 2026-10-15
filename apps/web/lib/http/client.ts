import axios from "axios";
import { env } from "@/lib/env";

type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

export const setTokenGetter = (getter: TokenGetter) => {
  getToken = getter;
};

export const client = axios.create({ baseURL: env.apiUrl });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
