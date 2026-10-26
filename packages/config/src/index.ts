const readRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable ${name}`);
  return value;
};

export const config = {
  DATABASE_URL: readRequiredEnv("DATABASE_URL"),
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  API_URL: process.env.API_URL ?? "http://localhost:3001",
  PORT: Number(process.env.PORT ?? "3000"),
  WS_PORT: Number(process.env.WS_PORT ?? "3002"),
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  AUTH_SECRET: readRequiredEnv("AUTH_SECRET"),
  ORDERS_CREATE: readRequiredEnv("ORDERS_CREATE"),
  ORDERS_ACK: readRequiredEnv("ORDERS_ACK"),
  RES_TIMEOUT: Number(process.env.RES_TIMEOUT ?? "30000"),
  FUNDING_INTERVAL_SECONDS: Number(
    process.env.FUNDING_INTERVAL_SECONDS ?? "28800",
  ),
  SNAPSHOT_INTERVAL: Number(process.env.SNAPSHOT_INTERVAL ?? "900"),
  S3_BUCKET: process.env.S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};
