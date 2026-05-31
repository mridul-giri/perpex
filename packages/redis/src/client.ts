import { createClient } from "redis";

export const publisher = createClient();
export const subscriber = createClient();

export const connectRedis = async () => {
  await Promise.all([publisher.connect(), subscriber.connect()]);
};
