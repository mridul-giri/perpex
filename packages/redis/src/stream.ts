import type { StreamMessages } from "@perpex/types";
import { publisher, subscriber } from "./client";

export const publishToStream = async (streamKey: string, payload: any) => {
  console.log("publish payload", payload);
  const data = JSON.stringify(payload);
  return await publisher.xAdd(streamKey, "*", { data });
};

export const readFromStream = async (streamKey: string) => {
  return (await subscriber.xRead([{ key: streamKey, id: "$" }], {
    BLOCK: 0,
    COUNT: 1,
  })) as StreamMessages;
};
