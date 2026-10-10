import type { StreamMessages } from "@perpex/types";
import { publisher, subscriber } from "./client";

let muted = false;

export const setStreamMuted = (value: boolean) => {
  muted = value;
};

export const publishToStream = async (streamKey: string, payload: any) => {
  if (muted) return null;

  const data = JSON.stringify(payload);
  return await publisher.xAdd(streamKey, "*", { data });
};

export const createConsumerGroup = async (
  streamKey: string,
  group: string,
  startId = "0",
) => {
  try {
    await publisher.xGroupCreate(streamKey, group, startId, { MKSTREAM: true });
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

export const getGroupOffset = async (
  streamKey: string,
  group: string,
): Promise<string | null> => {
  try {
    const groups = await subscriber.xInfoGroups(streamKey);
    const match = groups.find((entry) => entry.name === group);
    if (!match) return null;
    return String(match["last-delivered-id"]);
  } catch {
    return null;
  }
};

export const readStreamRange = async (
  streamKey: string,
  startId: string,
  endId: string,
): Promise<{ id: string; data: unknown }[]> => {
  const entries = await subscriber.xRange(streamKey, `(${startId}`, endId);
  const messages: { id: string; data: unknown }[] = [];

  for (const entry of entries) {
    const raw = entry.message.data;
    if (typeof raw !== "string") continue;
    messages.push({ id: entry.id, data: JSON.parse(raw) });
  }

  return messages;
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
