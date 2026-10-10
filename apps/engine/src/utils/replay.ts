import { getGroupOffset, readStreamRange } from "@perpex/redis";

export const replayMissed = async (
  streamKey: string,
  group: string,
  fromOffset: string | null,
  handler: (data: unknown, id: string) => Promise<void>,
): Promise<number> => {
  if (!fromOffset) {
    console.log("no snapshot offset; nothing to replay");
    return 0;
  }

  const groupOffset = await getGroupOffset(streamKey, group);
  if (!groupOffset) {
    console.log("no consumer-group offset; nothing to replay");
    return 0;
  }

  const missed = await readStreamRange(streamKey, fromOffset, groupOffset);
  if (missed.length === 0) {
    console.log("no missed messages to replay");
    return 0;
  }

  console.log(`replaying ${missed.length} missed messages`);

  for (const entry of missed) {
    await handler(entry.data, entry.id);
  }

  return missed.length;
};
