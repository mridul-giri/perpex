import type { StreamMessages } from "@perpex/types";
import { publisher, subscriber } from "./client";

export const publishToStream = async (streamKey: string, payload: any) => {
  const data = JSON.stringify(payload);
  return await publisher.xAdd(streamKey, "*", { data });
};

export const createConsumerGroup = async (streamKey: string, group: string) => {
  try {
    await publisher.xGroupCreate(streamKey, group, "0", { MKSTREAM: true });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }
};

export const consumeFromGroup = async (
  streamKey: string,
  group: string,
  consumer: string,
  handler: (data: unknown, id: string) => Promise<void>,
  options: { count?: number; blockMs?: number } = {},
) => {
  const count = options.count ?? 100;
  const blockMs = options.blockMs ?? 5000;

  while (true) {
    try {
      const response = (await subscriber.xReadGroup(
        group,
        consumer,
        [{ key: streamKey, id: ">" }],
        { BLOCK: blockMs, COUNT: count },
      )) as StreamMessages | null;

      if (!response) continue;

      for (const streamData of response) {
        for (const message of streamData.messages) {
          try {
            const raw = message.message.data;

            if (typeof raw !== "string") {
              console.error(`Invalid message data: ${raw}`);
              await publisher.xAck(streamKey, group, message.id);
              continue;
            }

            await handler(JSON.parse(raw), message.id);
            await publisher.xAck(streamKey, group, message.id);
          } catch (error) {
            console.error(`Failed in processing consumer data: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error(`Redis consumer crashed: ${error}`);
    }
  }
};

export const consumeStream = async (
  streamKey: string,
  handler: (data: unknown, id: string) => Promise<void>,
  options: { count?: number; blockMs?: number } = {},
) => {
  const count = options.count ?? 100;
  const blockMs = options.blockMs ?? 5000;
  let lastId = "$";

  while (true) {
    try {
      const response = (await subscriber.xRead(
        { key: streamKey, id: lastId },
        { BLOCK: blockMs, COUNT: count },
      )) as StreamMessages | null;

      if (!response) continue;

      for (const streamData of response) {
        for (const message of streamData.messages) {
          lastId = message.id;

          try {
            const raw = message.message.data;

            if (typeof raw !== "string") {
              console.error(`Invalid message data: ${raw}`);
              continue;
            }

            await handler(JSON.parse(raw), message.id);
          } catch (error) {
            console.error(`Failed in processing stream data: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error(`Stream reader crashed: ${error}`);
    }
  }
};
