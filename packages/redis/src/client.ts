import { createClient } from "redis";
import { config } from "@perpex/config";

export const publisher = createClient({ url: config.REDIS_URL });
export const subscriber = createClient({ url: config.REDIS_URL });

export const connectRedis = async () => {
  await Promise.all([publisher.connect(), subscriber.connect()]);
};
