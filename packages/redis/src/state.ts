import { publisher } from "./client";

export const rememberWrite = async (
  key: string,
  value: string,
  ttlSeconds: number,
) => {
  const result = await publisher.set(key, value, { NX: true, EX: ttlSeconds });
  return result === "OK";
};

export const readWrite = async (key: string) => {
  return await publisher.get(key);
};

export const completeWrite = async (
  key: string,
  value: string,
  ttlSeconds: number,
) => {
  await publisher.set(key, value, { EX: ttlSeconds });
};

export const forgetWrite = async (key: string) => {
  await publisher.del(key);
};
