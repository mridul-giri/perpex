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
  FUNDING_INTERVAL_SECONDS: Number(
    process.env.FUNDING_INTERVAL_SECONDS ?? "28800",
  ),
  SNAPSHOT_INTERVAL: Number(process.env.SNAPSHOT_INTERVAL ?? "300"),
  S3_BUCKET: process.env.S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};
