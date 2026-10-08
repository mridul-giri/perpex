const readRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable ${name}`);
  return value;
};

export const config = {
  DATABASE_URL: readRequiredEnv("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? "3000"),
  AUTH_SECRET: readRequiredEnv("AUTH_SECRET"),
  ORDERS_CREATE: readRequiredEnv("ORDERS_CREATE"),
  ORDERS_ACK: readRequiredEnv("ORDERS_ACK"),
  RES_TIMEOUT: Number(process.env.RES_TIMEOUT ?? "30000"),
};
